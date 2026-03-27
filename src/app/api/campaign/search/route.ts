import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || undefined;
    const location = searchParams.get("location") || undefined;
    const sort = searchParams.get("sort") || "recent";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 9);
    const skip = (page - 1) * limit;

    // Build the where clause with filters
    const whereClause: any = {
      campaignStatus: "active",
      verificationStatus: true,
      status: "active",
    };

    // Add search query if provided
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
      ];
    }

    // Add category filter if provided
    if (category && category !== "all") {
      whereClause.category = category;
    }

    // Add location filter if provided
    if (location) {
      whereClause.location = { contains: location, mode: "insensitive" };
    }

    // Determine sort order
    let orderBy: any = [];

    switch (sort) {
      case "recent":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "most-funded":
        orderBy = [{ percentageFunded: "desc" }];
        break;
      case "most-donors":
        orderBy = [{ donorCount: "desc" }];
        break;
      case "ending-soon":
        orderBy = [{ endDate: "asc" }];
        break;
      default:
        orderBy = [{ createdAt: "desc" }];
    }

    // Execute the query to get the filtered campaigns
    const campaigns = await db.campaign.findMany({
      where: whereClause,
      orderBy,
      include: {
        media: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
      },
      skip,
      take: limit,
    });

    // Get the total count for pagination
    const totalCount = await db.campaign.count({
      where: whereClause,
    });

    // Format campaigns for frontend
    const formattedCampaigns = campaigns.map((campaign) => {
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
        daysRemaining: campaign.daysRemaining,
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error searching campaigns:", error);
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
