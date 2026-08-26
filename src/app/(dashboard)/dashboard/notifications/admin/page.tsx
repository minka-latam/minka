"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, Bell, Users, Info, Check, Send } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

interface SystemNotificationLog {
  id: string;
  title: string;
  content: string;
  target: "all" | "donors" | "organizers" | "admins";
  recipientCount: number;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

interface NotificationStats {
  totalUsers: number;
  totalDonors: number;
  totalOrganizers: number;
  totalAdmins: number;
  usersWithNewsUpdates: number;
  usersWithCampaignUpdates: number;
  usersWithoutPreferences: number;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<
    SystemNotificationLog[]
  >([]);

  // State for new notification form
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationContent, setNotificationContent] = useState("");
  const [notificationTarget, setNotificationTarget] = useState<
    "all" | "donors" | "organizers" | "admins"
  >("all");

  // State for confirmation dialog
  const [showDialog, setShowDialog] = useState(false);

  // Stats
  const [stats, setStats] = useState<NotificationStats>({
    totalUsers: 0,
    totalDonors: 0,
    totalOrganizers: 0,
    totalAdmins: 0,
    usersWithNewsUpdates: 0,
    usersWithCampaignUpdates: 0,
    usersWithoutPreferences: 0,
  });

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        setLoading(true);

        // Check if user is admin via API endpoint
        const statsResponse = await fetch("/api/admin/notifications/stats", {
          credentials: "include",
        });

        if (statsResponse.status === 403) {
          router.push("/dashboard/notifications");
          return;
        }

        if (!statsResponse.ok) {
          throw new Error("Failed to fetch notification stats");
        }

        const statsData = await statsResponse.json();
        setStats(statsData);
        setIsAdmin(true);

        // Load notification history
        const historyResponse = await fetch(
          "/api/admin/notifications/history",
          {
            credentials: "include",
          }
        );

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setSentNotifications(historyData.notifications);
        }
      } catch (error) {
        console.error("Error loading admin notifications data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Intente nuevamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadData();
  }, [user, router, toast]);

  // Handle sending notification
  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationContent.trim()) {
      toast({
        title: "Campos incompletos",
        description:
          "Por favor complete el título y contenido de la notificación.",
        variant: "destructive",
      });
      return;
    }

    setShowDialog(true);
  };

  // Confirm and send notification
  const confirmSendNotification = async () => {
    setIsSending(true);

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: notificationTitle,
          content: notificationContent,
          target: notificationTarget,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send notification");
      }

      const result = await response.json();

      // Show success message
      toast({
        title: "Notificación enviada",
        description: `La notificación ha sido enviada a ${result.recipientCount} usuarios.`,
      });

      // Reset form
      setNotificationTitle("");
      setNotificationContent("");
      setNotificationTarget("all");

      // Refresh notification history
      const historyResponse = await fetch("/api/admin/notifications/history", {
        credentials: "include",
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setSentNotifications(historyData.notifications);
      }

      // Close dialog
      setShowDialog(false);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: `No se pudo enviar la notificación: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case "all":
        return "Todos los usuarios";
      case "donors":
        return "Solo donadores";
      case "organizers":
        return "Solo organizadores";
      case "admins":
        return "Solo administradores";
      default:
        return target;
    }
  };

  const getEstimatedRecipients = () => {
    switch (notificationTarget) {
      case "all":
        return stats.usersWithNewsUpdates;
      case "donors":
        return stats.totalDonors;
      case "organizers":
        return stats.totalOrganizers;
      case "admins":
        return stats.totalAdmins;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div>Redirigiendo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Notificaciones del Sistema
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Send className="h-4 w-4" />
          Panel de Administrador
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-600 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Total de usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-600 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Suscriptores de novedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.usersWithNewsUpdates}
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats.usersWithNewsUpdates / stats.totalUsers) * 100).toFixed(
                1
              )}
              % de usuarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-600 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Donadores activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDonors}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.totalDonors / stats.totalUsers) * 100).toFixed(1)}% de
              usuarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-purple-600 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Organizadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.totalOrganizers / stats.totalUsers) * 100).toFixed(1)}%
              de usuarios
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="send">Enviar Notificación</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Notificación del Sistema</CardTitle>
              <p className="text-sm text-gray-600">
                Envía notificaciones importantes a todos los usuarios de la
                plataforma
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Ingrese el título de la notificación"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  {notificationTitle.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contenido</label>
                <Textarea
                  placeholder="Escriba el contenido de la notificación"
                  className="min-h-[120px]"
                  value={notificationContent}
                  onChange={(e) => setNotificationContent(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {notificationContent.length}/500 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Destinatarios</label>
                <Select
                  value={notificationTarget}
                  onValueChange={(
                    value: "all" | "donors" | "organizers" | "admins"
                  ) => setNotificationTarget(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione los destinatarios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    <SelectItem value="donors">Solo donadores</SelectItem>
                    <SelectItem value="organizers">
                      Solo organizadores
                    </SelectItem>
                    <SelectItem value="admins">Solo administradores</SelectItem>
                  </SelectContent>
                </Select>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center">
                    <Info className="inline-block mr-2 h-4 w-4" />
                    <strong>
                      Destinatarios estimados: {getEstimatedRecipients()}
                    </strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Solo se enviará a usuarios que han activado las
                    notificaciones de novedades
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSendNotification}
                  className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
                  disabled={
                    !notificationTitle.trim() || !notificationContent.trim()
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Notificación
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Notificaciones Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              {sentNotifications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Destinatarios</TableHead>
                      <TableHead>Enviados</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {notification.content}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getTargetLabel(notification.target)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {notification.recipientCount}
                        </TableCell>
                        <TableCell>
                          {format(new Date(notification.createdAt), "PPp", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {notification.admin.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No se han enviado notificaciones del sistema aún.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envío de notificación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea enviar esta notificación a{" "}
              <strong>{getEstimatedRecipients()} usuarios</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <strong>Título:</strong> {notificationTitle}
            </div>
            <div>
              <strong>Contenido:</strong> {notificationContent}
            </div>
            <div>
              <strong>Destinatarios:</strong>{" "}
              {getTargetLabel(notificationTarget)}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmSendNotification}
              disabled={isSending}
              className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
            >
              {isSending ? (
                <>
                  <LoadingSpinner size="sm" tone="inverse" className="mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar envío
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
