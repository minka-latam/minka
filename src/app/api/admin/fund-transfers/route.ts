import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const transferStatusSchema = z.enum(["processing", "completed", "cancelled"]);

const updateTransferSchema = z.object({
  transferId: z.string().uuid(),
  status: z.enum(["completed", "cancelled"]),
  notes: z.string().optional(),
});

type AdminTransferRow = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  amount: Prisma.Decimal;
  status: "processing" | "completed" | "cancelled";
  requestedByName: string;
  requestedByEmail: string;
  requestedAt: Date;
  reviewedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
};

function serializeTransfer(row: AdminTransferRow) {
  return {
    ...row,
    amount: row.amount.toString(),
    requestedAt: row.requestedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminProfile();

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") || "processing";
    const status =
      statusParam === "all" ? null : transferStatusSchema.parse(statusParam);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "25"),
      100,
    );

    const rows = status
      ? await prisma.$queryRaw<AdminTransferRow[]>`
          select
            ft.id,
            ft.campaign_id as "campaignId",
            c.title as "campaignTitle",
            ft.account_holder_name as "accountHolderName",
            ft.bank_name as "bankName",
            ft.account_number as "accountNumber",
            ft.amount,
            ft.status,
            requester.name as "requestedByName",
            requester.email as "requestedByEmail",
            ft.created_at as "requestedAt",
            ft.reviewed_at as "reviewedAt",
            ft.completed_at as "completedAt",
            ft.notes
          from public.fund_transfers ft
          join public.campaigns c on c.id = ft.campaign_id
          join public.profiles requester on requester.id = ft.requested_by_id
          where ft.status = ${status}::"TransferStatus"
          order by ft.created_at desc
          limit ${limit}
        `
      : await prisma.$queryRaw<AdminTransferRow[]>`
          select
            ft.id,
            ft.campaign_id as "campaignId",
            c.title as "campaignTitle",
            ft.account_holder_name as "accountHolderName",
            ft.bank_name as "bankName",
            ft.account_number as "accountNumber",
            ft.amount,
            ft.status,
            requester.name as "requestedByName",
            requester.email as "requestedByEmail",
            ft.created_at as "requestedAt",
            ft.reviewed_at as "reviewedAt",
            ft.completed_at as "completedAt",
            ft.notes
          from public.fund_transfers ft
          join public.campaigns c on c.id = ft.campaign_id
          join public.profiles requester on requester.id = ft.requested_by_id
          order by ft.created_at desc
          limit ${limit}
        `;

    return NextResponse.json({
      transfers: rows.map(serializeTransfer),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Estado de transferencia inválido" },
        { status: 400 },
      );
    }

    console.error("Error fetching admin fund transfers:", error);
    return NextResponse.json(
      { error: "Error al obtener transferencias" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminProfile();
    const { transferId, status, notes } = updateTransferSchema.parse(
      await request.json(),
    );

    const existingRows = await prisma.$queryRaw<
      Array<{ id: string; campaignId: string; status: string }>
    >`
      select id, campaign_id as "campaignId", status
      from public.fund_transfers
      where id = ${transferId}::uuid
      limit 1
    `;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: "Solicitud de transferencia no encontrada" },
        { status: 404 },
      );
    }

    const existing = existingRows[0];

    if (existing.status !== "processing") {
      return NextResponse.json(
        { error: "Solo se pueden actualizar transferencias en proceso" },
        { status: 400 },
      );
    }

    const updatedRows = await prisma.$queryRaw<AdminTransferRow[]>`
      update public.fund_transfers
      set
        status = ${status}::"TransferStatus",
        notes = ${notes ?? null},
        reviewed_by_id = ${admin.id}::uuid,
        reviewed_at = now(),
        transfer_date = case when ${status} = 'completed' then now() else transfer_date end,
        completed_at = case when ${status} = 'completed' then now() else completed_at end,
        updated_at = now()
      where id = ${transferId}::uuid
      returning
        id,
        campaign_id as "campaignId",
        (select title from public.campaigns where id = fund_transfers.campaign_id) as "campaignTitle",
        account_holder_name as "accountHolderName",
        bank_name as "bankName",
        account_number as "accountNumber",
        amount,
        status,
        (select name from public.profiles where id = fund_transfers.requested_by_id) as "requestedByName",
        (select email from public.profiles where id = fund_transfers.requested_by_id) as "requestedByEmail",
        created_at as "requestedAt",
        reviewed_at as "reviewedAt",
        completed_at as "completedAt",
        notes
    `;

    await createAdminAuditLog({
      adminId: admin.id,
      action: "fund_transfer.admin_update_status",
      entityType: "campaign",
      entityId: existing.campaignId,
      metadata: {
        transferId,
        previousStatus: existing.status,
        newStatus: status,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({
      transfer: serializeTransfer(updatedRows[0]),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos para actualizar transferencia" },
        { status: 400 },
      );
    }

    console.error("Error updating admin fund transfer:", error);
    return NextResponse.json(
      { error: "Error al actualizar transferencia" },
      { status: 500 },
    );
  }
}
