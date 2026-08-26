import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminProfile } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Metadata = Record<string, Prisma.JsonValue>;
type AuditLogsSearchParams = {
  sort?: string | string[];
  adminId?: string | string[];
  action?: string | string[];
};

const actionLabels: Record<string, string> = {
  "profile.update_admin_fields": "Perfil",
  "user.role.update": "Usuario",
  "user.activate": "Usuario",
  "user.deactivate": "Usuario",
  "fund_transfer.admin_update_status": "Transferencia",
  "fund_transfer.update_status": "Transferencia",
  "campaign_review.mark_reviewed": "Campaña",
  "campaign_review.cancel": "Campaña",
  "legal_entity.create": "Persona jurídica",
  "legal_entity.update": "Persona jurídica",
  "legal_entity.deactivate": "Persona jurídica",
  "legal_entity.delete": "Persona jurídica",
  "campaign_bank_account.replace": "Cuenta bancaria",
  "campaign.cancel": "Campaña",
  "campaign.complete": "Campaña",
  "campaign.delete": "Campaña",
  update_exchange_rate: "Configuración",
  "campaign_verification.update": "Verificación",
};

const statusLabels: Record<string, string> = {
  active: "activo",
  inactive: "inactivo",
  draft: "borrador",
  pending: "pendiente",
  processing: "en proceso",
  completed: "completado",
  rejected: "rechazado",
  cancelled: "cancelado",
  approved: "aprobado",
  reviewed: "revisada",
};

function metadataObject(value: Prisma.JsonValue): Metadata {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Metadata;
}

function metadataText(metadata: Metadata, key: string) {
  const value = metadata[key];

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function metadataList(metadata: Metadata, key: string) {
  const value = metadata[key];

  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/([A-Z])/g, " $1").trim());
}

function labelStatus(value: string | null) {
  if (!value) return "sin dato";
  return statusLabels[value] ?? value;
}

function metadataDate(metadata: Metadata, key: string) {
  const value = metadataText(metadata, key);
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : format(date, "dd/MM/yyyy", { locale: es });
}

function displayName(metadata: Metadata) {
  return (
    metadataText(metadata, "name") ||
    metadataText(metadata, "campaignTitle") ||
    metadataText(metadata, "title") ||
    metadataText(metadata, "email") ||
    "registro"
  );
}

function effectiveAuditAction(action: string, metadata: Metadata) {
  if (action !== "user.role.update") return action;

  const previousRole = metadataText(metadata, "previousRole");
  const newRole = metadataText(metadata, "newRole");
  const previousStatus = metadataText(metadata, "previousStatus");
  const newStatus = metadataText(metadata, "newStatus");
  const roleChanged = previousRole !== newRole;

  if (!roleChanged && previousStatus === "inactive" && newStatus === "active") {
    return "user.activate";
  }

  if (!roleChanged && previousStatus === "active" && newStatus === "inactive") {
    return "user.deactivate";
  }

  return action;
}

function describeAuditAction(action: string, metadata: Metadata) {
  const target = displayName(metadata);
  const previousStatus = metadataText(metadata, "previousStatus");
  const newStatus = metadataText(metadata, "newStatus");
  const previousRole = metadataText(metadata, "previousRole");
  const newRole = metadataText(metadata, "newRole");
  const notes = metadataText(metadata, "notes");

  switch (action) {
    case "profile.update_admin_fields":
      return `Actualizó campos administrativos de ${target}: estado ${labelStatus(
        previousStatus,
      )} -> ${labelStatus(newStatus)}.`;

    case "user.role.update": {
      const changes = [];
      if (previousRole !== newRole) {
        changes.push(`rol ${previousRole ?? "sin dato"} -> ${newRole ?? "sin dato"}`);
      }
      if (previousStatus !== newStatus) {
        changes.push(
          `estado ${labelStatus(previousStatus)} -> ${labelStatus(newStatus)}`,
        );
      }

      return `Actualizó usuario ${target}${
        changes.length ? `: ${changes.join("; ")}.` : "."
      }`;
    }

    case "user.activate":
      return `Activó usuario ${target}.`;

    case "user.deactivate":
      return `Desactivó usuario ${target}.`;

    case "fund_transfer.admin_update_status":
    case "fund_transfer.update_status":
      return `Actualizó una solicitud de transferencia: ${labelStatus(
        previousStatus,
      )} -> ${labelStatus(newStatus)}${
        notes ? `. Nota: ${notes}` : "."
      }`;

    case "campaign_review.mark_reviewed":
      return `Marcó la campaña como revisada. Estado ${labelStatus(
        previousStatus,
      )} -> ${labelStatus(newStatus)}.`;

    case "campaign_review.cancel":
      return `Canceló la campaña desde revisión. Estado ${labelStatus(
        previousStatus,
      )} -> ${labelStatus(newStatus)}.`;

    case "legal_entity.create":
      return `Creó la persona jurídica ${target} con estado ${labelStatus(
        newStatus || metadataText(metadata, "status"),
      )}.`;

    case "legal_entity.update": {
      const fields = metadataList(metadata, "changedFields");
      return `Actualizó la persona jurídica ${target}${
        fields.length ? `: ${fields.join(", ")}.` : "."
      }`;
    }

    case "legal_entity.deactivate":
      return `Desactivó la persona jurídica ${target}.`;

    case "legal_entity.delete":
      return `Eliminó la persona jurídica ${target}.`;

    case "campaign_bank_account.replace":
      return `Actualizó la cuenta bancaria de la campaña ${target}. Banco: ${
        metadataText(metadata, "bankName") ?? "sin dato"
      }.`;

    case "campaign.cancel":
      return `Terminó la campaña “${target}” sin eliminarla. Estado: ${labelStatus(
        previousStatus,
      )} → ${labelStatus(newStatus)}.`;

    case "campaign.complete": {
      const endDate = metadataDate(metadata, "endDate");
      return `Marcó la campaña “${target}” como completada. Estado: ${labelStatus(
        previousStatus,
      )} → ${labelStatus(newStatus)}${
        endDate ? `. Fecha de finalización: ${endDate}` : ""
      }.`;
    }

    case "campaign.delete":
      return `Eliminó permanentemente la campaña ${target}. Estado anterior: ${labelStatus(
        previousStatus,
      )}.`;

    case "update_exchange_rate":
      return `Actualizó el tipo de cambio USD/BOB en modo ${
        metadataText(metadata, "mode") === "automatic" ? "automático" : "manual"
      } a ${
        metadataText(metadata, "usdToBobExchangeRate") ?? "sin dato"
      }.`;

    case "campaign_verification.update":
      return `Actualizó la verificación de campaña ${target}: ${labelStatus(
        metadataText(metadata, "previousVerificationStatus"),
      )} -> ${labelStatus(
        metadataText(metadata, "newVerificationStatus"),
      )}${notes ? `. Nota: ${notes}` : "."}`;

    default:
      return `Registró la acción “${action.replaceAll(".", " ")}” sobre ${target}.`;
  }
}

function actionLabel(action: string) {
  return actionLabels[action] ?? "Sistema";
}

function searchParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<AuditLogsSearchParams>;
}) {
  try {
    await requireAdminProfile();
  } catch {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const sort = searchParamValue(params.sort) === "asc" ? "asc" : "desc";
  const adminId = searchParamValue(params.adminId) || "";
  const action = searchParamValue(params.action) || "";

  const where: Prisma.AdminAuditLogWhereInput = {
    ...(adminId ? { adminId } : {}),
    ...(action ? { action } : {}),
  };

  const [logs, adminOptions, actionOptions] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: sort },
      take: 200,
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.profile.findMany({
      where: {
        adminAuditLogs: {
          some: {},
        },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    prisma.adminAuditLog.groupBy({
      by: ["action"],
      orderBy: {
        action: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Auditoría administrativa
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Últimos cambios realizados por administradores, ordenados del más
          reciente al más antiguo.
        </p>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Registro de actividad</CardTitle>
          <CardDescription>
            Muestra quién hizo cada cambio, cuándo ocurrió y el detalle útil de
            la acción registrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 rounded-lg border bg-gray-50 p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Fecha</span>
              <select
                name="sort"
                defaultValue={sort}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguos primero</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Admin</span>
              <select
                name="adminId"
                defaultValue={adminId}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">Todos los admins</option>
                {adminOptions.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name || admin.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Tipo</span>
              <select
                name="action"
                defaultValue={action}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="">Todos los tipos</option>
                {actionOptions.map((option) => (
                  <option key={option.action} value={option.action}>
                    {actionLabel(option.action)} - {option.action}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="h-10 rounded-full bg-[#2c6e49] px-5 text-sm font-medium text-white hover:bg-[#23583a]"
            >
              Filtrar
            </button>

            <a
              href="/dashboard/audit-logs"
              className="flex h-10 items-center justify-center rounded-full border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Limpiar
            </a>
          </form>

          {logs.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-gray-600">
              No hay registros de auditoría todavía.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Fecha y hora</TableHead>
                  <TableHead className="min-w-[180px]">Admin</TableHead>
                  <TableHead className="min-w-[150px]">Tipo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="min-w-[150px]">Entidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const metadata = metadataObject(log.metadata);
                  const action = effectiveAuditAction(log.action, metadata);

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {format(log.createdAt, "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {log.admin.name || "Admin"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{actionLabel(action)}</Badge>
                        <div className="mt-1 text-xs text-gray-500">
                          {action}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[520px] text-sm leading-6">
                        {describeAuditAction(action, metadata)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        <div>{log.entityType}</div>
                        {log.entityId && (
                          <div className="mt-1 break-all">{log.entityId}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
