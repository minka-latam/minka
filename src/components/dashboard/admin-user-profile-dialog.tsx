"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProfileData } from "@/types";

function formatDate(value: unknown, includeTime = false) {
  if (!value || typeof value !== "string") return "-";

  try {
    return format(new Date(value), includeTime ? "PPP p" : "PPP");
  } catch {
    return value;
  }
}

export function AdminUserProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ProfileData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profilePicture =
    user?.profile_picture || user?.profilePicture || null;
  const detailRows = user
    ? [
        ["ID", user.id],
        ["Nombre", user.name],
        ["Email", user.email],
        ["Teléfono", user.phone],
        ["Documento", user.identity_number || user.identityNumber],
        [
          "Fecha de nacimiento",
          formatDate(user.birth_date || user.birthDate),
        ],
        ["Ubicación", user.location],
        ["Campañas activas", user.active_campaigns_count ?? 0],
        ["Miembro desde", formatDate(user.join_date)],
        ["Creado", formatDate(user.created_at, true)],
        ["Actualizado", formatDate(user.updated_at, true)],
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil de usuario</DialogTitle>
          <DialogDescription>
            Información registrada en el perfil de Minka.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border bg-[#f5f7e9]">
                {profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={String(profilePicture)}
                    alt={user.name || "Imagen de perfil"}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-[#e8f0e9] text-7xl font-semibold text-[#2c6e49]">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-2xl border bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={user.role === "admin" ? "destructive" : "secondary"}
                  >
                    {user.role || "user"}
                  </Badge>
                  <Badge
                    variant={user.status === "inactive" ? "outline" : "secondary"}
                    className={
                      user.status === "inactive"
                        ? "border-gray-400 text-gray-600"
                        : "bg-[#e8f0e9] text-[#2c6e49] hover:bg-[#e8f0e9]"
                    }
                  >
                    {user.status === "inactive" ? "Inactive" : "Active"}
                  </Badge>
                </div>
                <p className="break-words text-lg font-semibold text-gray-900">
                  {user.name || "-"}
                </p>
                <p className="break-words text-sm text-gray-600">
                  {user.email || "-"}
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
                  {user.bio || "Sin biografía registrada."}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
