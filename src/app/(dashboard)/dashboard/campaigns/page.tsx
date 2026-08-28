"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { SuperAdminCampaignTable } from "@/components/dashboard/super-admin-campaign-table";
import { AdminCampaignApprovalsTable } from "@/components/dashboard/admin-campaign-approvals-table";
import { AdminFundTransfersTable } from "@/components/dashboard/admin-fund-transfers-table";
import { AdminEndedCampaignsTable } from "@/components/dashboard/admin-ended-campaigns-table";
import { CampaignAnalytics } from "@/components/dashboard/campaign-analytics";
import {
  CampaignCard,
  CampaignStatus,
} from "@/components/dashboard/campaign-card";
import { formatCurrency } from "@/lib/campaign-finance";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  goalAmount: number;
  collectedAmount: number;
  donorCount: number;
  percentageFunded: number;
  daysRemaining: number;
  status: "draft" | "active" | "completed" | "cancelled";
  verificationStatus: boolean;
  verificationRequestStatus?: "pending" | "approved" | "rejected" | null;
  verificationDate?: string;
  submittedForReviewAt?: string | null;
  createdAt: string;
  endDate: string;
  organizerName: string;
  organizerEmail: string;
  organizerId: string;
  imageUrl?: string;
  tipAmount: number;
  platformFeeAmount: number;
  totalProcessedAmount: number;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  averageFunding: number;
  verifiedCampaigns: number;
  completedCampaigns: number;
  totalTipAmount: number;
  totalPlatformFeeAmount: number;
  totalProcessedAmount: number;
  netAmount: number;
}

type CampaignsPageCache = {
  campaigns: Campaign[];
  stats: CampaignStats | null;
};

const campaignsPageCacheKey = (userId: string) => [
  "dashboard-campaigns",
  userId,
];

export default function SuperAdminCampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const userId = user?.id;
  const userEmail = user?.email;
  const userRole = profile?.role;

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [currentTab, setCurrentTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check user access and determine role
  useEffect(() => {
    const initializePage = async () => {
      if (isAuthLoading) return;

      if (!userId) {
        router.push("/sign-in");
        return;
      }

      // Check user role from profile
      const isUserAdmin = userRole === "admin";
      setIsAdmin(isUserAdmin);

      const cached = queryClient.getQueryData<CampaignsPageCache>(
        campaignsPageCacheKey(userId),
      );

      if (cached) {
        setCampaigns(cached.campaigns);
        setStats(cached.stats);
        setLoading(false);
      }

      try {
        await fetchCampaignsData(isUserAdmin, !cached);
      } catch (error) {
        console.error("Error initializing page:", error);
        toast({
          title: "Error",
          description:
            "No se pudieron cargar las campañas. Intenta nuevamente.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    initializePage();
  }, [isAuthLoading, queryClient, router, userId, userRole]);

  const fetchCampaignsData = async (
    userIsAdmin: boolean,
    showFullPageLoading = false,
  ) => {
    try {
      if (showFullPageLoading) setLoading(true);

      if (userIsAdmin) {
        // Admin user - fetch all campaigns and stats
        const [campaignsResponse, statsResponse] = await Promise.all([
          fetch("/api/admin/campaigns"),
          fetch("/api/admin/campaigns/stats"),
        ]);

        if (!campaignsResponse.ok) {
          throw new Error("Failed to fetch admin campaigns");
        }

        if (!statsResponse.ok) {
          throw new Error("Failed to fetch campaign stats");
        }

        const campaignsData = await campaignsResponse.json();
        const statsData = await statsResponse.json();

        const nextCampaigns = campaignsData.campaigns || [];
        setCampaigns(nextCampaigns);
        setStats(statsData);
        if (userId) {
          queryClient.setQueryData<CampaignsPageCache>(
            campaignsPageCacheKey(userId),
            { campaigns: nextCampaigns, stats: statsData },
          );
        }
      } else {
        // Regular user - fetch only their campaigns
        const campaignsResponse = await fetch("/api/campaign/user");

        if (!campaignsResponse.ok) {
          throw new Error("Failed to fetch user campaigns");
        }

        const campaignsData = await campaignsResponse.json();

        // Transform user campaigns to match the expected format
        const transformedCampaigns = (campaignsData.campaigns || []).map(
          (campaign: any) => ({
            id: campaign.id,
            title: campaign.title,
            description: campaign.description || "",
            category: campaign.category,
            location: campaign.location,
            goalAmount: Number(campaign.goal_amount),
            collectedAmount: Number(campaign.current_amount),
            donorCount: 0, // Not available in user API
            percentageFunded: Math.round(
              (Number(campaign.current_amount) / Number(campaign.goal_amount)) *
                100,
            ),
            daysRemaining: 0, // Calculate if needed
            status: campaign.status,
            verificationStatus: campaign.verification_status,
            verificationRequestStatus:
              campaign.verification_request_status || null,
            verificationDate: null,
            submittedForReviewAt: campaign.submitted_for_review_at,
            createdAt: campaign.created_at,
            endDate: "",
            organizerName: "You",
            organizerEmail: userEmail || "",
            organizerId: campaign.organizer_id,
            imageUrl: campaign.image_url,
            tipAmount: 0,
            platformFeeAmount: 0,
            totalProcessedAmount: 0,
            netAmount: 0,
          }),
        );

        setCampaigns(transformedCampaigns);

        // Calculate basic stats for regular users
        const totalCampaigns = transformedCampaigns.length;
        const activeCampaigns = transformedCampaigns.filter(
          (c: any) => c.status === "active",
        ).length;
        const totalRaised = transformedCampaigns.reduce(
          (sum: number, c: any) => sum + c.collectedAmount,
          0,
        );
        const verifiedCampaigns = transformedCampaigns.filter(
          (c: any) => c.verificationStatus,
        ).length;
        const completedCampaigns = transformedCampaigns.filter(
          (c: any) => c.status === "completed",
        ).length;

        const nextStats = {
          totalCampaigns,
          activeCampaigns,
          totalRaised,
          averageFunding: totalCampaigns > 0 ? totalRaised / totalCampaigns : 0,
          verifiedCampaigns,
          completedCampaigns,
          totalTipAmount: 0,
          totalPlatformFeeAmount: 0,
          totalProcessedAmount: 0,
          netAmount: 0,
        };
        setStats(nextStats);
        if (userId) {
          queryClient.setQueryData<CampaignsPageCache>(
            campaignsPageCacheKey(userId),
            { campaigns: transformedCampaigns, stats: nextStats },
          );
        }
      }
    } catch (error) {
      console.error("Error fetching campaigns data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las campañas. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      if (showFullPageLoading) setLoading(false);
    }
  };

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        campaign.title.toLowerCase().includes(term) ||
        campaign.organizerName.toLowerCase().includes(term) ||
        campaign.organizerEmail.toLowerCase().includes(term) ||
        campaign.category.toLowerCase().includes(term) ||
        campaign.location.toLowerCase().includes(term);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "all" && campaign.status !== statusFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all" && campaign.category !== categoryFilter) {
      return false;
    }

    // Verification filter
    if (verificationFilter === "verified" && !campaign.verificationStatus) {
      return false;
    }
    if (verificationFilter === "unverified" && campaign.verificationStatus) {
      return false;
    }

    return true;
  });

  const handleExportData = async () => {
    try {
      if (isAdmin) {
        // Admin export - use admin API
        const response = await fetch("/api/admin/campaigns/export", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filters: {
              search: searchTerm,
              status: statusFilter,
              category: categoryFilter,
              verification: verificationFilter,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to export data");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `campaigns-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Regular user export - create CSV from filtered campaigns
        const csvContent = [
          // CSV headers
          [
            "Título",
            "Categoría",
            "Ubicación",
            "Meta",
            "Monto recaudado",
            "Estado",
            "Estado de verificación",
            "Fecha de creación",
          ].join(","),
          // CSV data
          ...filteredCampaigns.map((campaign) =>
            [
              `"${campaign.title}"`,
              campaign.category,
              campaign.location,
              campaign.goalAmount,
              campaign.collectedAmount,
              campaign.status,
              campaign.verificationStatus ? "Verificada" : "No verificada",
              new Date(campaign.createdAt).toLocaleDateString(),
            ].join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `my-campaigns-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Exportación completada",
        description: "Los datos de las campañas se exportaron correctamente.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar los datos. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Regular user UI - Simple card layout
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Administrar mis campañas
            </h1>
          </div>
          <Button
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white flex items-center gap-2"
            asChild
          >
            <Link href="/create-campaign">
              <Plus size={16} />
              Nueva campaña
            </Link>
          </Button>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No tienes campañas aún</p>
            <Button
              className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
              asChild
            >
              <Link href="/create-campaign">
                <Plus size={16} className="mr-2" />
                Crear tu primera campaña
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                title={campaign.title}
                imageUrl={campaign.imageUrl || "/amboro-main.jpg"}
                category={campaign.category}
                location={campaign.location}
                raisedAmount={campaign.collectedAmount}
                goalAmount={campaign.goalAmount}
                progress={campaign.percentageFunded}
                status={campaign.status as CampaignStatus}
                isVerified={campaign.verificationStatus}
                verificationRequestStatus={campaign.verificationRequestStatus}
                submittedForReviewAt={campaign.submittedForReviewAt}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Admin UI - Full featured layout
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de campañas
          </h1>
          <p className="text-gray-600 mt-1">
            Administra y supervisa todas las campañas de la plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exportar datos
          </Button>
          <Button
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white flex items-center gap-2"
            asChild
          >
            <Link href="/create-campaign">
              <Plus size={16} />
              Nueva campaña
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Total de campañas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
              <p className="text-sm text-green-600">
                {stats.activeCampaigns} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Neto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.netAmount)}
              </div>
              <p className="text-sm text-gray-600">
                Donaciones completadas menos transferencias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total procesado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalProcessedAmount)}
              </div>
              <p className="text-sm text-gray-600">
                Base más aportes registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Aportes a Minka
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalTipAmount)}
              </div>
              <p className="text-sm text-gray-600">
                Contribuciones registradas para Minka
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total recaudado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRaised)}
              </div>
              <p className="text-sm text-gray-600">
                Solo el monto aplicado al progreso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Comisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPlatformFeeAmount)}
              </div>
              <p className="text-sm text-gray-600">
                5% estimado sobre el monto base
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.verifiedCampaigns}
              </div>
              <p className="text-sm text-gray-600">
                {stats.totalCampaigns > 0
                  ? (
                      (stats.verifiedCampaigns / stats.totalCampaigns) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                % del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completedCampaigns}
              </div>
              <p className="text-sm text-gray-600">
                {stats.totalCampaigns > 0
                  ? (
                      (stats.completedCampaigns / stats.totalCampaigns) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                % de tasa de éxito
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Resumen de campañas</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminCampaignApprovalsTable
            onCampaignUpdate={() => fetchCampaignsData(isAdmin)}
          />
          <AdminEndedCampaignsTable
            onCampaignUpdate={() => fetchCampaignsData(isAdmin)}
          />
          <AdminFundTransfersTable hideWhenEmpty />

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar campañas, organizadores o categorías..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="salud">Salud</SelectItem>
                    <SelectItem value="educacion">Educación</SelectItem>
                    <SelectItem value="emergencia">Emergencia</SelectItem>
                    <SelectItem value="medioambiente">
                      Medio Ambiente
                    </SelectItem>
                    <SelectItem value="cultura_arte">Cultura y Arte</SelectItem>
                    <SelectItem value="igualdad">Igualdad</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={verificationFilter}
                  onValueChange={setVerificationFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Verificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="verified">Verificadas</SelectItem>
                    <SelectItem value="unverified">No verificadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredCampaigns.length} de {campaigns.length}{" "}
                  campañas
                </p>
                {(searchTerm ||
                  statusFilter !== "all" ||
                  categoryFilter !== "all" ||
                  verificationFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCategoryFilter("all");
                      setVerificationFilter("all");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Table */}
          <Card>
            <CardContent className="p-0">
              <SuperAdminCampaignTable
                campaigns={filteredCampaigns}
                onCampaignUpdate={() => fetchCampaignsData(isAdmin)}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CampaignAnalytics campaigns={campaigns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
