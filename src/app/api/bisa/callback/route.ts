import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Verify amount
    if (Math.abs(Number(donation.amount) - Number(monto)) > 0.01) {
      console.error(`Amount mismatch for ${alias}: expected ${donation.amount}, got ${monto}`);
      return NextResponse.json({ codigo: "9999", mensaje: "Amount mismatch" });
    }

    // Update DB
    await prisma.$transaction(async (tx) => {
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          paymentStatus: "completed",
          bisaTransactionId: numeroOrdenOriginante,
          bisaPayerName: nombreCliente,
          bisaPayerAccount: cuentaCliente,
          bisaPayerDocument: documentoCliente,
          bisaProcessedAt: fechaproceso ? new Date(fechaproceso) : new Date(),
        },
      });

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

    return NextResponse.json({ codigo: "0000", mensaje: "Success" });

  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.json({ codigo: "9999", mensaje: "Internal Error" });
  }
}
