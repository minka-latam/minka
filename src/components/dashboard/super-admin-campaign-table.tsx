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
    type: "verify" | "unverify" | "delete";
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
    type: "verify" | "unverify" | "delete",
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

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCampaigns.length === campaigns.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Funding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
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
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2 text-xs">
                        <div>
                          <p className="text-gray-500">Base donated</p>
                          <p className="font-medium">
                            {formatCurrency(campaign.collectedAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tips</p>
                          <p className="font-medium text-blue-700">
                            {formatCurrency(campaign.tipAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Estimated 5% fee</p>
                          <p className="font-medium text-amber-700">
                            {formatCurrency(campaign.platformFeeAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Processed</p>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(campaign.totalProcessedAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{campaign.donorCount} donors</span>
                      </div>
                    </div>
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
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(campaign.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
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
                                  openConfirmDialog(
                                    "unverify",
                                    campaign.id,
                                    campaign.title
                                  )
                                }
                                className="text-amber-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Revoke Verification
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  openConfirmDialog(
                                    "verify",
                                    campaign.id,
                                    campaign.title
                                  )
                                }
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verify Campaign
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <Button variant="outline" size="sm">
              Bulk Verify
            </Button>
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
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "verify" &&
                "This will mark the campaign as verified. Users will see a verification badge."}
              {confirmAction?.type === "unverify" &&
                "This will remove the verification status from the campaign."}
              {confirmAction?.type === "delete" &&
                "This action cannot be undone. This will permanently delete the campaign."}
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
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
