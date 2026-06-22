"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CheckCheck,
  HeartHandshake,
  Library,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDb } from "@/hooks/use-db";
import type { AdminAnalyticsData, AnalyticsPeriod } from "@/hooks/use-db";
import { useAuth } from "@/providers/auth-provider";
import { ProfileData } from "@/types";

const chartColors = [
  "#2c6e49",
  "#2563eb",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];

const periodOptions: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-BO").format(value);
};

const formatPercent = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const formatDate = (value: string) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

function hasChartData(data: Array<Record<string, unknown>>) {
  return data.some((item) =>
    Object.entries(item).some(
      ([key, value]) =>
        key !== "name" &&
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0
    )
  );
}

function EmptyChart({ label = "Sin datos para este periodo" }: { label?: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-gray-900">
          {value}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getProfile, getAnalytics, loading } = useDb();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [analyticsData, setAnalyticsData] =
    useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<AnalyticsPeriod>("month");

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setIsLoading(true);

      if (!user) {
        router.push("/sign-in");
        return;
      }

      const prismaProfile = await getProfile(user.id);

      if (!isActive) return;

      if (!prismaProfile) {
        router.push("/sign-in");
        return;
      }

      const getISOString = (dateVal: unknown): string => {
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

      if (prismaProfile.role === "admin") {
        const data = await getAnalytics(timeframe);
        if (isActive) {
          setAnalyticsData(data);
        }
      } else {
        setAnalyticsData(null);
      }

      if (isActive) {
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isActive = false;
    };
  }, [user, router, getProfile, getAnalytics, timeframe]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="space-y-3 p-4 md:p-6">
        <h1 className="text-3xl font-bold text-gray-800">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">
          Esta vista solo está disponible para administradores.
        </p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-3 p-4 md:p-6">
        <h1 className="text-3xl font-bold text-gray-800">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar las estadísticas.
        </p>
      </div>
    );
  }

  const { overview, charts, period } = analyticsData;
  const dateRange = `${formatDate(period.currentStart)} - ${formatDate(
    period.currentEnd
  )}`;
  const activityDescription = `${formatNumber(
    overview.interactionBreakdown.comments
  )} comentarios · ${formatNumber(
    overview.interactionBreakdown.savedCampaigns
  )} guardadas · ${formatNumber(
    overview.interactionBreakdown.campaignUpdates
  )} avances`;
  const growthDescription =
    overview.donationGrowthRate === null
      ? "Sin donaciones completadas en el periodo anterior"
      : `Vs. ${formatCurrency(
          overview.previousCompletedDonationAmount
        )} del periodo anterior`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Estadísticas de Minka
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {period.label} · {dateRange}. Los montos usan donaciones completadas;
            la actividad cuenta comentarios, guardados y avances publicados.
          </p>
        </div>

        <div className="inline-flex w-full rounded-lg border bg-white p-1 shadow-sm sm:w-auto">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={timeframe === option.value}
              className={`min-h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors sm:flex-none ${
                timeframe === option.value
                  ? "bg-[#2c6e49] text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={() => setTimeframe(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Usuarios nuevos"
          value={formatNumber(overview.newUsers)}
          description={`${formatNumber(overview.totalUsers)} perfiles registrados · ${formatNumber(
            overview.activeUsers
          )} activos`}
          icon={Users}
        />
        <MetricCard
          title="Campañas creadas"
          value={formatNumber(overview.newCampaigns)}
          description={`${formatNumber(overview.totalCampaigns)} campañas totales · ${formatNumber(
            overview.activeCampaigns
          )} activas`}
          icon={Library}
        />
        <MetricCard
          title="Recaudación completada"
          value={formatCurrency(overview.completedDonationAmount)}
          description={`${formatNumber(
            overview.completedDonationCount
          )} donaciones completadas en el periodo`}
          icon={HeartHandshake}
        />
        <MetricCard
          title="Verificaciones pendientes"
          value={formatNumber(overview.pendingVerifications)}
          description="Solicitudes de verificación activas por revisar"
          icon={CheckCheck}
        />
        <MetricCard
          title="Actividad registrada"
          value={formatNumber(overview.periodInteractions)}
          description={activityDescription}
          icon={Activity}
        />
        <MetricCard
          title="Variación de recaudación"
          value={
            overview.donationGrowthRate === null
              ? "Sin base"
              : formatPercent(overview.donationGrowthRate)
          }
          description={growthDescription}
          icon={TrendingUp}
        />
        <MetricCard
          title="Notificaciones creadas"
          value={formatNumber(overview.periodNotifications)}
          description={`${formatNumber(
            overview.totalNotifications
          )} notificaciones activas en total`}
          icon={Bell}
        />
        <MetricCard
          title="Donación promedio"
          value={formatCurrency(overview.averageDonationAmount)}
          description={`${formatCurrency(
            overview.totalCompletedDonationAmount
          )} recaudado histórico completado`}
          icon={HeartHandshake}
        />
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 sm:inline-grid sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="donations">Donaciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle>Campañas por categoría</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {hasChartData(charts.campaignCategories) ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.campaignCategories}
                          cx="50%"
                          cy="50%"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                          outerRadius={88}
                        >
                          {charts.campaignCategories.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No hay campañas creadas en este periodo" />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle>Estado actual de campañas</CardTitle>
              </CardHeader>
              <CardContent>
                {hasChartData(charts.campaignStatuses) ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.campaignStatuses}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" name="Campañas" fill="#2c6e49" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No hay campañas registradas" />
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Estado actual de verificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {hasChartData(charts.verificationStatuses) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.verificationStatuses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        name="Solicitudes"
                        fill="#2563eb"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label="No hay solicitudes de verificación" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="space-y-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Tendencia de donaciones completadas</CardTitle>
            </CardHeader>
            <CardContent>
              {hasChartData(charts.donationTrend) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.donationTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Monto"
                            ? formatCurrency(Number(value))
                            : formatNumber(Number(value))
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        name="Monto"
                        stroke="#2c6e49"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="donations"
                        name="Donaciones"
                        stroke="#2563eb"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label="No hay donaciones completadas en este periodo" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Métodos de pago completados</CardTitle>
            </CardHeader>
            <CardContent>
              {hasChartData(charts.donationMethods) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.donationMethods}
                        cx="50%"
                        cy="50%"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                      >
                        {charts.donationMethods.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${formatNumber(Number(value))} donaciones · ${formatCurrency(
                            Number(props.payload.amount)
                          )}`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label="No hay métodos de pago para mostrar" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Usuarios nuevos</CardTitle>
            </CardHeader>
            <CardContent>
              {hasChartData(charts.userTrend) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.userTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="newUsers"
                        fill="#2c6e49"
                        name="Usuarios nuevos"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label="No hay usuarios nuevos en este periodo" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Distribución actual de usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              {hasChartData(charts.userSegments) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.userSegments}
                        cx="50%"
                        cy="50%"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                      >
                        {charts.userSegments.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label="No hay usuarios registrados" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Actividad registrada</CardTitle>
            </CardHeader>
            <CardContent>
              {hasChartData(charts.activityTrend) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.activityTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="comments"
                        stackId="activity"
                        fill="#2563eb"
                        name="Comentarios"
                      />
                      <Bar
                        dataKey="savedCampaigns"
                        stackId="activity"
                        fill="#f59e0b"
                        name="Guardadas"
                      />
                      <Bar
                        dataKey="campaignUpdates"
                        stackId="activity"
                        fill="#2c6e49"
                        name="Avances"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart label="No hay actividad registrada en este periodo" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
