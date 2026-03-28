import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function GET() {
  try {
    // Get featured campaigns (active, verified, with highest percentage funded)
    const featuredCampaigns = await db.campaign.findMany({
      where: {
        campaignStatus: "active",
        verificationStatus: true,
        status: "active",
      },
      orderBy: [{ percentageFunded: "desc" }, { donorCount: "desc" }],
      include: {
        media: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
      },
      take: 6,
    });

    // Format the campaigns for the frontend
    const formattedCampaigns = featuredCampaigns.map((campaign) => {
      // Find the primary image or use a default
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
    console.error("Error fetching featured campaigns:", error);
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
