import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { MIN_TRANSFER_AMOUNT } from "@/lib/campaign-finance";
import { prisma } from "@/lib/prisma";

const MIN_TRANSFER_AMOUNT_DECIMAL = new Prisma.Decimal(MIN_TRANSFER_AMOUNT);

const createTransferSchema = z.object({
  amount: z.coerce.number().positive(),
});

const updateTransferSchema = z.object({
  transferId: z.string().uuid(),
  status: z.enum(["completed", "cancelled"]),
  notes: z.string().optional(),
});

type AuthorizedCampaignUser = {
  campaign: {
    id: string;
    title: string;
    organizerId: string;
    collectedAmount: Prisma.Decimal;
    endDate: Date;
  };
  userProfile: {
    id: string;
    role: string;
  };
};

type ActiveBankAccount = {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
};

type FundTransferRow = {
  id: string;
  campaignId: string;
  campaignBankAccountId: string | null;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  amount: Prisma.Decimal;
  status: "processing" | "completed" | "cancelled";
  transferDate: Date | null;
  reviewedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

async function getAuthorizedCampaignUser(
  campaignId: string,
): Promise<
  (AuthorizedCampaignUser & { response?: never }) | { response: NextResponse }
> {
  const session = await getAuthSession();
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const [campaign, userProfile] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        collectedAmount: true,
        endDate: true,
      },
    }),
    prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    }),
  ]);

  if (!campaign) {
    return {
      response: NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 },
      ),
    };
  }

  if (!userProfile) {
    return {
      response: NextResponse.json(
        { error: "Perfil de usuario no encontrado" },
        { status: 404 },
      ),
    };
  }

  if (campaign.organizerId !== userProfile.id && userProfile.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "No tienes permiso para ver esta información" },
        { status: 403 },
      ),
    };
  }

  return { campaign, userProfile };
}

async function getAvailableTransferAmount(campaignId: string) {
  const rows = await prisma.$queryRaw<
    Array<{ availableAmount: Prisma.Decimal }>
  >`
    select greatest(
      c.collected_amount - coalesce(sum(ft.amount) filter (
        where ft.status in ('processing', 'completed')
      ), 0),
      0
    ) as "availableAmount"
    from public.campaigns c
    left join public.fund_transfers ft on ft.campaign_id = c.id
    where c.id = ${campaignId}::uuid
    group by c.id, c.collected_amount
  `;

  return rows[0]?.availableAmount ?? new Prisma.Decimal(0);
}

async function getActiveBankAccount(campaignId: string) {
  const rows = await prisma.$queryRaw<ActiveBankAccount[]>`
    select
      id,
      account_holder_name as "accountHolderName",
      bank_name as "bankName",
      account_number as "accountNumber"
    from public.campaign_bank_accounts
    where campaign_id = ${campaignId}::uuid
      and status = 'active'
    order by created_at desc
    limit 1
  `;

  return rows[0] ?? null;
}

function serializeTransfer(row: FundTransferRow) {
  return {
    ...row,
    amount: row.amount.toString(),
  };
}

function hasReachedCampaignEndDate(endDate: Date) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const endDateKey = endDate.toISOString().slice(0, 10);
  return endDateKey <= todayKey;
}

function getMinimumAllowedAmount(
  availableAmount: Prisma.Decimal,
  campaignEndDate: Date,
) {
  if (
    availableAmount.lessThan(MIN_TRANSFER_AMOUNT_DECIMAL) &&
    hasReachedCampaignEndDate(campaignEndDate)
  ) {
    return availableAmount;
  }

  return MIN_TRANSFER_AMOUNT_DECIMAL;
}

// GET handler to retrieve transfer history for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const campaignId = (await params).id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const auth = await getAuthorizedCampaignUser(campaignId);
    if (auth.response) return auth.response;

    const [transfers, totalRows, availableAmount, processingRows] =
      await Promise.all([
        prisma.$queryRaw<FundTransferRow[]>`
          select
            id,
            campaign_id as "campaignId",
            campaign_bank_account_id as "campaignBankAccountId",
            account_holder_name as "accountHolderName",
            bank_name as "bankName",
            account_number as "accountNumber",
            amount,
            status,
            transfer_date as "transferDate",
            reviewed_at as "reviewedAt",
            completed_at as "completedAt",
            notes,
            created_at as "createdAt",
            updated_at as "updatedAt"
          from public.fund_transfers
          where campaign_id = ${campaignId}::uuid
          order by created_at desc
          limit ${limit}
          offset ${offset}
        `,
        prisma.$queryRaw<Array<{ count: bigint }>>`
          select count(*)::bigint as count
          from public.fund_transfers
          where campaign_id = ${campaignId}::uuid
        `,
        getAvailableTransferAmount(campaignId),
        prisma.$queryRaw<Array<{ id: string }>>`
          select id
          from public.fund_transfers
          where campaign_id = ${campaignId}::uuid
            and status = 'processing'
          limit 1
        `,
      ]);

    const totalCount = Number(totalRows[0]?.count ?? 0);

    return NextResponse.json({
      transfers: transfers.map(serializeTransfer),
      totalCount,
      hasMore: offset + limit < totalCount,
      availableAmount: availableAmount.toString(),
      hasProcessingTransfer: processingRows.length > 0,
    });
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return NextResponse.json(
      { error: "Error al obtener el historial de transferencias" },
      { status: 500 },
    );
  }
}

// POST handler to create a new fund transfer request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const campaignId = (await params).id;
    const data = createTransferSchema.parse(await request.json());
    const amount = new Prisma.Decimal(data.amount);

    const auth = await getAuthorizedCampaignUser(campaignId);
    if (auth.response) return auth.response;
    const { campaign, userProfile } = auth;

    const activeBankAccount = await getActiveBankAccount(campaignId);

    if (!activeBankAccount) {
      return NextResponse.json(
        { error: "Primero registra una cuenta bancaria para la campaña" },
        { status: 400 },
      );
    }

    const openTransfer = await prisma.$queryRaw<Array<{ id: string }>>`
      select id
      from public.fund_transfers
      where campaign_id = ${campaignId}::uuid
        and status = 'processing'
      limit 1
    `;

    if (openTransfer.length > 0) {
      return NextResponse.json(
        { error: "Ya existe una solicitud de transferencia en proceso" },
        { status: 400 },
      );
    }

    const availableAmount = await getAvailableTransferAmount(campaignId);
    const minimumAllowedAmount = getMinimumAllowedAmount(
      availableAmount,
      campaign.endDate,
    );

    if (availableAmount.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: "No hay fondos disponibles para transferir" },
        { status: 400 },
      );
    }

    if (amount.lessThan(minimumAllowedAmount)) {
      return NextResponse.json(
        {
          error: `El monto mínimo para transferir es Bs. ${minimumAllowedAmount.toString()}`,
        },
        { status: 400 },
      );
    }

    if (amount.greaterThan(availableAmount)) {
      return NextResponse.json(
        { error: "Fondos insuficientes para esta transferencia" },
        { status: 400 },
      );
    }

    const transferId = randomUUID();
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      insert into public.fund_transfers (
        id,
        campaign_id,
        campaign_bank_account_id,
        account_holder_name,
        bank_name,
        account_number,
        amount,
        status,
        requested_by_id,
        updated_at
      )
      values (
        ${transferId}::uuid,
        ${campaignId}::uuid,
        ${activeBankAccount.id}::uuid,
        ${activeBankAccount.accountHolderName},
        ${activeBankAccount.bankName},
        ${activeBankAccount.accountNumber},
        ${amount.toString()}::numeric,
        'processing'::"TransferStatus",
        ${userProfile.id}::uuid,
        now()
      )
      returning id
    `;

    return NextResponse.json({
      message: "Solicitud de transferencia creada exitosamente",
      transferId: rows[0]?.id,
      availableAmount: availableAmount.minus(amount).toString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "El monto de transferencia debe ser mayor a cero" },
        { status: 400 },
      );
    }

    console.error("Error creating fund transfer:", error);
    return NextResponse.json(
      { error: "Error al crear la solicitud de transferencia" },
      { status: 500 },
    );
  }
}

// PATCH handler to update fund transfer status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const campaignId = (await params).id;
    const { transferId, status, notes } = updateTransferSchema.parse(
      await request.json(),
    );

    const existingTransfer = await prisma.$queryRaw<
      Array<{ id: string; status: string }>
    >`
      select id, status
      from public.fund_transfers
      where id = ${transferId}::uuid
        and campaign_id = ${campaignId}::uuid
      limit 1
    `;

    if (existingTransfer.length === 0) {
      return NextResponse.json(
        { error: "Solicitud de transferencia no encontrada" },
        { status: 404 },
      );
    }

    let reviewerId = "";

    if (status === "cancelled") {
      const auth = await getAuthorizedCampaignUser(campaignId);
      if (auth.response) return auth.response;
      reviewerId = auth.userProfile.id;

      if (existingTransfer[0].status !== "processing") {
        return NextResponse.json(
          { error: "Solo se pueden cancelar transferencias en proceso" },
          { status: 400 },
        );
      }
    } else {
      const admin = await requireAdminProfile();
      reviewerId = admin.id;
    }

    const rows = await prisma.$queryRaw<FundTransferRow[]>`
      update public.fund_transfers
      set
        status = ${status}::"TransferStatus",
        notes = ${notes ?? null},
        reviewed_by_id = ${reviewerId}::uuid,
        reviewed_at = now(),
        transfer_date = case when ${status} = 'completed' then now() else transfer_date end,
        completed_at = case when ${status} = 'completed' then now() else completed_at end,
        updated_at = now()
      where id = ${transferId}::uuid
      returning
        id,
        campaign_id as "campaignId",
        campaign_bank_account_id as "campaignBankAccountId",
        account_holder_name as "accountHolderName",
        bank_name as "bankName",
        account_number as "accountNumber",
        amount,
        status,
        transfer_date as "transferDate",
        reviewed_at as "reviewedAt",
        completed_at as "completedAt",
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    if (status !== "cancelled") {
      await createAdminAuditLog({
        adminId: reviewerId,
        action: "fund_transfer.update_status",
        entityType: "campaign",
        entityId: campaignId,
        metadata: {
          transferId,
          previousStatus: existingTransfer[0].status,
          newStatus: status,
          notes: notes ?? null,
        },
      });
    }

    return NextResponse.json({
      message: "Estado de transferencia actualizado exitosamente",
      transfer: serializeTransfer(rows[0]),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos para actualizar la transferencia" },
        { status: 400 },
      );
    }

    console.error("Error updating fund transfer:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la transferencia" },
      { status: 500 },
    );
  }
}
