import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { completeBisaDonationPayment } from "@/lib/bisa/payment-completion";

const BISA_SUCCESS_RESPONSE = {
  codigo: "0000",
  mensaje: "Registro Exitoso",
};

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

function hasValidCallbackCredentials(
  authHeader: string | null,
  expectedUsername: string,
  expectedPassword: string,
) {
  if (!authHeader) return false;

  const credentials = parseBasicAuthCredentials(authHeader);

  return (
    !!credentials &&
    timingSafeEqualString(credentials.username, expectedUsername) &&
    timingSafeEqualString(credentials.password, expectedPassword)
  );
}

function providerAmountMatches(donation: { total_amount: unknown; amount: unknown }, amount: unknown) {
  const providerAmount = Number(amount);
  const expectedAmount = Number(donation.total_amount ?? donation.amount);

  return (
    Number.isFinite(providerAmount) &&
    Number.isFinite(expectedAmount) &&
    providerAmount.toFixed(2) === expectedAmount.toFixed(2)
  );
}

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const {
      alias,
      numeroOrdenOriginante,
      monto,
      moneda,
      idQr,
      fechaproceso, // Postman uses lowercase 'fechaproceso'
      fechaProceso,
      fechaProcesamiento,
      cuentaCliente,
      nombreCliente,
      documentoCliente
    } = body;

    if (!alias) {
      return NextResponse.json({ codigo: "9999", mensaje: "Alias missing" });
    }

    const authHeader = request.headers.get("Authorization");
    const hasValidAuth = hasValidCallbackCredentials(
      authHeader,
      expectedUsername,
      expectedPassword,
    );

    const donation = await prisma.donation.findFirst({
      where: { bisaAlias: alias },
    });

    if (!donation) {
      return NextResponse.json({ codigo: "9999", mensaje: "Donation not found" });
    }

    if (!hasValidAuth) {
      const matchesCompletedDonation =
        donation.paymentStatus === "completed" &&
        (!idQr || donation.bisaQrId === idQr) &&
        providerAmountMatches(donation, monto);

      if (matchesCompletedDonation) {
        return NextResponse.json(BISA_SUCCESS_RESPONSE);
      }

      return NextResponse.json({ codigo: "9999", mensaje: "Unauthorized" }, { status: 401 });
    }

    // Idempotency check
    if (donation.paymentStatus === "completed") {
      return NextResponse.json(BISA_SUCCESS_RESPONSE);
    }

    const completion = await completeBisaDonationPayment({
      donation,
      confirmation: {
        alias,
        amount: monto,
        currency: moneda,
        transactionId: numeroOrdenOriginante,
        qrId: idQr,
        payerName: nombreCliente,
        payerAccount: cuentaCliente,
        payerDocument: documentoCliente,
        processedAt: fechaproceso || fechaProceso || fechaProcesamiento,
        source: "callback",
      },
      awaitNotifications: false,
    });

    if (completion.error) {
      return NextResponse.json({ codigo: "9999", mensaje: completion.error });
    }

    return NextResponse.json(BISA_SUCCESS_RESPONSE);

  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json({ codigo: "9999", mensaje: "Internal Error" });
  }
}
