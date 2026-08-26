import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { sidebarData } from "./data/sidebar-data";
import type { NavGroupProps } from "./types";
import { HeartHandshake } from "lucide-react";
import { SidebarLogoutButton } from "./sidebar-logout-button";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <Link
          href="/"
          aria-label="Ir a la página principal de Minka"
          className="flex items-center gap-2 rounded-lg bg-[#2c6e49] px-3 py-2 text-white transition-colors hover:bg-[#23583a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6e49] focus-visible:ring-offset-2"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10">
            <HeartHandshake className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">MINKA</span>
            <span className="truncate text-xs text-white/80">
              Panel de Administración
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props: NavGroupProps) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarLogoutButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
