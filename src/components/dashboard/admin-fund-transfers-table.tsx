"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Copy, Eye, Info, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatCurrency } from "@/lib/campaign-finance";

type TransferStatus = "processing" | "completed" | "cancelled";

type AdminFundTransfer = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  amount: string;
  status: TransferStatus;
  requestedByName: string;
  requestedByEmail: string;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  notes: string | null;
};

const statusLabels: Record<TransferStatus | "all", string> = {
  processing: "Pendientes",
  completed: "Completadas",
  cancelled: "Canceladas",
  all: "Todas",
};

type AdminFundTransfersTableProps = {
  hideWhenEmpty?: boolean;
};

export function AdminFundTransfersTable({
  hideWhenEmpty = false,
}: AdminFundTransfersTableProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TransferStatus | "all">("processing");
  const [transfers, setTransfers] = useState<AdminFundTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransfers(status);
  }, [status]);

  const fetchTransfers = async (nextStatus = status) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/fund-transfers?status=${nextStatus}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudieron cargar las transferencias",
        );
      }

      setTransfers(data.transfers || []);
    } catch (error) {
      console.error("Error loading fund transfers:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las transferencias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAccountNumber = async (accountNumber: string) => {
    await navigator.clipboard.writeText(accountNumber);
    toast({
      title: "Copiado",
      description: "Número de cuenta copiado al portapapeles.",
    });
  };

  const updateTransferStatus = async (
    transferId: string,
    nextStatus: "completed" | "cancelled",
  ) => {
    try {
      setUpdatingId(transferId);
      const response = await fetch("/api/admin/fund-transfers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transferId,
          status: nextStatus,
          notes:
            nextStatus === "completed"
              ? "Transferencia marcada como completada por admin"
              : "Transferencia cancelada por admin",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar la transferencia");
      }

      toast({
        title:
          nextStatus === "completed"
            ? "Transferencia completada"
            : "Transferencia cancelada",
        description: "El estado fue actualizado correctamente.",
      });
      await fetchTransfers();
    } catch (error) {
      console.error("Error updating fund transfer:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la transferencia",
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

  const maxTransferDate = (value: string) => {
    const date = new Date(value);
    date.setDate(date.getDate() + 5);
    return formatDate(date.toISOString());
  };

  const renderStatus = (transferStatus: TransferStatus) => {
    if (transferStatus === "processing") {
      return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    }
    if (transferStatus === "completed") {
      return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
    }
    if (transferStatus === "cancelled") {
      return <Badge variant="secondary">Cancelada</Badge>;
    }
    return null;
  };

  if (
    hideWhenEmpty &&
    status === "processing" &&
    !loading &&
    transfers.length === 0
  ) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">
            Solicitudes de transferencia
          </CardTitle>
          <p className="mt-1 text-sm text-gray-600">
            Revisa transferencias manuales pendientes y actualiza su estado.
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as TransferStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="processing">Pendientes</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : transfers.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No hay transferencias {statusLabels[status].toLowerCase()}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Solicitada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div className="max-w-[220px]">
                        <p className="truncate font-medium">
                          {transfer.campaignTitle}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {transfer.requestedByName} ·{" "}
                          {transfer.requestedByEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(transfer.amount))}
                    </TableCell>
                    <TableCell>{transfer.bankName}</TableCell>
                    <TableCell>{transfer.accountHolderName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {transfer.accountNumber}
                        </span>
                        <button
                          type="button"
                          className="text-[#2c6e49] hover:text-[#1e4d33]"
                          onClick={() =>
                            copyAccountNumber(transfer.accountNumber)
                          }
                          aria-label="Copiar número de cuenta"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{formatDate(transfer.requestedAt)}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Fecha máxima sugerida:{" "}
                              {maxTransferDate(transfer.requestedAt)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatus(transfer.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#2c6e49] hover:bg-[#f0f8f4] hover:text-[#1e4d33]"
                          asChild
                        >
                          <Link href={`/campaign/${transfer.campaignId}`}>
                            <Eye className="h-4 w-4" />
                            Ver
                          </Link>
                        </Button>
                        {transfer.status === "processing" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-[#2c6e49] text-white hover:bg-[#1e4d33]"
                              disabled={updatingId === transfer.id}
                              onClick={() =>
                                updateTransferStatus(transfer.id, "completed")
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                              Completar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              disabled={updatingId === transfer.id}
                              onClick={() =>
                                updateTransferStatus(transfer.id, "cancelled")
                              }
                            >
                              <XCircle className="h-4 w-4" />
                              Cancelar
                            </Button>
                          </>
                        )}
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
