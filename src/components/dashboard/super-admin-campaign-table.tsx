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
  Pencil,
  AlertCircle,
  Eye,
  Trash2,
  Clock,
  Ban,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { formatCurrency } from "@/lib/campaign-finance";
import { AdminUserProfileLink } from "@/components/dashboard/admin-user-profile-link";

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
    type: "verify" | "unverify" | "cancel" | "delete" | "bulk-delete";
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
    type: "verify" | "unverify" | "cancel" | "delete" | "bulk-delete",
    campaignId: string,
    campaignTitle: string,
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
                ? "Verificada por un administrador"
                : "Verificación revocada por un administrador",
          }),
        });

        if (!response.ok) {
          throw new Error("No se pudo actualizar la verificación");
        }

        toast({
          title:
            confirmAction.type === "verify"
              ? "Campaña verificada"
              : "Verificación revocada",
          description: "El estado de verificación se actualizó correctamente.",
        });
      } else if (confirmAction.type === "cancel") {
        const response = await fetch(
          `/api/admin/campaigns/${confirmAction.campaignId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel" }),
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "No se pudo terminar la campaña");
        }

        toast({
          title: "Campaña terminada",
          description: "La campaña fue cancelada y su historial se conserva.",
        });
      } else if (confirmAction.type === "delete") {
        const response = await fetch(
          `/api/admin/campaigns/${confirmAction.campaignId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "No se pudo eliminar la campaña");
        }

        setSelectedCampaigns((prev) =>
          prev.filter((campaignId) => campaignId !== confirmAction.campaignId),
        );

        toast({
          title: "Campaña eliminada",
          description: "La campaña se eliminó permanentemente.",
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
              throw new Error(
                data?.error || "No se pudieron eliminar las campañas",
              );
            }
          }),
        );

        setSelectedCampaigns([]);

        toast({
          title: "Campañas eliminadas",
          description: `${responses.length} campañas se eliminaron permanentemente.`,
        });
      }

      onCampaignUpdate();
    } catch (error) {
      console.error(`Error ${confirmAction.type}ing campaign:`, error);
      toast({
        title: "Error",
        description: "No se pudo completar la acción. Intenta nuevamente.",
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
    const labels = {
      draft: "Borrador",
      active: "Activa",
      completed: "Completada",
      cancelled: "Cancelada",
    } as const;

    return (
      <Badge
        variant={variants[status as keyof typeof variants] || "secondary"}
        className="pointer-events-none"
      >
        {labels[status as keyof typeof labels] || status}
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

  const getCategoryLabel = (category: string) => {
    const labels = {
      salud: "Salud",
      educacion: "Educación",
      emergencia: "Emergencia",
      medioambiente: "Medio ambiente",
      cultura_arte: "Cultura y arte",
      igualdad: "Igualdad",
      otros: "Otros",
    } as const;

    return (
      labels[category as keyof typeof labels] || category.replace("_", " ")
    );
  };

  const renderVerificationBadge = (campaign: Campaign) => {
    if (campaign.verificationStatus) {
      return (
        <Badge className="pointer-events-none bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Verificada
        </Badge>
      );
    }

    if (campaign.verificationRequestStatus === "pending") {
      return (
        <Badge className="pointer-events-none bg-yellow-100 text-yellow-800">
          <Clock className="mr-1 h-3 w-3" />
          Pendiente
        </Badge>
      );
    }

    if (campaign.verificationRequestStatus === "rejected") {
      return (
        <Badge className="pointer-events-none bg-red-100 text-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Rechazada
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="pointer-events-none">
        <XCircle className="mr-1 h-3 w-3" />
        No verificada
      </Badge>
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
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href={`/campaign/${campaign.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver campaña
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/dashboard/campaigns/${campaign.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar campaña
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />

            {campaign.verificationStatus ? (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/verification">
                  <XCircle className="mr-2 h-4 w-4" />
                  Revocar verificación
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/verification">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verificar campaña
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {(campaign.status === "draft" || campaign.status === "active") && (
              <DropdownMenuItem
                onClick={() =>
                  openConfirmDialog("cancel", campaign.id, campaign.title)
                }
                className="text-amber-700 focus:text-amber-700"
              >
                <Ban className="mr-2 h-4 w-4" />
                Terminar campaña
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() =>
                openConfirmDialog("delete", campaign.id, campaign.title)
              }
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar permanentemente
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderFundingSummary = (campaign: Campaign) => (
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
    </div>
  );

  return (
    <>
      <div className="space-y-3 xl:hidden">
        {campaigns.length === 0 ? (
          <div className="rounded-md border py-8 text-center text-muted-foreground">
            No se encontraron campañas.
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
                      <p className="text-xs text-gray-500">Organizador</p>
                      {isAdmin ? (
                        <AdminUserProfileLink
                          userId={campaign.organizerId}
                          className="font-medium text-[#2c6e49] hover:underline"
                        >
                          {campaign.organizerName}
                        </AdminUserProfileLink>
                      ) : (
                        <p className="font-medium">{campaign.organizerName}</p>
                      )}
                      <p className="truncate text-gray-500">
                        {campaign.organizerEmail}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge
                        className={`${getCategoryColor(campaign.category)} pointer-events-none`}
                      >
                        {getCategoryLabel(campaign.category)}
                      </Badge>
                      {getStatusBadge(campaign.status)}
                      {renderVerificationBadge(campaign)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>
                      {campaign.daysRemaining > 0
                        ? `${campaign.daysRemaining} días restantes`
                        : "Finalizada"}
                    </span>
                    <span>{campaign.location}</span>
                    <span>
                      {formatDistanceToNow(new Date(campaign.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>

                  <div className="mt-3">{renderFundingSummary(campaign)}</div>
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
              <TableHead className="w-[22%]">Campaña</TableHead>
              <TableHead className="w-[16%]">Organizador</TableHead>
              <TableHead className="w-[9%]">Categoría</TableHead>
              <TableHead className="w-[22%]">Recaudación</TableHead>
              <TableHead className="w-[7%]">Estado</TableHead>
              <TableHead className="w-[8%]">Verificación</TableHead>
              <TableHead className="w-[6%]">Creada</TableHead>
              <TableHead className="w-[3rem] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                >
                  No se encontraron campañas.
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
                              ? `${campaign.daysRemaining} días restantes`
                              : "Finalizada"}
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
                      {isAdmin ? (
                        <AdminUserProfileLink
                          userId={campaign.organizerId}
                          className="font-medium text-[#2c6e49] hover:underline"
                        >
                          {campaign.organizerName}
                        </AdminUserProfileLink>
                      ) : (
                        <p className="font-medium">{campaign.organizerName}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {campaign.organizerEmail}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`${getCategoryColor(campaign.category)} pointer-events-none`}
                    >
                      {getCategoryLabel(campaign.category)}
                    </Badge>
                  </TableCell>

                  <TableCell>{renderFundingSummary(campaign)}</TableCell>

                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {renderVerificationBadge(campaign)}
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
            {selectedCampaigns.length} campañas seleccionadas
          </span>
          <Button variant="outline" size="sm">
            Exportar selección
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm">
                Verificar selección
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  openConfirmDialog(
                    "bulk-delete",
                    "bulk-delete",
                    `${selectedCampaigns.length} campañas seleccionadas`,
                  )
                }
              >
                Eliminar seleccionadas
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCampaigns([])}
          >
            Limpiar selección
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "verify" && "Verificar campaña"}
              {confirmAction?.type === "unverify" &&
                "Revocar verificación de la campaña"}
              {confirmAction?.type === "cancel" && "Terminar campaña"}
              {confirmAction?.type === "delete" &&
                "Eliminar campaña permanentemente"}
              {confirmAction?.type === "bulk-delete" &&
                "Eliminar campañas seleccionadas"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "verify" &&
                "La campaña quedará marcada como verificada y los usuarios verán la insignia correspondiente."}
              {confirmAction?.type === "unverify" &&
                "Se quitará el estado de verificación de la campaña."}
              {confirmAction?.type === "cancel" &&
                "La campaña dejará de estar activa, pero se conservarán sus donaciones, transferencias y demás historial."}
              {confirmAction?.type === "delete" &&
                "Esta acción no se puede deshacer. La campaña se eliminará permanentemente y las reglas de cascada de la base de datos eliminarán únicamente los registros relacionados configurados."}
              {confirmAction?.type === "bulk-delete" &&
                "Esta acción no se puede deshacer. Las campañas seleccionadas se eliminarán permanentemente y las reglas de cascada de la base de datos eliminarán únicamente los registros relacionados configurados."}
            </DialogDescription>
          </DialogHeader>

          {confirmAction && (
            <div className="py-4">
              <p className="text-sm text-gray-500">
                Campaña: {confirmAction.campaignTitle}
              </p>

              {confirmAction.type === "unverify" && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 className="text-sm font-bold text-amber-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Acción administrativa delicada
                  </h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Revoca la verificación con cuidado: algunos donantes pueden
                    haber confiado en esa insignia al realizar sus donaciones.
                  </p>
                </div>
              )}

              {confirmAction.type === "cancel" && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <h4 className="flex items-center text-sm font-bold text-amber-700">
                    <Ban className="mr-2 h-4 w-4" />
                    Terminación sin borrado
                  </h4>
                  <p className="mt-1 text-sm text-amber-800">
                    Esta acción cambia el estado a cancelada y conserva toda la
                    información de la campaña.
                  </p>
                </div>
              )}

              {(confirmAction.type === "delete" ||
                confirmAction.type === "bulk-delete") && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-bold text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Eliminación permanente
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    Esto elimina directamente el registro de la campaña. Los
                    registros relacionados dependen exclusivamente de las reglas
                    de cascada de la base de datos.
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
              Cancelar
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
                  <LoadingSpinner className="mr-2" size="sm" tone="inverse" />
                  Procesando...
                </>
              ) : (
                <>
                  {confirmAction?.type === "verify" && "Verificar campaña"}
                  {confirmAction?.type === "unverify" && "Revocar verificación"}
                  {confirmAction?.type === "cancel" && "Terminar campaña"}
                  {confirmAction?.type === "delete" &&
                    "Eliminar permanentemente"}
                  {confirmAction?.type === "bulk-delete" &&
                    "Eliminar campañas seleccionadas"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
