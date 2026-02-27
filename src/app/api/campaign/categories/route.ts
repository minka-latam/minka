import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Interface for category count data
interface CategoryCount {
  category: string;
  count: string | number;
}

// Fallback categories data for development if needed
const mockCategories = [
  { name: "Medio ambiente", count: 42 },
  { name: "Educación", count: 35 },
  { name: "Salud", count: 28 },
  { name: "Igualdad", count: 21 },
  { name: "Cultura y arte", count: 15 },
  { name: "Emergencia", count: 12 },
];

// Map display names to database enum values
const categoryEnumMap: Record<string, string> = {
  "Cultura y arte": "cultura_arte",
  Educación: "educacion",
  Emergencia: "emergencia",
  Igualdad: "igualdad",
  "Medio ambiente": "medioambiente",
  Salud: "salud",
  Otros: "otros",
};

// Map database enum values to display names
const displayCategoryMap: Record<string, string> = {
  cultura_arte: "Cultura y arte",
  educacion: "Educación",
  emergencia: "Emergencia",
  igualdad: "Igualdad",
  medioambiente: "Medio ambiente",
  salud: "Salud",
  otros: "Otros",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // Get filters from query parameters
    const locations = url.searchParams
      .getAll("location")
      .map((location) => location.trim())
      .filter(Boolean);
    const search = url.searchParams.get("search");
    const verified = url.searchParams.get("verified") === "true";

    // New filter parameters
    const createdAfter = url.searchParams.get("createdAfter");
    const fundingPercentageMin = url.searchParams.get("fundingPercentageMin")
      ? parseInt(url.searchParams.get("fundingPercentageMin") || "0")
      : undefined;
    const fundingPercentageMax = url.searchParams.get("fundingPercentageMax")
      ? parseInt(url.searchParams.get("fundingPercentageMax") || "100")
      : undefined;

    console.log("Categories API - Received filters:", {
      locations,
      search,
      verified,
      createdAfter,
      fundingPercentageMin,
      fundingPercentageMax,
    });

    try {
      // Use Prisma directly instead of raw SQL for better type safety and filtering
      const whereClause: any = {
        campaignStatus: "active",
        status: "active",
      };

      // Apply filters if they exist
      if (locations.length === 1) {
        whereClause.location = locations[0];
      } else if (locations.length > 1) {
        whereClause.location = { in: locations };
      }

      if (verified) {
        whereClause.verificationStatus = true;
      }

      if (search) {
        // Get potential location enum matches from the search term
        const locationMatches = getLocationEnumsFromSearch(search);

        // Build the search OR clause to include title, description, and location
        const searchConditions: Array<
          | { title: { contains: string; mode: string } }
          | { description: { contains: string; mode: string } }
          | { location: string }
        > = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];

        // Add location conditions if we found matching locations
        if (locationMatches.length > 0) {
          locationMatches.forEach((locationEnum) => {
            searchConditions.push({ location: locationEnum });
          });
        }

        whereClause.OR = searchConditions;
      }

      // Apply new filters
      if (createdAfter) {
        whereClause.createdAt = {
          gte: new Date(createdAfter),
        };
      }

      if (
        fundingPercentageMin !== undefined ||
        fundingPercentageMax !== undefined
      ) {
        whereClause.percentageFunded = {};

        if (fundingPercentageMin !== undefined) {
          whereClause.percentageFunded.gte = fundingPercentageMin;
        }

        if (fundingPercentageMax !== undefined) {
          whereClause.percentageFunded.lte = fundingPercentageMax;
        }
      }

      // Get all campaigns that match the filters
      const campaigns = await db.campaign.findMany({
        where: whereClause,
        select: {
          category: true,
        },
      });

      console.log(
        `Categories API - Found ${campaigns.length} total campaigns matching filters`
      );

      // Count the occurrences of each category
      const categoryCounts: Record<string, number> = {};

      campaigns.forEach((campaign) => {
        const category = campaign.category.toString();
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      console.log("Categories API - Category counts:", categoryCounts);

      // Format the categories for the response
      const categories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          name: displayCategoryMap[category] || category,
          count: count,
        }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({ categories });
    } catch (dbError) {
      console.error("Database error in categories API:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching categories:", error);

    // In development mode, return mock data as a fallback
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock categories data as fallback");
      return NextResponse.json({ categories: mockCategories });
    }

    // In production, return an empty list with a message
    return NextResponse.json(
      {
        categories: [],
        error: "Error fetching categories. Please try again later.",
      },
      { status: 200 } // Return 200 instead of 500 to handle the error gracefully
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

// Helper function to reverse-map location display names to DB enum values
function getLocationEnumsFromSearch(searchTerm: string): string[] {
  const displayToEnumMap: Record<string, string> = {
    "la paz": "la_paz",
    "santa cruz": "santa_cruz",
    cochabamba: "cochabamba",
    sucre: "sucre",
    oruro: "oruro",
    potosí: "potosi",
    potosi: "potosi",
    tarija: "tarija",
    beni: "beni",
    pando: "pando",
  };

  const searchLower = searchTerm.toLowerCase();
  const matchingEnums: string[] = [];

  // Check for exact matches first
  if (displayToEnumMap[searchLower]) {
    matchingEnums.push(displayToEnumMap[searchLower]);
  }

  // Check for partial matches
  Object.entries(displayToEnumMap).forEach(([displayName, enumValue]) => {
    if (
      displayName.includes(searchLower) &&
      !matchingEnums.includes(enumValue)
    ) {
      matchingEnums.push(enumValue);
    }
  });

  return matchingEnums;
}
