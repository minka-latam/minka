import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCampaignAnonymousProfile } from "@/lib/donations/anonymous-donor";

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required for anonymous profiles" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const anonymousProfile = await getOrCreateCampaignAnonymousProfile(campaignId);

    return NextResponse.json({ profile: anonymousProfile });
  } catch (error) {
    console.error("Anonymous profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve anonymous profile" },
      { status: 500 }
    );
  }
}
