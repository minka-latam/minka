import { NextRequest, NextResponse } from "next/server";

import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminProfile();
    const { id: userId } = await params;

    if (admin.id === userId) {
      return NextResponse.json(
        { error: "Administrators cannot deactivate their own account" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "admin" && targetUser.status === "active") {
      const activeAdminCount = await prisma.profile.count({
        where: {
          role: "admin",
          status: "active",
        },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot deactivate the last active administrator" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: { status: "inactive" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    await createAdminAuditLog({
      adminId: admin.id,
      action: "user.deactivate",
      entityType: "profile",
      entityId: updatedUser.id,
      metadata: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        previousStatus: targetUser.status,
        newStatus: updatedUser.status,
      },
    });

    return NextResponse.json({
      message: "User deactivated successfully",
      user: updatedUser,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error deactivating user:", error);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 500 }
    );
  }
}

