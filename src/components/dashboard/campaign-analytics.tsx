"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Target,
  PieChart,
} from "lucide-react";
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
  verificationDate?: string;
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

interface CampaignAnalyticsProps {
  campaigns: Campaign[];
}

export function CampaignAnalytics({ campaigns }: CampaignAnalyticsProps) {
  // Calculate category breakdown
  const categoryStats = campaigns.reduce(
    (acc, campaign) => {
      acc[campaign.category] = (acc[campaign.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate success metrics
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");
  const successRate =
    campaigns.length > 0
      ? (completedCampaigns.length / campaigns.length) * 100
      : 0;

  // Calculate funding metrics
  const totalGoal = campaigns.reduce((sum, c) => sum + c.goalAmount, 0);
  const totalRaised = campaigns.reduce((sum, c) => sum + c.collectedAmount, 0);
  const totalTips = campaigns.reduce((sum, c) => sum + (c.tipAmount || 0), 0);
  const totalPlatformFees = campaigns.reduce(
    (sum, c) => sum + (c.platformFeeAmount || 0),
    0
  );
  const totalProcessed = campaigns.reduce(
    (sum, c) => sum + (c.totalProcessedAmount || 0),
    0
  );
  const overallFundingRate =
    totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;

  // Top performing campaigns
  const topCampaigns = [...campaigns]
    .filter((c) => c.percentageFunded > 0)
    .sort((a, b) => b.percentageFunded - a.percentageFunded)
    .slice(0, 5);

  // Monthly campaign creation trends (simplified)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonth = campaigns.filter((c) => {
    const createdDate = new Date(c.createdAt);
    return (
      createdDate.getMonth() === currentMonth &&
      createdDate.getFullYear() === currentYear
    );
  }).length;

  const lastMonth = campaigns.filter((c) => {
    const createdDate = new Date(c.createdAt);
    const lastMonthDate = new Date(currentYear, currentMonth - 1);
    return (
      createdDate.getMonth() === lastMonthDate.getMonth() &&
      createdDate.getFullYear() === lastMonthDate.getFullYear()
    );
  }).length;

  const categoryColors: Record<string, string> = {
    salud: "bg-red-100 text-red-800",
    educacion: "bg-blue-100 text-blue-800",
    emergencia: "bg-orange-100 text-orange-800",
    medioambiente: "bg-green-100 text-green-800",
    cultura_arte: "bg-purple-100 text-purple-800",
    igualdad: "bg-pink-100 text-pink-800",
    otros: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-600">
              {completedCampaigns.length} of {campaigns.length} campaigns
              completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Funding Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallFundingRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              {formatCurrency(totalRaised)} raised of {formatCurrency(totalGoal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonth}</div>
            <p className="text-sm flex items-center gap-1">
              {thisMonth > lastMonth ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    +{thisMonth - lastMonth} from last month
                  </span>
                </>
              ) : thisMonth < lastMonth ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {lastMonth - thisMonth} less than last month
                  </span>
                </>
              ) : (
                <span className="text-gray-600">Same as last month</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Avg Donors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0
                ? Math.round(
                    campaigns.reduce((sum, c) => sum + c.donorCount, 0) /
                      campaigns.length
                  )
                : 0}
            </div>
            <p className="text-sm text-gray-600">
              {campaigns.reduce((sum, c) => sum + c.donorCount, 0)} total donors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Campaign Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryStats)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => {
                  const percentage = ((count / campaigns.length) * 100).toFixed(
                    1
                  );
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            categoryColors[category] || categoryColors.otros
                          }
                        >
                          {category.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {count} campaigns
                        </span>
                      </div>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Performing Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCampaigns.length > 0 ? (
                topCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{campaign.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(campaign.collectedAmount)} raised
                      </p>
                      <p className="text-xs text-gray-500">
                        Tips {formatCurrency(campaign.tipAmount)} | 5% fee{" "}
                        {formatCurrency(campaign.platformFeeAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {(campaign.percentageFunded || 0).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.donorCount} donors
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No campaigns with donations yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Verified</span>
                <span className="font-medium text-green-600">
                  {campaigns.filter((c) => c.verificationStatus).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unverified</span>
                <span className="font-medium text-gray-600">
                  {campaigns.filter((c) => !c.verificationStatus).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active</span>
                <span className="font-medium text-blue-600">
                  {campaigns.filter((c) => c.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Draft</span>
                <span className="font-medium text-gray-600">
                  {campaigns.filter((c) => c.status === "draft").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completed</span>
                <span className="font-medium text-green-600">
                  {campaigns.filter((c) => c.status === "completed").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cancelled</span>
                <span className="font-medium text-red-600">
                  {campaigns.filter((c) => c.status === "cancelled").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funding Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Avg Goal</span>
                <span className="font-medium">
                  {formatCurrency(
                    campaigns.length > 0
                      ? Math.round(totalGoal / campaigns.length)
                      : 0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Raised</span>
                <span className="font-medium">
                  {formatCurrency(
                    campaigns.length > 0
                      ? Math.round(totalRaised / campaigns.length)
                      : 0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fully Funded</span>
                <span className="font-medium text-green-600">
                  {campaigns.filter((c) => c.percentageFunded >= 100).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between gap-3">
                <span>Base donations</span>
                <span className="font-medium">
                  {formatCurrency(totalRaised)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Tips</span>
                <span className="font-medium text-blue-700">
                  {formatCurrency(totalTips)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Estimated 5% fee</span>
                <span className="font-medium text-amber-700">
                  {formatCurrency(totalPlatformFees)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t pt-2">
                <span>Total processed</span>
                <span className="font-medium">
                  {formatCurrency(totalProcessed)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
