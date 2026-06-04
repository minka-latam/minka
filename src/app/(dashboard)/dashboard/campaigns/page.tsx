"use client";

import { useState, useEffect } from "react";
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
}

export default function SuperAdminCampaignsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

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
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Check user role from profile
      const userRole = profile?.role;
      const isUserAdmin = userRole === "admin";
      setIsAdmin(isUserAdmin);

      try {
        await fetchCampaignsData(isUserAdmin);
      } catch (error) {
        console.error("Error initializing page:", error);
        toast({
          title: "Error",
          description: "Failed to load campaigns data. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    initializePage();
  }, [user, profile, router]);

  const fetchCampaignsData = async (userIsAdmin: boolean) => {
    try {
      setLoading(true);

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

        setCampaigns(campaignsData.campaigns || []);
        setStats(statsData);
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
                100
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
            organizerEmail: user?.email || "",
            organizerId: campaign.organizer_id,
            imageUrl: campaign.image_url,
            tipAmount: 0,
            platformFeeAmount: 0,
            totalProcessedAmount: 0,
          })
        );

        setCampaigns(transformedCampaigns);

        // Calculate basic stats for regular users
        const totalCampaigns = transformedCampaigns.length;
        const activeCampaigns = transformedCampaigns.filter(
          (c: any) => c.status === "active"
        ).length;
        const totalRaised = transformedCampaigns.reduce(
          (sum: number, c: any) => sum + c.collectedAmount,
          0
        );
        const verifiedCampaigns = transformedCampaigns.filter(
          (c: any) => c.verificationStatus
        ).length;
        const completedCampaigns = transformedCampaigns.filter(
          (c: any) => c.status === "completed"
        ).length;

        setStats({
          totalCampaigns,
          activeCampaigns,
          totalRaised,
          averageFunding: totalCampaigns > 0 ? totalRaised / totalCampaigns : 0,
          verifiedCampaigns,
          completedCampaigns,
          totalTipAmount: 0,
          totalPlatformFeeAmount: 0,
          totalProcessedAmount: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching campaigns data:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            "Title",
            "Category",
            "Location",
            "Goal Amount",
            "Collected Amount",
            "Status",
            "Verification Status",
            "Created Date",
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
              campaign.verificationStatus ? "Verified" : "Unverified",
              new Date(campaign.createdAt).toLocaleDateString(),
            ].join(",")
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
        title: "Export Successful",
        description: "Campaign data has been exported successfully.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export campaign data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
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
                verificationRequestStatus={
                  campaign.verificationRequestStatus
                }
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
            Campaign Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all campaigns on the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Export Data
          </Button>
          <Button
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white flex items-center gap-2"
            asChild
          >
            <Link href="/create-campaign">
              <Plus size={16} />
              New Campaign
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
                Total Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
              <p className="text-sm text-green-600">
                {stats.activeCampaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Raised
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRaised)}
              </div>
              <p className="text-sm text-gray-600">
                Progress amount only
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalTipAmount)}
              </div>
              <p className="text-sm text-gray-600">
                Stored Minka contributions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Estimated 5% Fee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPlatformFeeAmount)}
              </div>
              <p className="text-sm text-gray-600">
                Calculated from base only
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalProcessedAmount)}
              </div>
              <p className="text-sm text-gray-600">
                Base plus stored tips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verified Campaigns
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
                % of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Completed
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
                % success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Campaign Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminCampaignApprovalsTable
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
                      placeholder="Search campaigns, organizers, or categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredCampaigns.length} of {campaigns.length}{" "}
                  campaigns
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
                    Clear Filters
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
