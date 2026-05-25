import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";
import {
  canAccessBisaDonation,
  isPendingBisaDonation,
} from "@/lib/bisa/qr-authorization";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alias, reason, qrAccessToken } = body;

    if (!alias) {
      return NextResponse.json({ error: "Alias is required" }, { status: 400 });
    }

    // Verify donation exists
    const donation = await prisma.donation.findFirst({
      where: { bisaAlias: alias },
      include: {
        campaign: {
          select: { organizerId: true },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    const hasAccess = await canAccessBisaDonation({
      donation,
      accessToken: qrAccessToken,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!isPendingBisaDonation(donation)) {
      return NextResponse.json(
        { error: "Only pending BISA QR donations can be disabled" },
        { status: 400 }
      );
    }

    const tipAmount = Number(donation.tip_amount || 0);
    const payableAmount = Number(
      donation.total_amount ?? Number(donation.amount) + tipAmount
    );

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
          amount: payableAmount,
          tipamount: tipAmount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias,
            donationId: donation.id,
            reason: reason || "user_cancelled",
            error: "BISA API failed to disable QR",
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
      return NextResponse.json({ error: "Failed to disable QR" }, { status: 502 });
    }

    // Update donation status and create payment log
    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.donation.updateMany({
        where: {
          id: donation.id,
          paymentStatus: "pending",
          paymentProvider: "bisa",
          paymentMethod: "qr",
        },
        data: {
          paymentStatus: "cancelled",
        },
      });

      if (updateResult.count === 0) {
        throw new Error("Donation is no longer pending");
      }

      await tx.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: donation.bisaQrId || alias,
          status: "qr_disabled",
          amount: payableAmount,
          tipamount: tipAmount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias,
            donationId: donation.id,
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
