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
import { Download, Info, Pencil, Search, Trash2, UserCheck } from "lucide-react"; // Icons for actions
import { useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
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
import { buildCsv, downloadCsv } from "@/lib/csv-export";

interface AdminUserTableProps {
  users: ProfileData[];
}

export function AdminUserTable({ users }: AdminUserTableProps) {
  const router = useRouter();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ProfileData | null>(null);
  const [viewingUser, setViewingUser] = useState<ProfileData | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("user");
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const visibleUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();
    const filteredUsers = showInactiveUsers
      ? users
      : users.filter((user) => user.status !== "inactive");

    const searchedUsers = normalizedSearch
      ? filteredUsers.filter((user) =>
          (user.name || "").toLowerCase().includes(normalizedSearch)
        )
      : filteredUsers;

    return [...searchedUsers].sort((a, b) => {
      if (showInactiveUsers && a.status !== b.status) {
        if (a.status === "inactive") return -1;
        if (b.status === "inactive") return 1;
      }

      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });
  }, [showInactiveUsers, userSearch, users]);

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

  const handleActivateUser = async (user: ProfileData) => {
    setActivatingUserId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.error || "Could not activate the user.");
      }

      toast({
        title: "Usuario activado",
        description: `${user.email} fue activado nuevamente.`,
      });
      router.refresh();
    } catch (error: any) {
      console.error("Error activating user:", error);
      toast({
        title: "No se pudo activar el usuario",
        description: error.message || "Could not activate the user.",
        variant: "destructive",
      });
    } finally {
      setActivatingUserId(null);
    }
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

  const formatDate = (value: unknown, includeTime = false) => {
    if (!value || typeof value !== "string") return "-";

    try {
      return format(new Date(value), includeTime ? "PPP p" : "PPP");
    } catch {
      return value;
    }
  };

  const profilePicture =
    viewingUser?.profile_picture || viewingUser?.profilePicture || null;

  const handleExportUsers = () => {
    const csv = buildCsv(
      [
        "ID",
        "Nombre",
        "Email",
        "Teléfono",
        "Rol",
        "Estado",
        "Documento",
        "Fecha de nacimiento",
        "Ubicación",
        "Campañas activas",
        "Creado",
      ],
      visibleUsers.map((user) => [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.status || "active",
        user.identity_number || user.identityNumber,
        user.birth_date || user.birthDate,
        user.location,
        user.active_campaigns_count ?? 0,
        user.created_at,
      ]),
    );

    downloadCsv(
      `usuarios-export-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
  };

  const detailRows = viewingUser
    ? [
        ["ID", viewingUser.id],
        ["Nombre", viewingUser.name],
        ["Email", viewingUser.email],
        ["Teléfono", viewingUser.phone],
        ["Documento", viewingUser.identity_number || viewingUser.identityNumber],
        ["Fecha de nacimiento", formatDate(viewingUser.birth_date || viewingUser.birthDate)],
        ["Ubicación", viewingUser.location],
        ["Campañas activas", viewingUser.active_campaigns_count ?? 0],
        ["Miembro desde", formatDate(viewingUser.join_date)],
        ["Creado", formatDate(viewingUser.created_at, true)],
        ["Actualizado", formatDate(viewingUser.updated_at, true)],
      ]
    : [];

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Buscar por nombre"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#2c6e49] focus:ring-2 focus:ring-[#2c6e49]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportUsers}
            className="rounded-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar datos
          </Button>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-inactive-users"
              checked={showInactiveUsers}
              onCheckedChange={(checked) =>
                setShowInactiveUsers(checked === true)
              }
            />
            <label
              htmlFor="show-inactive-users"
              className="cursor-pointer text-sm font-medium text-gray-700"
            >
              mostrar usuarios inactivos
            </label>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleUsers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            visibleUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name || "-"}
                </TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>
                  {user.created_at
                    ? format(new Date(user.created_at), "PPP") // Format date nicely
                    : "-"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingUser(user)}
                  >
                    <Info className="mr-1 h-4 w-4" /> Info
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRoleDialog(user)}
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit Role
                  </Button>
                  {user.status === "inactive" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#2c6e49] hover:text-[#1e4d33]"
                      onClick={() => handleActivateUser(user)}
                      disabled={activatingUserId === user.id}
                    >
                      {activatingUserId === user.id ? (
                        "Activating..."
                      ) : (
                        <>
                          <UserCheck className="mr-1 h-4 w-4" /> Activate
                        </>
                      )}
                    </Button>
                  ) : (
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
                  )}
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

      <Dialog open={Boolean(viewingUser)} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil de usuario</DialogTitle>
            <DialogDescription>
              Información registrada en el perfil de Minka.
            </DialogDescription>
          </DialogHeader>

          {viewingUser && (
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border bg-[#f5f7e9]">
                  {profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={String(profilePicture)}
                      alt={viewingUser.name || "Imagen de perfil"}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-[#e8f0e9] text-7xl font-semibold text-[#2c6e49]">
                      {(viewingUser.name || viewingUser.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-2 rounded-2xl border bg-white p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        viewingUser.role === "admin"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {viewingUser.role || "user"}
                    </Badge>
                    <Badge
                      variant={
                        viewingUser.status === "inactive"
                          ? "outline"
                          : "secondary"
                      }
                      className={
                        viewingUser.status === "inactive"
                          ? "border-gray-400 text-gray-600"
                          : "bg-[#e8f0e9] text-[#2c6e49] hover:bg-[#e8f0e9]"
                      }
                    >
                      {viewingUser.status === "inactive" ? "Inactive" : "Active"}
                    </Badge>
                  </div>
                  <p className="break-words text-lg font-semibold text-gray-900">
                    {viewingUser.name || "-"}
                  </p>
                  <p className="break-words text-sm text-gray-600">
                    {viewingUser.email || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {detailRows.map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl border p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-gray-900">
                        {value === null || value === undefined || value === ""
                          ? "-"
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Biografía
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                    {viewingUser.bio || "Sin biografía registrada."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
