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

        if (completion.completedNow) {
          const tipAmount = Number(donation.tip_amount || 0);
          const providerAmount = Number(
            response.data?.amount ??
              donation.total_amount ??
              Number(donation.amount) + tipAmount
          );
          const paymentId =
            response.data?.transactionId || donation.bisaQrId || alias;

          const existingCompletedLog = await tx.paymentLog.findFirst({
            where: {
              paymentprovider: "bisa",
              paymentid: paymentId,
              status: "completed",
            },
            select: { id: true },
          });

          if (!existingCompletedLog) {
            await tx.paymentLog.create({
              data: {
                paymentprovider: "bisa",
                paymentmethod: "qr",
                paymentid: paymentId,
                status: "completed",
                amount: providerAmount,
                tipamount: tipAmount,
                currency: response.data?.currency || "BOB",
                metadata: JSON.stringify({
                  alias,
                  donationId: donation.id,
                  bisaQrId: response.data?.qrId || donation.bisaQrId,
                  processedAt: response.data?.processedAt,
                }),
                campaignid: donation.campaignId,
                donorid: donation.donorId,
              },
            });
          }
        }
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
