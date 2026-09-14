"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  Users,
  DollarSign,
  PanelLeftOpen,
  PanelLeftClose,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineSpinner } from "@/components/ui/inline-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
}

export function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin/auth", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        // If not authenticated or not admin, redirect to login
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!data.isAdmin) {
        // If authenticated but not admin, show error and redirect
        toast({
          title: "Acceso denegado",
          description:
            "No tienes permisos de administrador para acceder a esta sección.",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast({
        title: "Error",
        description:
          "Hubo un problema verificando tus permisos de administrador.",
        variant: "destructive",
      });
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.push("/login");
      } else {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión correctamente.",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <InlineSpinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`bg-white border-r transition-all duration-300 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b flex items-center justify-between">
            {!isSidebarCollapsed && (
              <Link href="/admin" className="font-bold text-xl">
                Minka Admin
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="ml-auto"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <NavItem
              href="/admin"
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              collapsed={isSidebarCollapsed}
            />
            <NavItem
              href="/admin/verification"
              icon={<CheckSquare size={20} />}
              label="Verificaciones"
              collapsed={isSidebarCollapsed}
            />
            <NavItem
              href="/admin/users"
              icon={<Users size={20} />}
              label="Usuarios"
              collapsed={isSidebarCollapsed}
            />
            <NavItem
              href="/admin/donations"
              icon={<DollarSign size={20} />}
              label="Aportes"
              collapsed={isSidebarCollapsed}
            />
            <NavItem
              href="/admin/settings"
              icon={<Settings size={20} />}
              label="Configuración"
              collapsed={isSidebarCollapsed}
            />
          </nav>

          {/* User info & logout */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarImage
                  src={user?.profilePicture || ""}
                  alt={user?.name || ""}
                />
                <AvatarFallback>
                  {user?.name.substring(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size={isSidebarCollapsed ? "icon" : "default"}
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut size={18} className={isSidebarCollapsed ? "" : "mr-2"} />
              {!isSidebarCollapsed && "Cerrar sesión"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  collapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-md p-3 text-gray-700 hover:bg-gray-100 ${
        collapsed ? "justify-center" : ""
      }`}
    >
      {icon}
      {!collapsed && <span className="ml-3">{label}</span>}
    </Link>
  );
}
