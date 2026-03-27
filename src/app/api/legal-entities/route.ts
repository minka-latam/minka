import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// GET - Fetch active legal entities for campaign form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause for active entities only
    const where: any = {
      isActive: true,
      status: "active",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { taxId: { contains: search, mode: "insensitive" } },
        { legalForm: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const legalEntities = await prisma.legalEntity.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        taxId: true,
        legalForm: true,
        city: true,
        department: true,
        email: true,
        phone: true,
        description: true,
      },
    });

    return NextResponse.json({
      legalEntities,
      total: legalEntities.length,
    });
  } catch (error) {
    console.error("Error fetching legal entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch legal entities" },
      { status: 500 }
    );
  }
}
