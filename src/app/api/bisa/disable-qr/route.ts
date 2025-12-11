import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alias, reason } = body;

    if (!alias) {
      return NextResponse.json({ error: "Alias is required" }, { status: 400 });
    }

    // Verify donation exists
    const donation = await prisma.donation.findFirst({
      where: { bisaAlias: alias },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Check if already cancelled or completed
    if (donation.paymentStatus === "completed") {
      return NextResponse.json({
        error: "Cannot disable a completed payment"
      }, { status: 400 });
    }

    if (donation.paymentStatus === "cancelled") {
      return NextResponse.json({
        success: true,
        message: "QR already disabled"
      });
    }

    // Call BISA API to disable QR
    const success = await bisaClient.disableQR(alias);

    if (!success) {
      // Log the failed attempt
      await prisma.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: donation.bisaQrId || alias,
          status: "disable_failed",
          amount: donation.amount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias,
            donationId: donation.id,
            campaignId: donation.campaignId,
            reason: reason || "user_cancelled",
            error: "BISA API failed to disable QR",
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
      return NextResponse.json({ error: "Failed to disable QR" }, { status: 500 });
    }

    // Update donation status and create payment log
    await prisma.$transaction(async (tx) => {
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          paymentStatus: "cancelled",
        },
      });

      await tx.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: donation.bisaQrId || alias,
          status: "qr_disabled",
          amount: donation.amount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias,
            donationId: donation.id,
            campaignId: donation.campaignId,
            reason: reason || "user_cancelled",
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "QR disabled successfully"
    });

  } catch (error) {
    console.error("Error disabling QR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
