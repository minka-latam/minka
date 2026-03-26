"use client";

import { ProfileData } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns"; // For formatting dates
import { Pencil, Trash2 } from "lucide-react"; // Icons for actions
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

// TODO: Potentially add a modal for editing user roles
// import { EditUserRoleModal } from './edit-user-role-modal';

interface AdminUserTableProps {
  users: ProfileData[];
}

export function AdminUserTable({ users }: AdminUserTableProps) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  // State for edit modal (example)
  // const [editingUser, setEditingUser] = useState<ProfileData | null>(null);

  const handleDeleteUser = async (userId: string, userEmail: string | null) => {
    // Optional: Add a confirmation dialog here
    if (
      !confirm(
        `Are you sure you want to delete user ${userEmail}? This action might require additional backend logic for full cleanup.`
      )
    ) {
      return;
    }

    setDeletingUserId(userId);
    try {
      // IMPORTANT: Deleting users directly might have consequences.
      // This typically requires backend functions (Supabase Edge Functions)
      // to handle related data (campaigns, donations, auth user etc.) properly.
      // Calling delete directly on 'profiles' might leave orphaned data.
      // For now, we'll just delete the profile row as a placeholder.
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: `User ${userEmail} profile has been deleted.`,
      });
      router.refresh(); // Refresh data
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Could not delete the user.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name || "-"}
                </TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "admin" ? "destructive" : "secondary"
                    }
                  >
                    {user.role || "user"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.created_at
                    ? format(new Date(user.created_at), "PPP") // Format date nicely
                    : "-"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {/* Placeholder Edit Button - could open a modal */}
                  <Button
                    variant="ghost"
                    size="sm"
                    // onClick={() => setEditingUser(user)} // Example: Open edit modal
                    disabled // Disable until functionality is added
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit Role
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    disabled={deletingUserId === user.id}
                  >
                    {deletingUserId === user.id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Placeholder for Edit User Modal */}
      {/* {editingUser && (
        <EditUserRoleModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            router.refresh(); // Refresh data after edit
          }}
        />
      )} */}
    </>
  );
}

