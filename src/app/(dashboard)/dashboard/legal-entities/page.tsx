"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InlineSpinner } from "@/components/ui/inline-spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  useLegalEntities,
  LegalEntity,
  LegalEntityFilters,
} from "@/hooks/use-legal-entities";
import { LegalEntityForm } from "@/components/admin/legal-entity-form";

export default function LegalEntitiesPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const {
    loading,
    creating,
    updating,
    deleting,
    fetchLegalEntities,
    createLegalEntity,
    updateLegalEntity,
    deleteLegalEntity,
  } = useLegalEntities();

  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<LegalEntityFilters>({
    search: "",
    status: undefined,
    page: 1,
    limit: 10,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<LegalEntity | null>(
    null
  );

  // Check user permissions
  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (profile?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [user, profile, router]);

  // Load legal entities
  const loadLegalEntities = async () => {
    const response = await fetchLegalEntities(filters);
    if (response) {
      setLegalEntities(response.legalEntities);
      setPagination(response.pagination);
    }
  };

  useEffect(() => {
    if (profile?.role === "admin") {
      loadLegalEntities();
    }
  }, [filters, profile]);

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleActiveFilterChange = (value: string) => {
    const status =
      value === "all" ? undefined : (value as "active" | "inactive");
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // CRUD handlers
  const handleCreateSubmit = async (data: any) => {
    const success = await createLegalEntity(data);
    if (success) {
      setShowCreateModal(false);
      loadLegalEntities();
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!selectedEntity) return;

    const success = await updateLegalEntity(selectedEntity.id, data);
    if (success) {
      setShowEditModal(false);
      setSelectedEntity(null);
      loadLegalEntities();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEntity) return;

    const success = await deleteLegalEntity(selectedEntity.id);
    if (success) {
      setShowDeleteDialog(false);
      setSelectedEntity(null);
      loadLegalEntities();
    }
  };

  // Loading state
  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Personas Jurídicas
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona las organizaciones registradas en la plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Implement export functionality
              toast({
                title: "Exportar datos",
                description: "Funcionalidad de exportación en desarrollo",
              });
            }}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exportar datos
          </Button>
          <Button
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Nueva organización
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Total Organizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-sm text-gray-600">
              {legalEntities.filter((e) => e.status === "active").length} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Con Campañas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                legalEntities.filter((e) => e._count && e._count.campaigns > 0)
                  .length
              }
            </div>
            <p className="text-sm text-gray-600">
              Organizaciones con campañas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {legalEntities.filter((e) => e.status === "active").length}
            </div>
            <p className="text-sm text-gray-600">
              Activas de {pagination.total} totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email, NIT o ciudad..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={
                filters.status === undefined ? "all" : filters.status
              }
              onValueChange={handleActiveFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <p className="text-sm text-gray-600">
              Mostrando {legalEntities.length} de {pagination.total}{" "}
              organizaciones
            </p>
            {(filters.search || filters.status !== undefined) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({
                    search: "",
                    status: undefined,
                    page: 1,
                    limit: 10,
                  });
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legal Entities Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organización</TableHead>
                    <TableHead>Información Legal</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Campañas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {legalEntities.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No se encontraron organizaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    legalEntities.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entity.name}</p>
                            {entity.description && (
                              <p className="text-sm text-gray-500 max-w-[200px] truncate">
                                {entity.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {entity.taxId && (
                              <p className="text-sm">
                                <span className="font-medium">NIT:</span>{" "}
                                {entity.taxId}
                              </p>
                            )}
                            {entity.legalForm && (
                              <p className="text-sm">
                                <span className="font-medium">Forma:</span>{" "}
                                {entity.legalForm}
                              </p>
                            )}
                            {entity.registrationNumber && (
                              <p className="text-sm">
                                <span className="font-medium">Registro:</span>{" "}
                                {entity.registrationNumber}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {entity.email && (
                              <p className="text-sm">{entity.email}</p>
                            )}
                            {entity.phone && (
                              <p className="text-sm">{entity.phone}</p>
                            )}
                            {entity.website && (
                              <p className="text-sm text-blue-600 truncate max-w-[120px]">
                                {entity.website}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {entity.city && (
                              <p className="text-sm">{entity.city}</p>
                            )}
                            {entity.department && (
                              <p className="text-sm text-gray-500 capitalize">
                                {entity.department.replace("_", " ")}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-center">
                            <span className="text-lg font-semibold">
                              {entity._count?.campaigns || 0}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              entity.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {entity.status === "active"
                              ? "Activo"
                              : "Inactivo"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEntity(entity);
                                  setShowEditModal(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEntity(entity);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {entity._count?.campaigns &&
                                entity._count.campaigns > 0
                                  ? "Desactivar"
                                  : "Eliminar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Organización</DialogTitle>
            <DialogDescription>
              Registra una nueva persona jurídica en la plataforma
            </DialogDescription>
          </DialogHeader>
          <LegalEntityForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateModal(false)}
            isLoading={creating}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Organización</DialogTitle>
            <DialogDescription>
              Modifica la información de la persona jurídica
            </DialogDescription>
          </DialogHeader>
          {selectedEntity && (
            <LegalEntityForm
              initialData={selectedEntity}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedEntity(null);
              }}
              isLoading={updating}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEntity?._count?.campaigns &&
              selectedEntity._count.campaigns > 0
                ? "Desactivar"
                : "Eliminar"}{" "}
              Organización
            </DialogTitle>
            <DialogDescription>
              {selectedEntity?._count?.campaigns &&
              selectedEntity._count.campaigns > 0 ? (
                <>
                  Esta organización tiene{" "}
                  <strong>{selectedEntity._count.campaigns}</strong> campaña(s)
                  asociada(s). Se desactivará en lugar de eliminarse
                  permanentemente.
                </>
              ) : (
                "Esta acción no se puede deshacer. La organización será eliminada permanentemente."
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedEntity && (
            <div className="py-4">
              <p className="font-medium">Organización: {selectedEntity.name}</p>
              {selectedEntity.taxId && (
                <p className="text-sm text-gray-600">
                  NIT: {selectedEntity.taxId}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {selectedEntity?._count?.campaigns &&
                  selectedEntity._count.campaigns > 0
                    ? "Desactivar"
                    : "Eliminar"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
