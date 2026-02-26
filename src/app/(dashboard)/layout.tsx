import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { UserDashboardLayout } from "@/components/dashboard/user-dashboard-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Panel de control de MINKA - Gestiona tus campañas y donaciones",
  robots: {
    index: false,
    follow: false,
  },
};

// This is a server component that checks authentication
// It works with client-side navigation because Next.js preserves
// the React state between navigations within the same layout group
// The DashboardLayoutClient handles client-side interactions
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({
    cookies: (() => cookieStore) as any,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Get user profile and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  // Check if user is admin or organizer
  const isAdmin = profile?.role === "admin";

  // Use different layouts based on user role
  if (isAdmin) {
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
  } else {
    return <UserDashboardLayout>{children}</UserDashboardLayout>;
  }
}
