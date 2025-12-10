"use client";

import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { UserSettingsDialog } from "./user-settings-dialog";

export function AdminProfileDropdown() {
  const { signOut, profile, user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!profile || !user) return null;

  const displayName = profile.name || user.email?.split("@")[0] || "Admin";

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile.name) {
      return profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || "A";
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    return role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8 ring-2 ring-primary/10">
              <AvatarImage
                src={
                  typeof profile.profile_picture === "string"
                    ? profile.profile_picture
                    : ""
                }
                alt={displayName}
              />
              <AvatarFallback className="bg-primary/10">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <Badge variant="outline" className="ml-2 text-xs">
                  {getRoleDisplay(profile.role)}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
