import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";
import { canReceiveCampaignPayments } from "@/lib/campaigns/visibility";
import {
  canAccessBisaDonation,
  isPendingBisaDonation,
} from "@/lib/bisa/qr-authorization";

function formatExpirationDate(date: Date) {
  return date.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, campaignId, qrAccessToken } = body;

    if (!donationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify donation exists
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        campaign: {
          select: {
            id: true,
            campaignStatus: true,
            organizerId: true,
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (campaignId && campaignId !== donation.campaignId) {
      return NextResponse.json({ error: "Campaign mismatch" }, { status: 400 });
    }

    if (!isPendingBisaDonation(donation)) {
      return NextResponse.json(
        { error: "Only pending BISA QR donations can generate QR codes" },
        { status: 400 }
      );
    }

    const hasAccess = await canAccessBisaDonation({
      donation,
      accessToken: qrAccessToken,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!canReceiveCampaignPayments(donation.campaign)) {
      return NextResponse.json(
        { error: "Campaign is not accepting donations" },
        { status: 400 }
      );
    }

    if (
      donation.bisaAlias &&
      donation.bisaQrImage &&
      donation.bisaQrExpiresAt &&
      donation.bisaQrExpiresAt > new Date()
    ) {
      return NextResponse.json({
        success: true,
        data: {
          qrId: donation.bisaQrId,
          qrImage: donation.bisaQrImage,
          alias: donation.bisaAlias,
          expiresAt: formatExpirationDate(donation.bisaQrExpiresAt),
          reused: true,
        },
      });
    }

    const baseAmount = Number(donation.amount);
    const tipAmount = Number(donation.tip_amount || 0);
    const payableAmount = Number(donation.total_amount || baseAmount + tipAmount);

    // Generate Alias: MINKA-{donationId short}-{timestamp}
    // Taking last 8 chars of donationId to ensure uniqueness but keep it short enough
    const shortId = donationId.split('-').pop() || donationId.slice(-8);
    const timestamp = Math.floor(Date.now() / 1000);
    const alias = `MINKA-${shortId}-${timestamp}`;

    // Expiration: 1 day from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1);
    
    // Format: dd/MM/yyyy
    const day = String(expirationDate.getDate()).padStart(2, '0');
    const month = String(expirationDate.getMonth() + 1).padStart(2, '0');
    const year = expirationDate.getFullYear();
    const expirationString = `${day}/${month}/${year}`;

    const response = await bisaClient.generateQR({
      alias,
      amount: payableAmount,
      currency: "BOB",
      description: `Donacion Minka`,
      expirationDate: expirationString,
      singleUse: true
    });

    if (!response.success || !response.data) {
      console.error("BISA QR Generation failed:", response.error);
      return NextResponse.json({ error: response.error || "Failed to generate QR" }, { status: 500 });
    }

    // Extract data for use in transaction
    const { qrId, qrImage } = response.data;

    // Update donation with QR details and create payment log
    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.donation.updateMany({
        where: {
          id: donationId,
          paymentStatus: "pending",
          paymentProvider: "bisa",
          paymentMethod: "qr",
        },
        data: {
          bisaAlias: alias,
          bisaQrId: qrId,
          bisaQrImage: qrImage,
          bisaQrExpiresAt: expirationDate,
          paymentProvider: "bisa",
        },
      });

      if (updateResult.count === 0) {
        throw new Error("Donation is no longer pending");
      }

      // Create payment log for QR generation
      await tx.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: qrId,
          status: "qr_generated",
          amount: payableAmount,
          tipamount: tipAmount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias,
            donationId,
            expiresAt: expirationDate.toISOString(),
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        ...response.data,
        expiresAt: formatExpirationDate(expirationDate),
      },
    });

  } catch (error) {
    console.error("Error in generate-qr:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
