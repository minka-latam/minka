"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Eye } from "lucide-react";

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
import { AdminUserProfileLink } from "@/components/dashboard/admin-user-profile-link";

type EndedCampaign = {
  id: string;
  title: string;
  endDate: string;
  goalAmount: string;
  collectedAmount: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
};

export function AdminEndedCampaignsTable({
  onCampaignUpdate,
}: {
  onCampaignUpdate?: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<EndedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/campaign-completions");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las campañas");
      }
      setCampaigns(data.campaigns || []);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las campañas finalizadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const completeCampaign = async (campaignId: string) => {
    try {
      setUpdatingId(campaignId);
      const response = await fetch("/api/admin/campaign-completions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, action: "complete" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo completar la campaña");
      }

      toast({
        title: "Campaña completada",
        description:
          "La campaña salió de la cola y conserva todo su historial.",
      });
      await fetchCampaigns();
      await onCampaignUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo completar la campaña",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!loading && campaigns.length === 0) return null;

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Campañas que llegaron a su fin
        </CardTitle>
        <p className="mt-1 text-sm text-gray-600">
          Confirma las campañas cuya fecha final ya pasó para marcarlas como
          completadas.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Recaudado</TableHead>
                  <TableHead>Fecha final</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="max-w-[260px] truncate font-medium">
                      {campaign.title}
                    </TableCell>
                    <TableCell>
                      <AdminUserProfileLink
                        userId={campaign.organizerId}
                        className="font-medium text-[#2c6e49] hover:underline"
                      >
                        {campaign.organizerName}
                      </AdminUserProfileLink>
                      <p className="text-xs text-gray-500">
                        {campaign.organizerEmail}
                      </p>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(campaign.collectedAmount))}
                      <p className="text-xs text-gray-500">
                        de {formatCurrency(Number(campaign.goalAmount))}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(campaign.endDate)}</TableCell>
                    <TableCell>
                      <Badge className="pointer-events-none bg-amber-100 text-amber-800">
                        Fecha cumplida
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/campaign/${campaign.id}`}>
                            <Eye className="h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#2c6e49] text-white hover:bg-[#1e4d33]"
                          disabled={updatingId === campaign.id}
                          onClick={() => completeCampaign(campaign.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Marcar completada
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
