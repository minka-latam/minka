import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { createAdminAuditLog } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const bankAccountSchema = z.object({
  accountHolderName: z.string().trim().min(2).max(120),
  bankName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().min(4).max(64),
  accountType: z.string().trim().max(50).optional().nullable(),
});

type CampaignBankAccountRow = {
  id: string;
  campaignId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: string | null;
  status: "active" | "replaced" | "disabled";
  createdAt: Date;
  updatedAt: Date;
};

type AuthorizedCampaignUser = {
  campaign: {
    id: string;
    title: string;
    organizerId: string;
  };
  userProfile: {
    id: string;
    role: string;
  };
};

async function getAuthorizedCampaignUser(
  campaignId: string
): Promise<
  | (AuthorizedCampaignUser & { response?: never })
  | { response: NextResponse }
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
      select: { id: true, title: true, organizerId: true },
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
        { status: 404 }
      ),
    };
  }

  if (!userProfile) {
    return {
      response: NextResponse.json(
        { error: "Perfil de usuario no encontrado" },
        { status: 404 }
      ),
    };
  }

  if (
    campaign.organizerId !== userProfile.id &&
    userProfile.role !== "admin"
  ) {
    return {
      response: NextResponse.json(
        { error: "No tienes permiso para gestionar esta cuenta bancaria" },
        { status: 403 }
      ),
    };
  }

  return { campaign, userProfile };
}

function serializeBankAccount(row: CampaignBankAccountRow | null) {
  if (!row) return null;

  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;
    const auth = await getAuthorizedCampaignUser(campaignId);
    if (auth.response) return auth.response;

    const rows = await prisma.$queryRaw<CampaignBankAccountRow[]>`
      select
        id,
        campaign_id as "campaignId",
        account_holder_name as "accountHolderName",
        bank_name as "bankName",
        account_number as "accountNumber",
        account_type as "accountType",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from public.campaign_bank_accounts
      where campaign_id = ${campaignId}::uuid
        and status = 'active'
      order by created_at desc
      limit 1
    `;

    return NextResponse.json({ bankAccount: serializeBankAccount(rows[0]) });
  } catch (error) {
    console.error("Error fetching campaign bank account:", error);
    return NextResponse.json(
      { error: "Error al obtener la cuenta bancaria" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;
    const data = bankAccountSchema.parse(await request.json());
    const auth = await getAuthorizedCampaignUser(campaignId);
    if (auth.response) return auth.response;
    const { campaign, userProfile } = auth;

    const openTransfer = await prisma.$queryRaw<Array<{ id: string }>>`
      select id
      from public.fund_transfers
      where campaign_id = ${campaignId}::uuid
        and status = 'processing'
      limit 1
    `;

    if (openTransfer.length > 0) {
      return NextResponse.json(
        {
          error:
            "No puedes cambiar la cuenta bancaria mientras hay una transferencia en proceso",
        },
        { status: 400 }
      );
    }

    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        update public.campaign_bank_accounts
        set status = 'replaced',
            replaced_at = now(),
            updated_at = now()
        where campaign_id = ${campaignId}::uuid
          and status = 'active'
      `;

      return tx.$queryRaw<CampaignBankAccountRow[]>`
        insert into public.campaign_bank_accounts (
          campaign_id,
          account_holder_name,
          bank_name,
          account_number,
          account_type,
          created_by_id
        )
        values (
          ${campaignId}::uuid,
          ${data.accountHolderName},
          ${data.bankName},
          ${data.accountNumber},
          ${data.accountType || null},
          ${userProfile.id}::uuid
        )
        returning
          id,
          campaign_id as "campaignId",
          account_holder_name as "accountHolderName",
          bank_name as "bankName",
          account_number as "accountNumber",
          account_type as "accountType",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
    });

    const bankAccount = rows[0];

    await createAdminAuditLog({
      adminId: userProfile.id,
      action: "campaign_bank_account.replace",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        campaignTitle: campaign.title,
        bankAccountId: bankAccount.id,
        bankName: bankAccount.bankName,
      },
    });

    return NextResponse.json({
      message: "Cuenta bancaria guardada correctamente",
      bankAccount: serializeBankAccount(bankAccount),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos para la cuenta bancaria" },
        { status: 400 }
      );
    }

    console.error("Error saving campaign bank account:", error);
    return NextResponse.json(
      { error: "Error al guardar la cuenta bancaria" },
      { status: 500 }
    );
  }
}
