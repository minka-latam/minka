import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, amount, campaignId } = body;

    if (!donationId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify donation exists
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

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
      amount: Number(amount),
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
      await tx.donation.update({
        where: { id: donationId },
        data: {
          bisaAlias: alias,
          bisaQrId: qrId,
          bisaQrImage: qrImage,
          bisaQrExpiresAt: expirationDate,
          paymentProvider: "bisa",
        },
      });

      // Create payment log for QR generation
      await tx.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: qrId,
          status: "qr_generated",
          amount: amount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias,
            donationId,
            campaignId,
            expiresAt: expirationDate.toISOString(),
          }),
          campaignid: campaignId || donation.campaignId,
          donorid: donation.donorId,
        },
      });
    });

    // Format expiration date for display (dd/MM/yyyy HH:mm)
    const formattedExpiration = expirationDate.toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return NextResponse.json({
      success: true,
      data: {
        ...response.data,
        expiresAt: formattedExpiration,
      },
    });

  } catch (error) {
    console.error("Error in generate-qr:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
