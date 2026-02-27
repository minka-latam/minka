import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Fallback campaign data for development
const mockCampaigns = [
  {
    id: "1",
    title: "Protejamos juntos el Parque Nacional Amboró",
    description:
      "El Parque Nacional Amboró es uno de los lugares más biodiversos del mundo, hogar de especies únicas y ecosistemas vitales. Su conservación depende de todos nosotros.",
    category: "Medio ambiente",
    location: "Santa Cruz",
    goalAmount: 5000,
    collectedAmount: 4000,
    donorCount: 250,
    percentageFunded: 80,
    daysRemaining: 15,
    verified: true,
    organizer: {
      id: "org1",
      name: "Fundación Naturaleza",
      location: "Santa Cruz",
      profilePicture: null,
    },
    primaryImage: "/landing-page/dummies/Card/Imagen.png",
  },
  {
    id: "2",
    title: "Educación para niños en zonas rurales",
    description:
      "Ayúdanos a llevar educación de calidad a niños en zonas rurales de Bolivia que no tienen acceso a escuelas o materiales educativos adecuados.",
    category: "Educación",
    location: "La Paz",
    goalAmount: 3000,
    collectedAmount: 1950,
    donorCount: 180,
    percentageFunded: 65,
    daysRemaining: 30,
    verified: true,
    organizer: {
      id: "org2",
      name: "Fundación Educativa",
      location: "La Paz",
      profilePicture: null,
    },
    primaryImage: "/landing-page/dummies/Card/Imagen.png",
  },
  {
    id: "3",
    title: "Apoyo a artesanos locales",
    description:
      "Apoya a los artesanos locales para preservar técnicas tradicionales y promover el desarrollo económico sostenible en comunidades rurales.",
    category: "Cultura y arte",
    location: "Cochabamba",
    goalAmount: 2500,
    collectedAmount: 1125,
    donorCount: 120,
    percentageFunded: 45,
    daysRemaining: 25,
    verified: false,
    organizer: {
      id: "org3",
      name: "Artesanos Unidos",
      location: "Cochabamba",
      profilePicture: null,
    },
    primaryImage: "/landing-page/dummies/Card/Imagen.png",
  },
  {
    id: "4",
    title: "Centro de salud para comunidad indígena",
    description:
      "Ayuda a construir un centro de salud para comunidades indígenas que actualmente deben viajar largas distancias para recibir atención médica básica.",
    category: "Salud",
    location: "Beni",
    goalAmount: 7000,
    collectedAmount: 6300,
    donorCount: 320,
    percentageFunded: 90,
    daysRemaining: 10,
    verified: true,
    organizer: {
      id: "org4",
      name: "Médicos Solidarios",
      location: "Beni",
      profilePicture: null,
    },
    primaryImage: "/landing-page/dummies/Card/Imagen.png",
  },
  {
    id: "5",
    title: "Reforestación en la Amazonía",
    description:
      "Contribuye a nuestro proyecto de reforestación en la Amazonía boliviana para combatir la deforestación y proteger el pulmón del planeta.",
    category: "Medio ambiente",
    location: "Pando",
    goalAmount: 4000,
    collectedAmount: 1200,
    donorCount: 95,
    percentageFunded: 30,
    daysRemaining: 45,
    verified: true,
    organizer: {
      id: "org5",
      name: "Amazonía Viva",
      location: "Pando",
      profilePicture: null,
    },
    primaryImage: "/landing-page/dummies/Card/Imagen.png",
  },
  {
    id: "6",
    title: "Empoderamiento de mujeres emprendedoras",
    description:
      "Apoya a mujeres emprendedoras de comunidades vulnerables con capacitación y microcréditos para iniciar sus propios negocios sostenibles.",
    category: "Igualdad",
    location: "Santa Cruz",
    goalAmount: 3500,
    collectedAmount: 2625,
    donorCount: 210,
    percentageFunded: 75,
    daysRemaining: 20,
    verified: true,
    organizer: {
      id: "org6",
      name: "Mujeres Emprendedoras",
      location: "Santa Cruz",
      profilePicture: null,
    },
    primaryImage: "/landing-page/dummies/Card/Imagen.png",
  },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    // Get all query parameters for filtering
    const category = url.searchParams.get("category");
    const locations = url.searchParams
      .getAll("location")
      .map((location) => location.trim())
      .filter(Boolean);
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") || "popular"; // default sort
    const verified = url.searchParams.get("verified") === "true"; // keep for backward compatibility
    const verificationStatus = url.searchParams.get("verificationStatus"); // new parameter: 'verified', 'pending', 'unverified'
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12"); // items per page

    // New filter parameters
    const createdAfter = url.searchParams.get("createdAfter");
    const fundingPercentageMin = url.searchParams.get("fundingPercentageMin")
      ? parseInt(url.searchParams.get("fundingPercentageMin") || "0")
      : undefined;
    const fundingPercentageMax = url.searchParams.get("fundingPercentageMax")
      ? parseInt(url.searchParams.get("fundingPercentageMax") || "100")
      : undefined;

    // Calculate offset for pagination
    const skip = (page - 1) * limit;

    // Build the where clause with filters
    const whereClause: any = {
      campaignStatus: "active",
      status: "active",
    };

    // Apply filters if they exist
    if (category) {
      whereClause.category = category;
    }

    if (locations.length === 1) {
      whereClause.location = locations[0];
    } else if (locations.length > 1) {
      whereClause.location = { in: locations };
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

    if (verified) {
      whereClause.verificationStatus = true;
    }

    // Handle new verification status filter
    if (verificationStatus) {
      if (verificationStatus === "verified") {
        // Show campaigns that are verified (either through boolean flag or approved verification request)
        whereClause.OR = [
          { verificationStatus: true },
          {
            verificationRequests: {
              verificationStatus: "approved",
            },
          },
        ];
      } else if (verificationStatus === "pending") {
        // Show campaigns with pending verification requests
        whereClause.verificationRequests = {
          verificationStatus: "pending",
        };
      } else if (verificationStatus === "unverified") {
        // Show campaigns that are not verified and don't have pending/approved requests
        whereClause.AND = [
          {
            OR: [{ verificationStatus: false }, { verificationStatus: null }],
          },
          {
            OR: [
              {
                verificationRequests: {
                  is: null,
                },
              },
              {
                verificationRequests: {
                  verificationStatus: "rejected",
                },
              },
            ],
          },
        ];
      }
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

    // Determine sort order
    let orderBy: any = {};

    switch (sortBy) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "most_funded":
        orderBy = { percentageFunded: "desc" };
        break;
      case "ending_soon":
        orderBy = { daysRemaining: "asc" };
        break;
      case "popular":
      default:
        orderBy = { donorCount: "desc" };
        break;
    }

    // Execute the query to get campaigns
    const campaigns = await db.campaign.findMany({
      where: whereClause,
      include: {
        media: true,
        organizer: {
          select: {
            id: true,
            name: true,
            location: true,
            profilePicture: true,
          },
        },
        verificationRequests: {
          select: {
            verificationStatus: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Format the campaigns for the response
    const formattedCampaigns = campaigns.map((campaign) => {
      // Find primary image
      const primaryMedia = campaign.media.find((media) => media.isPrimary);

      // Format organizer data
      const organizerData = campaign.organizer
        ? {
            id: campaign.organizer.id,
            name: campaign.organizer.name,
            location: campaign.organizer.location || "",
            profilePicture: campaign.organizer.profilePicture,
          }
        : null;

      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: formatCategory(campaign.category.toString()), // Format the category for display
        location: formatLocation(campaign.location.toString()), // Format the location for display
        goalAmount: Number(campaign.goalAmount),
        collectedAmount: Number(campaign.collectedAmount),
        donorCount: campaign.donorCount,
        percentageFunded: campaign.percentageFunded,
        daysRemaining: campaign.daysRemaining,
        verified: campaign.verificationStatus,
        organizer: organizerData,
        primaryImage: primaryMedia ? primaryMedia.mediaUrl : null,
      };
    });

    // Get the count of matching campaigns
    const totalCount = await db.campaign.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);

    return NextResponse.json(
      {
        campaigns: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 12,
          hasMore: false,
        },
        error: "Error fetching campaigns. Please try again later.",
      },
      { status: 200 } // Return 200 to handle errors gracefully on the client side
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
