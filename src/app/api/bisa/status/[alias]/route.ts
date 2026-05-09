import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";
import {
  completeDonationAccounting,
  sendCompletedDonationNotification,
} from "@/lib/donations/accounting";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alias: string }> }
) {
  const { alias } = await params;

  if (!alias) {
    return NextResponse.json({ error: "Alias is required" }, { status: 400 });
  }

  try {
    // Check local DB first
    const donation = await prisma.donation.findFirst({
      where: { bisaAlias: alias },
    });

    if (!donation) {
      return NextResponse.json({
        success: true,
        data: {
          status: "EXPIRADO",
          message: "QR no encontrado"
        }
      });
    }

    if (donation.paymentStatus === "completed") {
      return NextResponse.json({
        success: true,
        data: { status: "PAGADO" }
      });
    }

    // Call BISA API
    const response = await bisaClient.checkStatus(alias);

    if (!response.success || !response.data) {
      return NextResponse.json({
        success: false,
        error: response.error || "Error al consultar estado del QR",
        needsRegeneration: true // Signal that a new QR should be generated
      });
    }

    const status = response.data.status;

    // If paid, update DB (paymentStatus is already known to not be "completed" from early return above)
    if (status === "PAGADO") {
      let completionNotification;

      // Transaction to ensure consistency
      await prisma.$transaction(async (tx) => {
        const completion = await completeDonationAccounting(tx, {
          donationId: donation.id,
          donationUpdate: {
            bisaTransactionId: response.data?.transactionId,
            bisaPayerName: response.data?.payerName,
            bisaPayerAccount: response.data?.payerAccount,
            bisaPayerDocument: response.data?.payerDocument,
            bisaProcessedAt: response.data?.processedAt ? new Date(response.data.processedAt) : new Date(),
          },
        });

        completionNotification = completion.notification;
      });

      await sendCompletedDonationNotification(completionNotification);
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    console.error("Error checking status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
