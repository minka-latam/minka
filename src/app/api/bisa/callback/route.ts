import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { completeBisaDonationPayment } from "@/lib/bisa/payment-completion";

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

    return NextResponse.json({ codigo: "0000", mensaje: "Success" });

  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json({ codigo: "9999", mensaje: "Internal Error" });
  }
}
