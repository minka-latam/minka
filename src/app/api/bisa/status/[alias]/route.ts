import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { alias: string } }
) {
  const alias = params.alias;

  if (!alias) {
    return NextResponse.json({ error: "Alias is required" }, { status: 400 });
  }

  try {
    // Check local DB first
    const donation = await prisma.donation.findFirst({
      where: { bisaAlias: alias },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
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
      return NextResponse.json({ error: response.error || "Failed to check status" }, { status: 500 });
    }

    const status = response.data.status;

    // If paid, update DB
    if (status === "PAGADO" && donation.paymentStatus !== "completed") {
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
