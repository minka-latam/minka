"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatus } from "./campaign-card"; // Reusing status type
import { ProfileData } from "@/types"; // Assuming ProfileData is in types
import { toast } from "@/components/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // For refreshing data
import {
  CheckCircle,
  Pencil,
  ExternalLink,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Reusing FormattedCampaign definition structure from the page
interface FormattedCampaign {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  location: string;
  raisedAmount: number;
  goalAmount: number;
  progress: number;
  status: CampaignStatus;
  description: string;
  isVerified: boolean;
  organizerName?: string;
  organizerEmail?: string;
}

interface AdminCampaignTableProps {
  campaigns: FormattedCampaign[];
}

export function AdminCampaignTable({ campaigns }: AdminCampaignTableProps) {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [unverifyingId, setUnverifyingId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<FormattedCampaign | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Check if the user is a super admin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setIsSuperAdmin(profile?.role === "admin");
      }
    };

    checkSuperAdmin();
  }, [supabase]);

  const handleVerifyCampaign = async (campaignId: string) => {
    setVerifyingId(campaignId);
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ verification_status: true })
        .eq("id", campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Verified",
        description: "The campaign has been successfully verified.",
      });
      // Refresh the page data to show updated status
      router.refresh();
    } catch (error: any) {
      console.error("Error verifying campaign:", error);
      toast({
        title: "Verification Failed",
        description:
          error.message || "Could not verify the campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const openUnverifyDialog = (campaign: FormattedCampaign) => {
    setSelectedCampaign(campaign);
    setShowConfirmDialog(true);
  };

  const handleUnverifyCampaign = async () => {
    if (!selectedCampaign) return;

    setProcessingAction(true);
    setUnverifyingId(selectedCampaign.id);

    try {
      // Update campaign verification status
      const { error } = await supabase
        .from("campaigns")
        .update({ verification_status: false })
        .eq("id", selectedCampaign.id);

      if (error) throw error;

      toast({
        title: "Verificación Revocada",
        description:
          "La verificación de la campaña ha sido revocada exitosamente.",
      });

      // Refresh the page data to show updated status
      router.refresh();
    } catch (error: any) {
      console.error("Error unverifying campaign:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "No se pudo revocar la verificación. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setUnverifyingId(null);
      setShowConfirmDialog(false);
      setSelectedCampaign(null);
      setProcessingAction(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Organizer</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Verified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No campaigns found.
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.title}</TableCell>
                <TableCell>
                  {campaign.organizerName || "N/A"} (
                  {campaign.organizerEmail || "N/A"})
                </TableCell>
                <TableCell>{campaign.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      campaign.status === "active" ? "default" : "secondary"
                    }
                  >
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {campaign.isVerified ? (
                    <Badge variant="success">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {campaign.isVerified && isSuperAdmin ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUnverifyDialog(campaign)}
                      disabled={unverifyingId === campaign.id}
                      className="border-amber-200 text-amber-600 hover:bg-amber-50"
                    >
                      {unverifyingId === campaign.id ? (
                        "Revocando..."
                      ) : (
                        <>
                          <XCircle className="mr-1 h-4 w-4" /> Revocar
                        </>
                      )}
                    </Button>
                  ) : (
                    !campaign.isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyCampaign(campaign.id)}
                        disabled={verifyingId === campaign.id}
                      >
                        {verifyingId === campaign.id ? (
                          "Verifying..."
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-4 w-4" /> Verify
                          </>
                        )}
                      </Button>
                    )
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/campaigns/${campaign.id}`}>
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    {/* Assuming a public campaign page exists at /campaign/:id */}
                    <Link href={`/campaign/${campaign.id}`}>
                      <ExternalLink className="mr-1 h-4 w-4" /> View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Confirmation Dialog for Unverifying */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Revocar verificación de la campaña?</DialogTitle>
            <DialogDescription>
              Esta acción revocará la verificación de la campaña. La campaña
              dejará de tener un distintivo de verificación.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedCampaign && (
              <>
                <p className="text-sm text-gray-500">
                  Campaña: {selectedCampaign.title}
                </p>
                {selectedCampaign.organizerName && (
                  <p className="text-sm text-gray-500">
                    Organizador: {selectedCampaign.organizerName}
                  </p>
                )}
              </>
            )}

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h4 className="text-sm font-bold text-amber-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Acción de Super Administrador
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Revocar la verificación de una campaña es una acción importante
                que debería usarse con precaución. Los donantes pueden haber
                confiado en el distintivo de verificación para realizar
                donaciones.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={processingAction}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleUnverifyCampaign}
              disabled={processingAction}
              className="border-amber-200 text-amber-600 hover:bg-amber-50"
            >
              {processingAction ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Procesando...
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-4 w-4" />
                  Revocar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Add custom variant for success badge if not already defined globally
// You might need to add this to your Badge component's variants
// Example:
// success: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",

