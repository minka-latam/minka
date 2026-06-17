import { NextRequest, NextResponse } from "next/server";

import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const allowedRoles = new Set(["admin", "user"]);
const allowedStatuses = new Set(["active", "inactive"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminProfile();
    const { id: userId } = await params;
    const body = await request.json();
    const nextRole = body?.role;
    const nextStatus = body?.status;
    const hasRoleUpdate = Object.hasOwn(body ?? {}, "role");
    const hasStatusUpdate = Object.hasOwn(body ?? {}, "status");

    if (!hasRoleUpdate && !hasStatusUpdate) {
      return NextResponse.json(
        { error: "Role or status is required" },
        { status: 400 }
      );
    }

    if (hasRoleUpdate && !allowedRoles.has(nextRole)) {
      return NextResponse.json(
        { error: "Role must be admin or user" },
        { status: 400 }
      );
    }

    if (hasStatusUpdate && !allowedStatuses.has(nextStatus)) {
      return NextResponse.json(
        { error: "Status must be active or inactive" },
        { status: 400 }
      );
    }

    if (hasRoleUpdate && admin.id === userId) {
      return NextResponse.json(
        { error: "Administrators cannot change their own role" },
        { status: 400 }
      );
    }

    if (hasStatusUpdate && admin.id === userId && nextStatus !== "active") {
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

    if (
      targetUser.role === "admin" &&
      targetUser.status === "active" &&
      ((hasRoleUpdate && nextRole !== "admin") ||
        (hasStatusUpdate && nextStatus !== "active"))
    ) {
      const activeAdminCount = await prisma.profile.count({
        where: {
          role: "admin",
          status: "active",
        },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last active administrator" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...(hasRoleUpdate ? { role: nextRole } : {}),
        ...(hasStatusUpdate ? { status: nextStatus } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    const roleChanged = hasRoleUpdate && targetUser.role !== updatedUser.role;
    const statusChanged =
      hasStatusUpdate && targetUser.status !== updatedUser.status;
    const auditAction =
      roleChanged
        ? "user.role.update"
        : statusChanged && updatedUser.status === "active"
          ? "user.activate"
          : statusChanged && updatedUser.status === "inactive"
            ? "user.deactivate"
            : "user.role.update";

    await createAdminAuditLog({
      adminId: admin.id,
      action: auditAction,
      entityType: "profile",
      entityId: updatedUser.id,
      metadata: {
        name: updatedUser.name,
        email: updatedUser.email,
        previousRole: targetUser.role,
        newRole: updatedUser.role,
        previousStatus: targetUser.status,
        newStatus: updatedUser.status,
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}

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
