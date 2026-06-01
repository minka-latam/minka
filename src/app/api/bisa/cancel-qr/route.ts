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
    const { donationId, reason, qrAccessToken } = body;

    if (!donationId) {
      return NextResponse.json({ error: "Donation ID is required" }, { status: 400 });
    }

    // Find donation
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
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
      return NextResponse.json({
        error: "You don't have permission to cancel this payment"
      }, { status: 403 });
    }

    // Check if donation has a BISA QR
    if (!donation.bisaAlias || donation.paymentProvider !== "bisa") {
      return NextResponse.json({
        error: "This donation doesn't have a BISA QR payment"
      }, { status: 400 });
    }

    if (!isPendingBisaDonation(donation)) {
      return NextResponse.json(
        { error: "Only pending BISA QR donations can be cancelled" },
        { status: 400 }
      );
    }

    // Call BISA API to disable QR
    const bisaSuccess = await bisaClient.disableQR(donation.bisaAlias);

    const cancelReason = reason || "user_cancelled";
    const tipAmount = Number(donation.tip_amount || 0);
    const payableAmount = Number(
      donation.total_amount ?? Number(donation.amount) + tipAmount
    );

    if (!bisaSuccess) {

      await prisma.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: donation.bisaQrId || donation.bisaAlias || donation.id,
          status: "cancel_failed",
          amount: payableAmount,
          tipamount: tipAmount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias: donation.bisaAlias,
            donationId: donation.id,
            reason: cancelReason,
            cancelledBy: "authorized_request",
            error: "BISA API failed to disable QR",
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
      return NextResponse.json(
        { error: "Failed to disable QR with BISA" },
        { status: 502 }
      );
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
          paymentid: donation.bisaQrId || donation.bisaAlias || donation.id,
          status: "cancelled",
          amount: payableAmount,
          tipamount: tipAmount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias: donation.bisaAlias,
            donationId: donation.id,
            reason: cancelReason,
            cancelledBy: "authorized_request",
            bisaDisabled: bisaSuccess,
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Payment cancelled successfully"
    });

  } catch (error) {
    console.error("Error cancelling QR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
