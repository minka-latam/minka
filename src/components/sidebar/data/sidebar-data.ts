import {
  LayoutDashboard,
  Users,
  AreaChart,
  HeartHandshake,
  Building2,
  ShieldCheck,
  FileClock,
  HandCoins,
  Bell,
  Megaphone,
  Bookmark,
  Compass,
  PlusCircle,
  Settings,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "MINKA",
      logo: HeartHandshake,
      plan: "Panel de Administración",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Panel Principal",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Campañas",
          url: "/dashboard/campaigns",
          icon: Megaphone,
        },
        {
          title: "Guardadas para mí",
          url: "/dashboard/saved",
          icon: Bookmark,
        },
        {
          title: "Explorar",
          url: "/all-campaigns",
          icon: Compass,
        },
        {
          title: "Crear Campaña",
          url: "/create-campaign",
          icon: PlusCircle,
        },
        {
          title: "Verificaciones",
          url: "/dashboard/verification",
          icon: ShieldCheck,
        },
        {
          title: "Donaciones",
          url: "/dashboard/donations",
          icon: HandCoins,
        },
        {
          title: "Notificaciones",
          url: "/dashboard/notifications/admin",
          icon: Bell,
        },
        {
          title: "Usuarios",
          url: "/dashboard/users",
          icon: Users,
        },
        {
          title: "Personas Jurídicas",
          url: "/dashboard/legal-entities",
          icon: Building2,
        },
        {
          title: "Estadísticas",
          url: "/dashboard/analytics",
          icon: AreaChart,
        },
        {
          title: "Auditoría",
          url: "/dashboard/audit-logs",
          icon: FileClock,
        },
        {
          title: "Configuración",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
};
