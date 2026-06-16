import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./nav-group";
import { sidebarData } from "./data/sidebar-data";
import type { NavGroupProps } from "./types";
import { HeartHandshake } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 rounded-lg bg-[#2c6e49] px-3 py-2 text-white">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10">
            <HeartHandshake className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">MINKA</span>
            <span className="truncate text-xs text-white/80">
              Panel de Administración
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props: NavGroupProps) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
