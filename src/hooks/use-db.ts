import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Types
export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  role: string;
  created_at: string;
  identity_number?: string;
  birth_date?: string;
  profile_picture?: string | null;
  [key: string]: string | boolean | number | null | undefined;
}

export interface SessionUser {
  id: string;
  email: string;
}

export interface Session {
  user: SessionUser;
}

export interface CampaignMedia {
  mediaUrl: string;
  isPrimary: boolean;
  type: string;
  orderIndex: number;
}

export interface CampaignWithMedia {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  collectedAmount: number;
  goalAmount: number;
  campaignStatus: string;
  createdAt: string;
  verificationStatus: boolean;
  organizerId: string;
  media: CampaignMedia[];
}

export interface OrganizerData {
  id: string;
  name: string | null;
  email: string | null;
}

export interface DonationSummary {
  totalDonations: number;
}

export interface NotificationPreferences {
  newsUpdates: boolean;
  campaignUpdates: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  campaignId?: string;
  donationId?: string;
  commentId?: string;
  createdAt: string;
  campaign?: {
    id: string;
    title: string;
  };
  donation?: {
    id: string;
    amount: number;
  };
  comment?: {
    id: string;
    message: string;
  };
}

// Simple request cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds in milliseconds

// Tracking in-flight requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

// Enhanced cache helpers
const getCachedData = (key: string) => {
  const cachedItem = cache.get(key);
  if (!cachedItem) return null;

  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return cachedItem.data;
};

const setCacheData = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Helper to prevent duplicate in-flight requests
async function debouncedRequest<T>(
  cacheKey: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Check if this request is already in flight
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>;
  }

  // Create and store the request promise
  try {
    const requestPromise = requestFn();
    pendingRequests.set(cacheKey, requestPromise);

    // Execute the request
    const data = await requestPromise;

    // Cache the result
    setCacheData(cacheKey, data);

    return data;
  } catch (error) {
    console.error(`Error in debouncedRequest for ${cacheKey}:`, error);
    throw error;
  } finally {
    // Clear the pending request indicator
    pendingRequests.delete(cacheKey);
  }
}

export function useDb() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Auth functions - use the browser session
  const getSession = useCallback(async (): Promise<{
    data: { session: Session | null };
  }> => {
    const cacheKey = "session";

    try {
      return await debouncedRequest(cacheKey, async () => {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to get session");
        }

        const data = await response.json();
        return { data: { session: data.session } };
      });
    } catch (error) {
      console.error("Error getting session:", error);
      return { data: { session: null } };
    }
  }, []);

  // Profile operations
  const getProfile = useCallback(
    async (
      userId: string,
      includeRelated = false
    ): Promise<ProfileData | null> => {
      const cacheKey = `profile:${userId}:${includeRelated ? "full" : "basic"}`;

      setLoading(true);
      try {
        return await debouncedRequest(cacheKey, async () => {

          // Create AbortController for timeout handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

          const url = `/api/profile/${userId}${includeRelated ? "?include_related=true" : ""}`;

          const response = await fetch(url, {
            signal: controller.signal,
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
  if (response.status === 404) {
    console.log(`Profile not found for user ${userId}`);
    return null;
  }
  const errorData = await response
    .json()
    .catch(() => ({ error: "Network error" }));
  throw new Error(errorData.error || "Failed to fetch profile");
}

          const data = await response.json();
          if (!data.profile) {
            throw new Error("No profile data received");
          }

          return data.profile;
        });
      } catch (error) {
        console.error("Error fetching profile:", error);

        // If it's a timeout error, return null gracefully
        if (error instanceof Error && error.name === "AbortError") {
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (
      userId: string,
      data: Partial<ProfileData>
    ): Promise<{ error?: any }> => {
      setLoading(true);
      try {
        const response = await fetch(`/api/profile/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update profile");
        }

        // Invalidate profile cache after update
        cache.delete(`profile:${userId}`);

        return {};
      } catch (error) {
        console.error("Error updating profile:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Campaign operations
  const getCampaigns = useCallback(
    async (userId?: string): Promise<CampaignWithMedia[]> => {
      const cacheKey = userId ? `campaigns:user:${userId}` : "campaigns:all";
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      setLoading(true);
      try {
        const url = userId
          ? `/api/campaign/user/${userId}`
          : "/api/campaign/all";

        const response = await fetch(url, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch campaigns");
        }

        const data = await response.json();
        setCacheData(cacheKey, data.campaigns);
        return data.campaigns;
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getOrganizers = useCallback(
    async (organizerIds: string[]): Promise<Map<string, OrganizerData>> => {
      // Sort IDs to ensure consistent cache key
      const sortedIds = [...organizerIds].sort();
      const cacheKey = `organizers:${sortedIds.join(",")}`;
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/profile/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ ids: organizerIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch organizers");
        }

        const { profiles } = await response.json();

        const organizersMap = new Map<string, OrganizerData>();
        profiles.forEach((org: OrganizerData) => {
          organizersMap.set(org.id, {
            id: org.id,
            name: org.name,
            email: org.email,
          });
        });

        setCacheData(cacheKey, organizersMap);
        return organizersMap;
      } catch (error) {
        console.error("Error fetching organizers:", error);
        return new Map();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Analytics operations
  const getAnalytics = useCallback(async (): Promise<{
    totalUsers: number;
    totalCampaigns: number;
    totalDonations: number;
    pendingVerifications: number;
    totalInteractions?: number;
    growthRate?: number;
    totalNotificationsSent?: number;
  }> => {
    const cacheKey = "analytics";
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/analytics", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setCacheData(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return {
        totalUsers: 0,
        totalCampaigns: 0,
        totalDonations: 0,
        pendingVerifications: 0,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Notification preferences
  const getNotificationPreferences = useCallback(
    async (userId: string): Promise<NotificationPreferences | null> => {
      const cacheKey = `notificationPreferences:${userId}`;
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/user/${userId}/notification-preferences`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch notification preferences");
        }

        const data = await response.json();
        setCacheData(cacheKey, data.preferences);
        return data.preferences;
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateNotificationPreferences = useCallback(
    async (
      userId: string,
      data: NotificationPreferences
    ): Promise<{ error?: any }> => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/user/${userId}/notification-preferences`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.message || "Failed to update notification preferences"
          );
        }

        // Invalidate notification preferences cache after update
        cache.delete(`notificationPreferences:${userId}`);

        return {};
      } catch (error) {
        console.error("Error updating notification preferences:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Notification functions
  const getNotifications = useCallback(
    async (
      limit: number = 20,
      offset: number = 0,
      unreadOnly: boolean = false
    ): Promise<{
      notifications: Notification[];
      total: number;
      unreadCount: number;
      hasMore: boolean;
      error?: any;
    }> => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          ...(unreadOnly && { unread_only: "true" }),
        });

        const response = await fetch(`/api/notifications?${params}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch notifications");
        }

        const data = await response.json();
        return {
          notifications: data.notifications,
          total: data.total,
          unreadCount: data.unreadCount,
          hasMore: data.hasMore,
        };
      } catch (error) {
        console.error("Error fetching notifications:", error);
        return {
          notifications: [],
          total: 0,
          unreadCount: 0,
          hasMore: false,
          error,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markNotificationsAsRead = useCallback(
    async (
      notificationIds?: string[],
      markAllAsRead: boolean = false
    ): Promise<{ error?: any }> => {
      setLoading(true);
      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            notificationIds,
            markAllAsRead,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || "Failed to mark notifications as read"
          );
        }

        return {};
      } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fund transfer operations
  const createFundTransfer = useCallback(
    async (data: {
      campaignId: string;
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      amount: number;
      status: string;
      frequency?: string;
    }): Promise<{ error?: any; transferId?: string }> => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/campaign/${data.campaignId}/transfer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create fund transfer");
        }

        const result = await response.json();

        return { transferId: result.transferId };
      } catch (error) {
        console.error("Error creating fund transfer:", error);
        return { error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get fund transfer history
  const getFundTransferHistory = useCallback(
    async (
      campaignId: string,
      limit: number = 10,
      offset: number = 0
    ): Promise<{
      transfers: Array<any>;
      totalCount: number;
      hasMore: boolean;
      error?: any;
    }> => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/campaign/${campaignId}/transfer?limit=${limit}&offset=${offset}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch transfer history");
        }

        const data = await response.json();
        return {
          transfers: data.transfers,
          totalCount: data.totalCount,
          hasMore: data.hasMore,
        };
      } catch (error) {
        console.error("Error fetching transfer history:", error);
        return {
          transfers: [],
          totalCount: 0,
          hasMore: false,
          error,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Memoize the return value to avoid unnecessary re-renders
  const dbHook = useMemo(
    () => ({
      loading,
      // Auth
      getSession,
      // Profile
      getProfile,
      updateProfile,
      // Campaigns
      getCampaigns,
      getOrganizers,
      // Analytics
      getAnalytics,
      // Notifications
      getNotificationPreferences,
      updateNotificationPreferences,
      getNotifications,
      markNotificationsAsRead,
      // Fund transfers
      createFundTransfer,
      getFundTransferHistory,
    }),
    [
      loading,
      getSession,
      getProfile,
      updateProfile,
      getCampaigns,
      getOrganizers,
      getAnalytics,
      getNotificationPreferences,
      updateNotificationPreferences,
      getNotifications,
      markNotificationsAsRead,
      createFundTransfer,
      getFundTransferHistory,
    ]
  );

  return dbHook;
}
