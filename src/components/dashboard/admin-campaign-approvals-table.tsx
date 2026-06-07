"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Eye, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/campaign-finance";

type AdminCampaignApproval = {
  id: string;
  title: string;
  category: string;
  location: string;
  goalAmount: string;
  organizerName: string;
  organizerEmail: string;
  submittedAt: string;
  createdAt: string;
};

type AdminCampaignApprovalsTableProps = {
  onCampaignUpdate?: () => void | Promise<void>;
};

export function AdminCampaignApprovalsTable({
  onCampaignUpdate,
}: AdminCampaignApprovalsTableProps) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AdminCampaignApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/admin/campaign-approvals?status=pending",
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las campañas");
      }

      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Error loading campaign approvals:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las campañas pendientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignApproval = async (
    campaignId: string,
    action: "reviewed" | "cancel",
  ) => {
    try {
      setUpdatingId(campaignId);
      const response = await fetch("/api/admin/campaign-approvals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignId, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar la campaña");
      }

      toast({
        title:
          action === "reviewed"
            ? "Campaña marcada como revisada"
            : "Campaña cancelada",
        description: "El estado fue actualizado correctamente.",
      });

      await fetchCampaigns();
      await onCampaignUpdate?.();
    } catch (error) {
      console.error("Error updating campaign approval:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la campaña",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));

  if (!loading && campaigns.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Campañas nuevas por revisar</CardTitle>
        <p className="mt-1 text-sm text-gray-600">
          Revisa campañas publicadas recientemente y márcalas como revisadas o
          cancélalas si no corresponden.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Publicada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="max-w-[240px]">
                        <p className="truncate font-medium">{campaign.title}</p>
                        <p className="truncate text-xs text-gray-500">
                          {campaign.location.replace("_", " ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[220px]">
                        <p className="truncate font-medium">
                          {campaign.organizerName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {campaign.organizerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(campaign.goalAmount))}
                    </TableCell>
                    <TableCell className="capitalize">
                      {campaign.category.replace("_", " ")}
                    </TableCell>
                    <TableCell>{formatDate(campaign.submittedAt)}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Por revisar
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#2c6e49] hover:bg-[#f0f8f4] hover:text-[#1e4d33]"
                          asChild
                        >
                          <Link href={`/campaign/${campaign.id}`}>
                            <Eye className="h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#2c6e49] text-white hover:bg-[#1e4d33]"
                          disabled={updatingId === campaign.id}
                          onClick={() =>
                            updateCampaignApproval(campaign.id, "reviewed")
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                          Revisada
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={updatingId === campaign.id}
                          onClick={() =>
                            updateCampaignApproval(campaign.id, "cancel")
                          }
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
