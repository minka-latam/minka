import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Get the user session to validate authentication
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const requestData = await request.json();

    if (
      !requestData.campaignId ||
      !requestData.accountHolderName ||
      !requestData.bankName ||
      !requestData.accountNumber ||
      !requestData.amount ||
      typeof requestData.amount !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid transfer details" },
        { status: 400 }
      );
    }

    // Verify that the user is the campaign organizer
    const campaign = await prisma.campaign.findUnique({
      where: { id: requestData.campaignId },
      select: { organizerId: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if the requesting user is the campaign organizer or an admin
    if (campaign.organizerId !== session.user.id) {
      const requestingUser = await prisma.profile.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (!requestingUser || requestingUser.role !== "admin") {
        return NextResponse.json(
          {
            error:
              "Forbidden - Only campaign organizers can request fund transfers",
          },
          { status: 403 }
        );
      }
    }

    // Create fund transfer record
    // Check if we have a fund_transfers table in the schema
    // If not, we'll use a raw SQL query as a fallback
    try {
      // First try using Prisma client if the model exists
      // @ts-ignore - We're checking if the model exists
      await prisma.fundTransfer.create({
        data: {
          campaignId: requestData.campaignId,
          accountHolderName: requestData.accountHolderName,
          bankName: requestData.bankName,
          accountNumber: requestData.accountNumber,
          amount: requestData.amount,
          status: requestData.status || "processing",
        },
      });
    } catch (e) {
      // Fallback to raw SQL if the model doesn't exist
      await prisma.$executeRaw`
        INSERT INTO fund_transfers (
          campaign_id, account_holder_name, bank_name, account_number, amount, status, created_at
        ) VALUES (
          ${requestData.campaignId}, 
          ${requestData.accountHolderName}, 
          ${requestData.bankName}, 
          ${requestData.accountNumber}, 
          ${requestData.amount}, 
          ${requestData.status || "processing"}, 
          ${new Date().toISOString()}
        )
      `;
    }

    // Return success
    return NextResponse.json(
      {
        message: "Fund transfer request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating fund transfer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
