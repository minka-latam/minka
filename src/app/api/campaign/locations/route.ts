import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

// Interface for location count data
interface LocationCount {
  location: string;
  count: string | number;
}

// Fallback locations data for development
const mockLocations = [
  { name: "La Paz", count: 45 },
  { name: "Santa Cruz", count: 38 },
  { name: "Cochabamba", count: 25 },
  { name: "Sucre", count: 12 },
  { name: "Oruro", count: 8 },
  { name: "Potosí", count: 6 },
  { name: "Tarija", count: 5 },
  { name: "Beni", count: 4 },
  { name: "Pando", count: 3 },
];

// Map database enum values to display names
const displayLocationMap: Record<string, string> = {
  la_paz: "La Paz",
  santa_cruz: "Santa Cruz",
  cochabamba: "Cochabamba",
  sucre: "Sucre",
  oruro: "Oruro",
  potosi: "Potosí",
  tarija: "Tarija",
  beni: "Beni",
  pando: "Pando",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // Get filters from query parameters
    const category = url.searchParams.get("category");
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

    console.log("Locations API - Received filters:", {
      category,
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
      if (category) {
        whereClause.category = category;
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
          location: true,
        },
      });

      console.log(
        `Locations API - Found ${campaigns.length} total campaigns matching filters`
      );

      // Count the occurrences of each location
      const locationCounts: Record<string, number> = {};

      campaigns.forEach((campaign) => {
        const location = campaign.location.toString();
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });

      console.log("Locations API - Location counts:", locationCounts);

      // Format the locations for the response
      const locations = Object.entries(locationCounts)
        .map(([location, count]) => ({
          name: displayLocationMap[location] || location,
          count: count,
        }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({ locations });
    } catch (dbError) {
      console.error("Database error in locations API:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Error fetching locations:", error);

    // In development mode, return mock data as a fallback
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock locations data as fallback");
      return NextResponse.json({ locations: mockLocations });
    }

    // In production, return an empty list with a message
    return NextResponse.json(
      {
        locations: [],
        error: "Error fetching locations. Please try again later.",
      },
      { status: 200 } // Return 200 instead of 500 to handle the error gracefully
    );
  }
}

// Helper function to format location from DB enum to display format
function formatLocation(location: string) {
  const locationMap: Record<string, string> = {
    la_paz: "La Paz",
    santa_cruz: "Santa Cruz",
    cochabamba: "Cochabamba",
    sucre: "Sucre",
    oruro: "Oruro",
    potosi: "Potosí",
    tarija: "Tarija",
    beni: "Beni",
    pando: "Pando",
  };

  return locationMap[location] || location;
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
