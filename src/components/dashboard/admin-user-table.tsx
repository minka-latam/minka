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
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminUserTableProps {
  users: ProfileData[];
}

export function AdminUserTable({ users }: AdminUserTableProps) {
  const router = useRouter();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ProfileData | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("user");
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const handleDeleteUser = async (userId: string, userEmail: string | null) => {
    // Optional: Add a confirmation dialog here
    if (
      !confirm(
        `Are you sure you want to deactivate user ${userEmail}? They will no longer be treated as an active user.`
      )
    ) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.error || "Could not deactivate the user.");
      }

      toast({
        title: "User Deactivated",
        description: `User ${userEmail} has been deactivated.`,
      });
      router.refresh(); // Refresh data
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Deactivation Failed",
        description: error.message || "Could not deactivate the user.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const openRoleDialog = (user: ProfileData) => {
    setEditingUser(user);
    setSelectedRole(user.role === "admin" ? "admin" : "user");
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;

    setUpdatingRoleId(editingUser.id);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.error || "Could not update the user role.");
      }

      toast({
        title: "Rol actualizado",
        description: `${editingUser.email} ahora tiene rol ${selectedRole}.`,
      });
      setEditingUser(null);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "No se pudo actualizar el rol",
        description: error.message || "Could not update the user role.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRoleId(null);
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRoleDialog(user)}
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
                      "Deactivating..."
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-4 w-4" /> Deactivate
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={Boolean(editingUser)} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar rol de usuario</DialogTitle>
            <DialogDescription>
              Cambia el rol de {editingUser?.email || "este usuario"}. Sólo se
              permiten roles admin y user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rol</label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value === "admin" ? "admin" : "user")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={Boolean(updatingRoleId)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
              onClick={handleUpdateRole}
              disabled={!editingUser || updatingRoleId === editingUser.id}
            >
              {updatingRoleId === editingUser?.id
                ? "Guardando..."
                : "Guardar rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
