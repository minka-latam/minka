"use client";

import { useState, type ReactNode } from "react";

import { AdminUserProfileDialog } from "@/components/dashboard/admin-user-profile-dialog";
import { ButtonSpinner } from "@/components/ui/inline-spinner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/providers/auth-provider";
import type { ProfileData } from "@/types";
import { cn } from "@/lib/utils";

export function AdminUserProfileLink({
  userId,
  children,
  className,
}: {
  userId?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isAdmin = profile?.role === "admin" && profile?.status !== "inactive";

  if (!isAdmin || !userId) {
    return <span className={className}>{children}</span>;
  }

  const openProfile = async () => {
    if (user) {
      setOpen(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el perfil");
      }

      setUser(data.user);
      setOpen(true);
    } catch (error) {
      toast({
        title: "No se pudo abrir el perfil",
        description:
          error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openProfile}
        disabled={loading}
        className={cn(
          "inline-flex items-center text-left text-[#2c6e49] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6e49] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70",
          className,
        )}
      >
        {children}
        {loading && <ButtonSpinner className="ml-1.5 mr-0" />}
      </button>
      <AdminUserProfileDialog
        user={user}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
