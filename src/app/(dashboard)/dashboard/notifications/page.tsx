"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, CheckCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/providers/auth-provider";
import { useDb, Notification } from "@/hooks/use-db";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();
  const { user } = useAuth();
  const {
    getNotifications,
    markNotificationsAsRead,
  } = useDb();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch real notifications
        const notificationData = await getNotifications(50, 0, false);

        if (notificationData.error) {
          console.error(
            "Error fetching notifications:",
            notificationData.error
          );
          toast({
            title: "Error",
            description: "No se pudieron cargar las notificaciones.",
            variant: "destructive",
          });
        } else {
          setNotifications(notificationData.notifications);
          setUnreadCount(notificationData.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, router, getNotifications, toast]);

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAsRead(true);

      const { error } = await markNotificationsAsRead(undefined, true);

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      toast({
        title: "Notificaciones marcadas",
        description: "Todas las notificaciones se han marcado como leídas.",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones como leídas.",
        variant: "destructive",
      });
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await markNotificationsAsRead([notification.id]);

        // Update local state
        setNotifications(
          notifications.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to related campaign if available
    if (notification.campaignId) {
      router.push(`/campaign/${notification.campaignId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "donation_received":
        return "💰";
      case "comment_received":
        return "💬";
      case "campaign_update":
        return "📢";
      default:
        return "🔔";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <LoadingSpinner
          size="md"
          text="Cargando notificaciones..."
          showText={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Notificaciones</h1>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markingAsRead}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAsRead ? "Marcando..." : "Marcar todas como leídas"}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Historial de notificaciones
          </h2>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Bell className="h-4 w-4" />
              {unreadCount} sin leer
            </div>
          )}
        </div>

        {notifications && notifications.length > 0 ? (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`border-l-4 ${
                    notification.isRead ? "border-gray-300" : "border-[#2c6e49]"
                  } pl-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-[#2c6e49] rounded-full"></div>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.campaign && (
                        <p className="text-sm text-[#2c6e49] mt-1 font-medium">
                          Campaña: {notification.campaign.title}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg py-12 px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
              <Info className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-gray-800 text-lg text-center">
              No tienes notificaciones en este momento
            </p>
            <p className="text-gray-600 text-sm text-center mt-2">
              Cuando alguien done o comente en tus campañas, recibirás
              notificaciones aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
