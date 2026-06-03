"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  AlertCircle,
  Eye,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
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

interface SuperAdminCampaignTableProps {
  campaigns: Campaign[];
  onCampaignUpdate: () => void;
  isAdmin?: boolean;
}

export function SuperAdminCampaignTable({
  campaigns,
  onCampaignUpdate,
  isAdmin = false,
}: SuperAdminCampaignTableProps) {
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "verify" | "unverify" | "delete" | "bulk-delete";
    campaignId: string;
    campaignTitle: string;
  } | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(campaigns.map((c) => c.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns((prev) => [...prev, campaignId]);
    } else {
      setSelectedCampaigns((prev) => prev.filter((id) => id !== campaignId));
    }
  };

  const openConfirmDialog = (
    type: "verify" | "unverify" | "delete" | "bulk-delete",
    campaignId: string,
    campaignTitle: string
  ) => {
    setConfirmAction({ type, campaignId, campaignTitle });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setLoading(confirmAction.campaignId);

    try {
      if (
        confirmAction.type === "verify" ||
        confirmAction.type === "unverify"
      ) {
        const response = await fetch("/api/campaign/verification/status", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignId: confirmAction.campaignId,
            status: confirmAction.type === "verify" ? "approved" : "pending",
            notes:
              confirmAction.type === "verify"
                ? "Verified by admin"
                : "Verification revoked by admin",
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to ${confirmAction.type} campaign`);
        }

        toast({
          title:
            confirmAction.type === "verify"
              ? "Campaign Verified"
              : "Verification Revoked",
          description: `Campaign has been ${confirmAction.type === "verify" ? "verified" : "unverified"} successfully.`,
        });
      } else if (confirmAction.type === "delete") {
        const response = await fetch(
          `/api/admin/campaigns/${confirmAction.campaignId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to delete campaign");
        }

        setSelectedCampaigns((prev) =>
          prev.filter((campaignId) => campaignId !== confirmAction.campaignId)
        );

        toast({
          title: "Campaign Deleted",
          description: "Campaign has been permanently deleted.",
        });
      } else if (confirmAction.type === "bulk-delete") {
        const campaignIds = [...selectedCampaigns];
        const responses = await Promise.all(
          campaignIds.map(async (campaignId) => {
            const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              const data = await response.json().catch(() => null);
              throw new Error(data?.error || "Failed to delete campaigns");
            }
          })
        );

        setSelectedCampaigns([]);

        toast({
          title: "Campaigns Deleted",
          description: `${responses.length} campaigns have been permanently deleted.`,
        });
      }

      onCampaignUpdate();
    } catch (error) {
      console.error(`Error ${confirmAction.type}ing campaign:`, error);
      toast({
        title: "Error",
        description: `Failed to ${confirmAction.type} campaign. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      active: "default",
      completed: "success",
      cancelled: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      salud: "bg-red-100 text-red-800",
      educacion: "bg-blue-100 text-blue-800",
      emergencia: "bg-orange-100 text-orange-800",
      medioambiente: "bg-green-100 text-green-800",
      cultura_arte: "bg-purple-100 text-purple-800",
      igualdad: "bg-pink-100 text-pink-800",
      otros: "bg-gray-100 text-gray-800",
    } as const;

    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const renderCampaignActions = (campaign: Campaign) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href={`/campaign/${campaign.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Campaign
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/dashboard/campaigns/${campaign.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Campaign
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />

            {campaign.verificationStatus ? (
              <DropdownMenuItem
                onClick={() =>
                  openConfirmDialog("unverify", campaign.id, campaign.title)
                }
                className="text-amber-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Revoke Verification
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() =>
                  openConfirmDialog("verify", campaign.id, campaign.title)
                }
                className="text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Campaign
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                openConfirmDialog("delete", campaign.id, campaign.title)
              }
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Campaign
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderFundingSummary = (
    campaign: Campaign,
    variant: "table" | "card" = "table"
  ) => (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">
          {formatCurrency(campaign.collectedAmount)}
        </span>
        <span className="text-sm text-gray-500">
          / {formatCurrency(campaign.goalAmount)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{
              width: `${Math.min(campaign.percentageFunded || 0, 100)}%`,
            }}
          />
        </div>
        <span className="text-sm font-medium">
          {(campaign.percentageFunded || 0).toFixed(1)}%
        </span>
      </div>
      <div
        className={
          variant === "card"
            ? "flex flex-wrap items-center gap-x-6 gap-y-1 pt-2 text-sm"
            : "grid grid-cols-2 gap-x-6 gap-y-2 pt-3 text-sm 2xl:grid-cols-4"
        }
      >
        <div className={variant === "card" ? "flex items-baseline gap-1.5" : undefined}>
          <p className="text-gray-500">Recaudado</p>
          <p className={variant === "card" ? "font-semibold" : "text-base font-semibold"}>
            {formatCurrency(campaign.collectedAmount)}
          </p>
        </div>
        <div className={variant === "card" ? "flex items-baseline gap-1.5" : undefined}>
          <p className="text-gray-500">Tips</p>
          <p className={variant === "card" ? "font-semibold text-green-600" : "text-base font-semibold text-green-600"}>
            {formatCurrency(campaign.tipAmount)}
          </p>
        </div>
        <div className={variant === "card" ? "flex items-baseline gap-1.5" : undefined}>
          <p className="text-gray-500">5% fee</p>
          <p className={variant === "card" ? "font-semibold text-green-700" : "text-base font-semibold text-green-700"}>
            {formatCurrency(campaign.platformFeeAmount)}
          </p>
        </div>
        <div className={variant === "card" ? "flex items-baseline gap-1.5" : undefined}>
          <p className="text-gray-500">Total</p>
          <p className={variant === "card" ? "font-semibold text-gray-900" : "text-base font-semibold text-gray-900"}>
            {formatCurrency(campaign.totalProcessedAmount)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Users className="h-3 w-3" />
          <span>{campaign.donorCount} donadores</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-3 xl:hidden">
        {campaigns.length === 0 ? (
          <div className="rounded-md border py-8 text-center text-muted-foreground">
            No campaigns found.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-md border bg-white p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedCampaigns.includes(campaign.id)}
                  onCheckedChange={(checked) =>
                    handleSelectCampaign(campaign.id, checked as boolean)
                  }
                  className="mt-1"
                />
                {campaign.imageUrl && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{campaign.title}</p>
                      <p className="line-clamp-2 text-sm text-gray-500">
                        {campaign.description}
                      </p>
                    </div>
                    {renderCampaignActions(campaign)}
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Organizer</p>
                      <p className="font-medium">{campaign.organizerName}</p>
                      <p className="truncate text-gray-500">
                        {campaign.organizerEmail}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge className={getCategoryColor(campaign.category)}>
                        {campaign.category.replace("_", " ")}
                      </Badge>
                      {getStatusBadge(campaign.status)}
                      {campaign.verificationStatus ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="mr-1 h-3 w-3" />
                          Not Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>
                      {campaign.daysRemaining > 0
                        ? `${campaign.daysRemaining} days left`
                        : "Ended"}
                    </span>
                    <span>{campaign.location}</span>
                    <span>
                      {formatDistanceToNow(new Date(campaign.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>

                  <div className="mt-3">
                    {renderFundingSummary(campaign, "card")}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden rounded-md border xl:block">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[3rem]">
                <Checkbox
                  checked={selectedCampaigns.length === campaigns.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[22%]">Campaign</TableHead>
              <TableHead className="w-[16%]">Organizer</TableHead>
              <TableHead className="w-[9%]">Category</TableHead>
              <TableHead className="w-[31%]">Funding</TableHead>
              <TableHead className="w-[7%]">Status</TableHead>
              <TableHead className="w-[8%]">Verified</TableHead>
              <TableHead className="w-[6%]">Created</TableHead>
              <TableHead className="w-[3rem] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                >
                  No campaigns found.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCampaign(campaign.id, checked as boolean)
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      {campaign.imageUrl && (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden">
                          <Image
                            src={campaign.imageUrl}
                            alt={campaign.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate max-w-[200px]">
                          {campaign.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {campaign.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {campaign.daysRemaining > 0
                              ? `${campaign.daysRemaining} days left`
                              : "Ended"}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {campaign.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{campaign.organizerName}</p>
                      <p className="text-sm text-gray-500">
                        {campaign.organizerEmail}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={getCategoryColor(campaign.category)}>
                      {campaign.category.replace("_", " ")}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {renderFundingSummary(campaign)}
                  </TableCell>

                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {campaign.verificationStatus ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="mr-1 h-3 w-3" />
                          Not Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm leading-tight">
                      {formatDistanceToNow(new Date(campaign.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    {renderCampaignActions(campaign)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selection Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {selectedCampaigns.length} campaigns selected
          </span>
          <Button variant="outline" size="sm">
            Bulk Export
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm">
                Bulk Verify
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  openConfirmDialog(
                    "bulk-delete",
                    "bulk-delete",
                    `${selectedCampaigns.length} selected campaigns`
                  )
                }
              >
                Delete Selected
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCampaigns([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "verify" && "Verify Campaign"}
              {confirmAction?.type === "unverify" &&
                "Revoke Campaign Verification"}
              {confirmAction?.type === "delete" && "Delete Campaign"}
              {confirmAction?.type === "bulk-delete" &&
                "Delete Selected Campaigns"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "verify" &&
                "This will mark the campaign as verified. Users will see a verification badge."}
              {confirmAction?.type === "unverify" &&
                "This will remove the verification status from the campaign."}
              {confirmAction?.type === "delete" &&
                "This action cannot be undone. This will permanently delete the campaign. The database cascade rules will remove only the configured related records."}
              {confirmAction?.type === "bulk-delete" &&
                "This action cannot be undone. This will permanently delete the selected campaigns. The database cascade rules will remove only the configured related records."}
            </DialogDescription>
          </DialogHeader>

          {confirmAction && (
            <div className="py-4">
              <p className="text-sm text-gray-500">
                Campaign: {confirmAction.campaignTitle}
              </p>

              {confirmAction.type === "unverify" && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 className="text-sm font-bold text-amber-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Admin Action Required
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Revoking verification should be done carefully as donors may
                    have trusted the verification badge when making donations.
                  </p>
                </div>
              )}

              {(confirmAction.type === "delete" ||
                confirmAction.type === "bulk-delete") && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-bold text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Permanent delete
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    This deletes the campaign row directly. Related rows are
                    handled only by the database cascade rules.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading !== null}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmAction?.type === "delete" ? "destructive" : "default"
              }
              onClick={handleConfirmAction}
              disabled={loading !== null}
            >
              {loading !== null ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  {confirmAction?.type === "verify" && "Verify Campaign"}
                  {confirmAction?.type === "unverify" && "Revoke Verification"}
                  {confirmAction?.type === "delete" && "Delete Campaign"}
                  {confirmAction?.type === "bulk-delete" &&
                    "Delete Selected Campaigns"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
