import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export async function requireAdminProfile(): Promise<AdminProfile> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AdminAuthError("Authentication required", 401);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new AdminAuthError("Only administrators can access this resource", 403);
  }

  return profile;
}

export function adminAuthErrorResponse(error: unknown) {
  if (!(error instanceof AdminAuthError)) {
    return null;
  }

  return NextResponse.json({ error: error.message }, { status: error.status });
}

export async function createAdminAuditLog({
  adminId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.$executeRaw`
      insert into public.admin_audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      values (
        ${adminId}::uuid,
        ${action},
        ${entityType},
        ${entityId ?? null}::uuid,
        ${JSON.stringify(metadata ?? {})}::jsonb
      )
    `;
  } catch (error) {
    console.error("Failed to create admin audit log:", error);
  }
}
