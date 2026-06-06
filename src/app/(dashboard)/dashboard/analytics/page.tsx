"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  HeartHandshake,
  Library,
  CheckCheck,
  Activity,
  TrendingUp,
  Mail,
} from "lucide-react";
import { ProfileData } from "@/types";
import { useDb } from "@/hooks/use-db";
import { useAuth } from "@/providers/auth-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(amount);
};

// Sample data for charts (replace with actual data from API)
const donationData = [
  { name: "Ene", amount: 24000 },
  { name: "Feb", amount: 38000 },
  { name: "Mar", amount: 27000 },
  { name: "Abr", amount: 42000 },
  { name: "May", amount: 35000 },
  { name: "Jun", amount: 49000 },
];

const userActivityData = [
  { name: "Ene", newUsers: 120, activeUsers: 230 },
  { name: "Feb", newUsers: 150, activeUsers: 280 },
  { name: "Mar", newUsers: 190, activeUsers: 340 },
  { name: "Abr", newUsers: 210, activeUsers: 390 },
  { name: "May", newUsers: 250, activeUsers: 450 },
  { name: "Jun", newUsers: 290, activeUsers: 520 },
];

const campaignCategoryData = [
  { name: "Salud", value: 35 },
  { name: "Educación", value: 25 },
  { name: "Medio ambiente", value: 20 },
  { name: "Cultura y Arte", value: 10 },
  { name: "Emergencia", value: 5 },
  { name: "Igualdad", value: 5 },
];

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getProfile, getAnalytics, loading } = useDb();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [adminData, setAdminData] = useState({
    totalUsers: 0,
    totalCampaigns: 0,
    totalDonations: 0,
    pendingVerifications: 0,
    totalInteractions: 0,
    growthRate: 0,
    totalNotificationsSent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");

  useEffect(() => {
    async function loadData() {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Fetch current user's profile to check role
      const prismaProfile = await getProfile(user.id);

      if (!prismaProfile) {
        router.push("/sign-in");
        return;
      }

      // Convert to ProfileData
      const getISOString = (dateVal: any): string => {
        if (typeof dateVal === "string") return dateVal;
        if (dateVal instanceof Date) return dateVal.toISOString();
        return new Date().toISOString();
      };

      const profileData: ProfileData = {
        id: prismaProfile.id,
        name: prismaProfile.name,
        email: prismaProfile.email,
        phone: prismaProfile.phone,
        role: prismaProfile.role,
        created_at: getISOString(prismaProfile.createdAt),
      };

      setProfile(profileData);

      // --- Admin-Specific Data Fetching ---
      if (prismaProfile.role === "admin") {
        const analyticsData = await getAnalytics();

        // In development, add some extra metrics for demonstration
        if (process.env.NODE_ENV === "development") {
          analyticsData.totalInteractions = 1542;
          analyticsData.growthRate = 12.5;
          analyticsData.totalNotificationsSent = 654;
        }

        // Update the admin data with values from API, with fallbacks to 0 for optional fields
        setAdminData({
          totalUsers: analyticsData.totalUsers,
          totalCampaigns: analyticsData.totalCampaigns,
          totalDonations: analyticsData.totalDonations,
          pendingVerifications: analyticsData.pendingVerifications,
          totalInteractions: analyticsData.totalInteractions || 0,
          growthRate: analyticsData.growthRate || 0,
          totalNotificationsSent: analyticsData.totalNotificationsSent || 0,
        });
      }

      setIsLoading(false);
    }

    loadData();
  }, [user, router, getProfile, getAnalytics]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect non-admins or show a limited view
  if (profile?.role !== "admin") {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <p>Analytics view is only available for administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Estadísticas de Minka
        </h1>

        <div className="flex items-center space-x-2 bg-white rounded-md border p-1">
          <button
            className={`px-3 py-1 text-sm rounded ${timeframe === "week" ? "bg-gray-100 font-medium" : ""}`}
            onClick={() => setTimeframe("week")}
          >
            Semana
          </button>
          <button
            className={`px-3 py-1 text-sm rounded ${timeframe === "month" ? "bg-gray-100 font-medium" : ""}`}
            onClick={() => setTimeframe("month")}
          >
            Mes
          </button>
          <button
            className={`px-3 py-1 text-sm rounded ${timeframe === "year" ? "bg-gray-100 font-medium" : ""}`}
            onClick={() => setTimeframe("year")}
          >
            Año
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminData.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{adminData.growthRate}% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Campañas
            </CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminData.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +8% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Donaciones
            </CardTitle>
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(adminData.totalDonations)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +15% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verificaciones Pendientes
            </CardTitle>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminData.pendingVerifications}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adminData.pendingVerifications} campañas requieren revisión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interacciones</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminData.totalInteractions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Visitas, comentarios y compartidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminData.growthRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de crecimiento mensual
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notificaciones
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminData.totalNotificationsSent || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Notificaciones enviadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="donations">Donaciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Campañas por Categoría</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={campaignCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {campaignCategoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de verificación de campañas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Verificadas",
                        value:
                          adminData.totalCampaigns -
                          adminData.pendingVerifications,
                      },
                      {
                        name: "Pendientes",
                        value: adminData.pendingVerifications,
                      },
                      { name: "Rechazadas", value: 3 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2c6e49" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Donaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={donationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#2c6e49"
                      activeDot={{ r: 8 }}
                      name="Monto recaudado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Donación Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center p-6">
                  {formatCurrency(adminData.totalDonations / 145)}
                </div>
                <p className="text-center text-muted-foreground">
                  Por transacción
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Tarjeta", value: 65 },
                          { name: "QR", value: 30 },
                          { name: "Transferencia", value: 5 },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userActivityData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="newUsers"
                      fill="#8884d8"
                      name="Nuevos usuarios"
                    />
                    <Bar
                      dataKey="activeUsers"
                      fill="#82ca9d"
                      name="Usuarios activos"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Donadores", value: 75 },
                        { name: "Organizadores", value: 20 },
                        { name: "Administradores", value: 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
