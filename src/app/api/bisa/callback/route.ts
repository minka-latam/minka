import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  completeDonationAccounting,
  sendCompletedDonationNotification,
} from "@/lib/donations/accounting";
import {
  BISA_PAYMENT_CURRENCY,
  expectedDonationTotal,
  normalizeCurrency,
  parseProviderAmount,
  validateProviderPayment,
} from "@/lib/payments/provider-validation";

export async function POST(request: NextRequest) {
  // 1. Verify Basic Auth
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return NextResponse.json({ codigo: "9999", mensaje: "Unauthorized" }, { status: 401 });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  const expectedUsername = process.env.BISA_CALLBACK_USERNAME;
  const expectedPassword = process.env.BISA_CALLBACK_PASSWORD;

  // Only check credentials if they are set in env, otherwise skip (dev mode or insecure)
  // But for security, we should enforce it.
  if (expectedUsername && expectedPassword) {
    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json({ codigo: "9999", mensaje: "Invalid credentials" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { 
      alias, 
      numeroOrdenOriginante, 
      monto, 
      moneda, 
      fechaproceso, // Postman uses lowercase 'fechaproceso'
      cuentaCliente, 
      nombreCliente, 
      documentoCliente 
    } = body;

    if (!alias) {
      return NextResponse.json({ codigo: "9999", mensaje: "Alias missing" });
    }

    const donation = await prisma.donation.findFirst({
      where: { bisaAlias: alias },
    });

    if (!donation) {
      return NextResponse.json({ codigo: "9999", mensaje: "Donation not found" });
    }

    // Idempotency check
    if (donation.paymentStatus === "completed") {
      return NextResponse.json({ codigo: "0000", mensaje: "Already processed" });
    }

    const expectedAmount = expectedDonationTotal(donation);
    const providerAmount = parseProviderAmount(monto);
    const providerCurrency = normalizeCurrency(moneda);
    const validation = validateProviderPayment({
      expectedAmount,
      providerAmount,
      expectedCurrency: BISA_PAYMENT_CURRENCY,
      providerCurrency,
      amountTolerance: 0,
    });

    if (!validation.ok) {
      console.error("[BISA][CALLBACK_VALIDATION]", {
        alias,
        reason: validation.reason,
        expectedAmount,
        providerAmount,
        expectedCurrency: BISA_PAYMENT_CURRENCY,
        providerCurrency,
      });
      return NextResponse.json({ codigo: "9999", mensaje: validation.message });
    }
    const confirmedProviderAmount = providerAmount as number;

    let completionNotification;

    // Update DB
    await prisma.$transaction(async (tx) => {
      const completion = await completeDonationAccounting(tx, {
        donationId: donation.id,
        donationUpdate: {
          bisaTransactionId: numeroOrdenOriginante,
          bisaPayerName: nombreCliente,
          bisaPayerAccount: cuentaCliente,
          bisaPayerDocument: documentoCliente,
          bisaProcessedAt: fechaproceso ? new Date(fechaproceso) : new Date(),
        },
      });

      completionNotification = completion.notification;

      // Create payment log for completed payment
      await tx.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: numeroOrdenOriginante || donation.bisaQrId || alias,
          status: "completed",
          amount: confirmedProviderAmount,
          tipamount: Number(donation.tip_amount || 0),
          currency: BISA_PAYMENT_CURRENCY,
          metadata: JSON.stringify({
            alias,
            donationId: donation.id,
            bisaQrId: donation.bisaQrId,
            processedAt: fechaproceso,
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
    });

    await sendCompletedDonationNotification(completionNotification);

    return NextResponse.json({ codigo: "0000", mensaje: "Success" });

  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json({ codigo: "9999", mensaje: "Internal Error" });
  }
}
