import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminUserTable } from "@/components/dashboard/admin-user-table";
import { ProfileData } from "@/types"; // Assuming ProfileData includes id, name, email, role, created_at

export default async function ManageUsersPage() {
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

  // Fetch current user's profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single<Pick<ProfileData, "role">>();

  // Only allow admins to access this page
  if (profile?.role !== "admin") {
    // Redirect non-admins to their dashboard or show an error page
    redirect("/dashboard");
  }

  // Fetch all user profiles if the user is an admin
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, created_at, phone, address")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    // Handle error appropriately, maybe show an error message
    return (
      <div className="p-6 text-red-600">
        Error loading users. Please try again later.
      </div>
    );
  }

  // Ensure users data is typed correctly, filtering out null if necessary
  const validUsers: ProfileData[] = (users || []).filter(
    (user): user is ProfileData => user !== null
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
      <div className="bg-card rounded-lg p-4 md:p-6 border">
        {/* Render the table component with fetched users */}
        <AdminUserTable users={validUsers} />
      </div>
    </div>
  );
}
