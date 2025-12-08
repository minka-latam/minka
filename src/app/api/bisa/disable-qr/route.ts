import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alias } = body;

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

    // Call BISA API
    const success = await bisaClient.disableQR(alias);

    if (!success) {
      return NextResponse.json({ error: "Failed to disable QR" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "QR disabled successfully"
    });

  } catch (error) {
    console.error("Error disabling QR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
