import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";;
import { z } from "zod";


// Validation schema for legal entity
const legalEntitySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  legalForm: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  documentUrls: z.array(z.string().url()).optional(),
  isActive: z.boolean().default(true),
});

// GET - Fetch all legal entities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { taxId: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    where.status = "active";

    const [legalEntities, total] = await Promise.all([
      prisma.legalEntity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              campaigns: true,
            },
          },
        },
      }),
      prisma.legalEntity.count({ where }),
    ]);

    return NextResponse.json({
      legalEntities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching legal entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch legal entities" },
      { status: 500 }
    );
  }
}

// POST - Create new legal entity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = legalEntitySchema.parse(body);

    // Prepare data for Prisma with proper enum conversion
    const createData: any = {
      name: validatedData.name,
      taxId: validatedData.taxId,
      registrationNumber: validatedData.registrationNumber,
      legalForm: validatedData.legalForm,
      address: validatedData.address,
      city: validatedData.city,
      phone: validatedData.phone,
      email: validatedData.email,
      website: validatedData.website,
      description: validatedData.description,
      documentUrls: validatedData.documentUrls || [],
      isActive: validatedData.isActive ?? true,
    };

    // Only add enum fields if they are provided and valid
    if (validatedData.province) {
      createData.province = validatedData.province;
    }
    if (validatedData.department) {
      createData.department = validatedData.department;
    }

    // Create legal entity
    const legalEntity = await prisma.legalEntity.create({
      data: createData,
    });

    return NextResponse.json({
      message: "Legal entity created successfully",
      legalEntity,
    });
  } catch (error) {
    console.error("Error creating legal entity:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create legal entity" },
      { status: 500 }
    );
  }
}

// PUT - Update legal entity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Legal entity ID is required" },
        { status: 400 }
      );
    }

    // Validate input
    const validatedData = legalEntitySchema.partial().parse(updateData);

    // Check if legal entity exists
    const existingEntity = await prisma.legalEntity.findUnique({
      where: { id },
    });

    if (!existingEntity) {
      return NextResponse.json(
        { error: "Legal entity not found" },
        { status: 404 }
      );
    }

    // Prepare update data with proper enum conversion
    const updateDataForPrisma: any = {};

    // Copy all validated fields except province and department first
    Object.keys(validatedData).forEach((key) => {
      if (
        key !== "province" &&
        key !== "department" &&
        validatedData[key as keyof typeof validatedData] !== undefined
      ) {
        updateDataForPrisma[key] =
          validatedData[key as keyof typeof validatedData];
      }
    });

    // Handle enum fields separately
    if (validatedData.province !== undefined) {
      updateDataForPrisma.province = validatedData.province;
    }
    if (validatedData.department !== undefined) {
      updateDataForPrisma.department = validatedData.department;
    }

    // Update legal entity
    const updatedEntity = await prisma.legalEntity.update({
      where: { id },
      data: updateDataForPrisma,
    });

    return NextResponse.json({
      message: "Legal entity updated successfully",
      legalEntity: updatedEntity,
    });
  } catch (error) {
    console.error("Error updating legal entity:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update legal entity" },
      { status: 500 }
    );
  }
}

// DELETE - Delete/deactivate legal entity
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Legal entity ID is required" },
        { status: 400 }
      );
    }

    // Check if legal entity exists
    const existingEntity = await prisma.legalEntity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!existingEntity) {
      return NextResponse.json(
        { error: "Legal entity not found" },
        { status: 404 }
      );
    }

    // Check if entity has active campaigns
    if (existingEntity._count.campaigns > 0) {
      // Soft delete - just deactivate
      await prisma.legalEntity.update({
        where: { id },
        data: {
          isActive: false,
          status: "inactive",
        },
      });

      return NextResponse.json({
        message:
          "Legal entity deactivated successfully (has associated campaigns)",
      });
    } else {
      // Hard delete if no campaigns
      await prisma.legalEntity.delete({
        where: { id },
      });

      return NextResponse.json({
        message: "Legal entity deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting legal entity:", error);
    return NextResponse.json(
      { error: "Failed to delete legal entity" },
      { status: 500 }
    );
  }
}
