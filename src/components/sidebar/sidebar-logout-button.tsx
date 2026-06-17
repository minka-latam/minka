"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function SidebarLogoutButton() {
  const { signOut, isLoading } = useAuth();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => signOut()}
      disabled={isLoading}
      className="h-10 justify-start gap-2 rounded-md px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
    >
      <LogOut className="h-4 w-4" />
      <span className="group-data-[collapsible=icon]:hidden">Salir</span>
    </Button>
  );
}
