import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus, type Prisma } from "@prisma/client";

import {
  adminAuthErrorResponse,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { buildCsv } from "@/lib/csv-export";
import { formatCurrency } from "@/lib/campaign-finance";
import { prisma } from "@/lib/prisma";

function paymentMethodLabel(method: PaymentMethod) {
  if (method === PaymentMethod.qr) return "QR";
  if (method === PaymentMethod.credit_card) return "Tarjeta";
  return "Transferencia";
}

function paymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pendiente",
    completed: "Completada",
    failed: "Fallida",
    refunded: "Reembolsada",
    cancelled: "Cancelada",
  };

  return labels[status] ?? status;
}

function formatBoliviaDateTime(value: Date | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const parts = new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);

  const partMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${partMap.day}/${partMap.month}/${partMap.year} ${partMap.hour}:${partMap.minute}`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminProfile();

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId") || "";
    const campaignSearch = (searchParams.get("campaignSearch") || "").trim();
    const donorSearch = (searchParams.get("donorSearch") || "").trim();
    const method = searchParams.get("method") || "";
    const statusParam = searchParams.get("status") || PaymentStatus.completed;
    const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";

    const validMethod = Object.values(PaymentMethod).includes(
      method as PaymentMethod,
    )
      ? (method as PaymentMethod)
      : null;
    const validStatus =
      statusParam === "all"
        ? "all"
        : Object.values(PaymentStatus).includes(statusParam as PaymentStatus)
          ? (statusParam as PaymentStatus)
          : PaymentStatus.completed;

    const campaignFilter: Prisma.DonationWhereInput = campaignId
      ? { campaignId }
      : campaignSearch
        ? {
            campaign: {
              title: {
                contains: campaignSearch,
                mode: "insensitive",
              },
            },
          }
        : {};

    const donorFilter: Prisma.DonationWhereInput = donorSearch
      ? {
          OR: [
            {
              donor: {
                name: {
                  contains: donorSearch,
                  mode: "insensitive",
                },
              },
            },
            {
              donor: {
                email: {
                  contains: donorSearch,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {};

    const donations = await prisma.donation.findMany({
      where: {
        ...campaignFilter,
        ...donorFilter,
        ...(validMethod ? { paymentMethod: validMethod } : {}),
        ...(validStatus !== "all" ? { paymentStatus: validStatus } : {}),
      },
      orderBy: { createdAt: sort },
      take: 5000,
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
        donor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const csv = buildCsv(
      [
        "ID",
        "Fecha y hora",
        "Donador",
        "Email",
        "Campaña",
        "Monto",
        "Tip",
        "Total",
        "Método",
        "Estado",
        "Anónimo",
      ],
      donations.map((donation) => [
        donation.id,
        formatBoliviaDateTime(donation.createdAt),
        donation.isAnonymous ? "Anónimo" : donation.donor.name || "Sin nombre",
        donation.isAnonymous ? "" : donation.donor.email,
        donation.campaign.title,
        formatCurrency(Number(donation.amount || 0)),
        formatCurrency(Number(donation.tip_amount || 0)),
        formatCurrency(
          Number(donation.amount || 0) + Number(donation.tip_amount || 0),
        ),
        paymentMethodLabel(donation.paymentMethod),
        paymentStatusLabel(donation.paymentStatus),
        donation.isAnonymous ? "Sí" : "No",
      ]),
    );

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="donaciones-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error exporting donations:", error);
    return NextResponse.json(
      { error: "Failed to export donations" },
      { status: 500 },
    );
  }
}
