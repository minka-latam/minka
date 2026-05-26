import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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
import { createCompletedPaymentLogIfMissing } from "@/lib/payments/payment-log";

function hasCredentialValue(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function timingSafeEqualString(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function parseBasicAuthCredentials(authHeader: string) {
  if (!authHeader.startsWith("Basic ")) {
    return null;
  }

  try {
    const encodedCredentials = authHeader.slice("Basic ".length);
    const credentials = Buffer.from(encodedCredentials, "base64").toString("utf-8");
    const separatorIndex = credentials.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: credentials.slice(0, separatorIndex),
      password: credentials.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // 1. Verify Basic Auth
  const expectedUsername = process.env.BISA_CALLBACK_USERNAME;
  const expectedPassword = process.env.BISA_CALLBACK_PASSWORD;

  if (
    !hasCredentialValue(expectedUsername) ||
    !hasCredentialValue(expectedPassword)
  ) {
    console.error(
      "[BISA][CALLBACK_AUTH] Missing BISA_CALLBACK_USERNAME or BISA_CALLBACK_PASSWORD",
    );

    return NextResponse.json(
      { codigo: "9999", mensaje: "Callback credentials are not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ codigo: "9999", mensaje: "Unauthorized" }, { status: 401 });
  }

  const credentials = parseBasicAuthCredentials(authHeader);

  if (
    !credentials ||
    !timingSafeEqualString(credentials.username, expectedUsername) ||
    !timingSafeEqualString(credentials.password, expectedPassword)
  ) {
    return NextResponse.json({ codigo: "9999", mensaje: "Invalid credentials" }, { status: 401 });
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

      if (!completion.completedNow) {
        return;
      }

      // Create payment log for completed payment
      await createCompletedPaymentLogIfMissing(tx, {
        paymentprovider: "bisa",
        paymentmethod: "qr",
        paymentid: numeroOrdenOriginante || donation.bisaQrId || alias,
        amount: confirmedProviderAmount,
        tipamount: Number(donation.tip_amount || 0),
        currency: moneda || "BOB",
        metadata: JSON.stringify({
          alias,
          donationId: donation.id,
          bisaQrId: donation.bisaQrId,
          processedAt: fechaproceso,
        }),
        campaignid: donation.campaignId,
        donorid: donation.donorId,
      });
        
      await createCompletedPaymentLogIfMissing(tx, {
        paymentprovider: "bisa",
        paymentmethod: "qr",
        paymentid: numeroOrdenOriginante || donation.bisaQrId || alias,
        amount: confirmedProviderAmount,
        tipamount: Number(donation.tip_amount || 0),
        currency: moneda || "BOB",
        metadata: JSON.stringify({
          alias,
          donationId: donation.id,
          bisaQrId: donation.bisaQrId,
          processedAt: fechaproceso,
        }),
        campaignid: donation.campaignId,
        donorid: donation.donorId,
      });
    });

    await sendCompletedDonationNotification(completionNotification);

    return NextResponse.json({ codigo: "0000", mensaje: "Success" });

  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json({ codigo: "9999", mensaje: "Internal Error" });
  }
}
