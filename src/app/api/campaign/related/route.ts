import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const excludeId = searchParams.get("excludeId");
    const limit = Number(searchParams.get("limit") || 3);

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      );
    }

    // Query to find related campaigns based on the category
    const relatedCampaigns = await db.campaign.findMany({
      where: {
        category: category as any,
        id: {
          not: excludeId || undefined,
        },
        campaignStatus: "active",
        verificationStatus: true,
        status: "active",
      },
      orderBy: [{ percentageFunded: "desc" }, { createdAt: "desc" }],
      include: {
        media: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
      },
      take: limit,
    });

    // If we don't have enough campaigns in the same category, fetch popular campaigns
    if (relatedCampaigns.length < limit) {
      const additionalCount = limit - relatedCampaigns.length;

      const additionalCampaigns = await db.campaign.findMany({
        where: {
          id: {
            not: excludeId || undefined,
          },
          category: {
            not: category as any,
          },
          campaignStatus: "active",
          verificationStatus: true,
          status: "active",
          NOT: {
            id: {
              in: relatedCampaigns.map((c) => c.id),
            },
          },
        },
        orderBy: [{ donorCount: "desc" }, { percentageFunded: "desc" }],
        include: {
          media: {
            where: {
              isPrimary: true,
            },
            take: 1,
          },
        },
        take: additionalCount,
      });

      relatedCampaigns.push(...additionalCampaigns);
    }

    // Format campaigns for the frontend
    const formattedCampaigns = relatedCampaigns.map((campaign) => {
      const primaryImage =
        campaign.media[0]?.mediaUrl || "/campaign/default-campaign.jpg";

      return {
        id: campaign.id,
        title: campaign.title,
        image: primaryImage,
        category: formatCategory(campaign.category),
        location: campaign.location,
        progress: Math.round(campaign.percentageFunded),
        verified: campaign.verificationStatus,
        description: campaign.description,
        donorCount: campaign.donorCount,
        amountRaised: `Bs. ${campaign.collectedAmount.toFixed(2)}`,
      };
    });

    return NextResponse.json({ campaigns: formattedCampaigns });
  } catch (error) {
    console.error("Error fetching related campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to format category from DB enum to display format
function formatCategory(category: string) {
  const categoryMap: Record<string, string> = {
    cultura_arte: "Cultura y arte",
    educacion: "Educación",
    emergencia: "Emergencia",
    igualdad: "Igualdad",
    medioambiente: "Medio ambiente",
    salud: "Salud",
    otros: "Otros",
  };

  return categoryMap[category] || category;
}
