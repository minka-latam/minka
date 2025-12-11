import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";

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
      // Alias not found in DB - could be an old alias that was replaced
      // Treat as expired so frontend generates a new QR
      console.log("Alias not found in DB (may have been replaced):", alias);
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
      // BISA returned an error - pass it through to the frontend
      console.log("BISA status check failed for alias:", alias, "Error:", response.error);
      return NextResponse.json({
        success: false,
        error: response.error || "Error al consultar estado del QR",
        needsRegeneration: true // Signal that a new QR should be generated
      });
    }

    const status = response.data.status;

    // If paid, update DB (paymentStatus is already known to not be "completed" from early return above)
    if (status === "PAGADO") {
      // Transaction to ensure consistency
      await prisma.$transaction(async (tx) => {
        // Update donation
        await tx.donation.update({
          where: { id: donation.id },
          data: {
            paymentStatus: "completed",
            bisaTransactionId: response.data?.transactionId,
            bisaPayerName: response.data?.payerName,
            bisaPayerAccount: response.data?.payerAccount,
            bisaPayerDocument: response.data?.payerDocument,
            bisaProcessedAt: response.data?.processedAt ? new Date(response.data.processedAt) : new Date(),
          },
        });

        // Update Campaign collected amount
        await tx.campaign.update({
          where: { id: donation.campaignId },
          data: {
            collectedAmount: {
              increment: donation.amount,
            },
            donorCount: {
              increment: 1,
            },
          },
        });
      });
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
