import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Types
export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  identity_number?: string | null;
  birth_date?: string | null;
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

export type AnalyticsPeriod = "week" | "month" | "year";

export interface AdminAnalyticsData {
  period: {
    key: AnalyticsPeriod;
    label: string;
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
  };
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalCampaigns: number;
    activeCampaigns: number;
    newCampaigns: number;
    completedDonationAmount: number;
    completedDonationCount: number;
    totalCompletedDonationAmount: number;
    totalCompletedDonationCount: number;
    averageDonationAmount: number;
    pendingVerifications: number;
    periodInteractions: number;
    interactionBreakdown: {
      comments: number;
      savedCampaigns: number;
      campaignUpdates: number;
    };
    donationGrowthRate: number | null;
    previousCompletedDonationAmount: number;
    periodNotifications: number;
    totalNotifications: number;
  };
  charts: {
    donationTrend: Array<{ name: string; amount: number; donations: number }>;
    userTrend: Array<{ name: string; newUsers: number }>;
    activityTrend: Array<{
      name: string;
      comments: number;
      savedCampaigns: number;
      campaignUpdates: number;
      total: number;
    }>;
    campaignCategories: Array<{ name: string; value: number }>;
    campaignStatuses: Array<{ name: string; value: number }>;
    verificationStatuses: Array<{ name: string; value: number }>;
    donationMethods: Array<{ name: string; value: number; amount: number }>;
    userSegments: Array<{ name: string; value: number }>;
  };
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

  const ensureProfile = useCallback(async (): Promise<ProfileData | null> => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile/ensure", {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || "Failed to ensure profile");
      }

      const data = await response.json();
      if (!data.profile) {
        throw new Error("No profile data received");
      }

      cache.delete(`profile:${data.profile.id}:basic`);
      cache.delete(`profile:${data.profile.id}:full`);
      return data.profile;
    } catch (error) {
      console.error("Error ensuring profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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
        cache.delete(`profile:${userId}:basic`);
        cache.delete(`profile:${userId}:full`);

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
  const getAnalytics = useCallback(
    async (period: AnalyticsPeriod = "month"): Promise<AdminAnalyticsData> => {
      const cacheKey = `analytics:${period}`;
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics?period=${period}`, {
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
          period: {
            key: period,
            label:
              period === "week"
                ? "Últimos 7 días"
                : period === "year"
                  ? "Últimos 12 meses"
                  : "Últimos 30 días",
            currentStart: "",
            currentEnd: "",
            previousStart: "",
            previousEnd: "",
          },
          overview: {
            totalUsers: 0,
            activeUsers: 0,
            newUsers: 0,
            totalCampaigns: 0,
            activeCampaigns: 0,
            newCampaigns: 0,
            completedDonationAmount: 0,
            completedDonationCount: 0,
            totalCompletedDonationAmount: 0,
            totalCompletedDonationCount: 0,
            averageDonationAmount: 0,
            pendingVerifications: 0,
            periodInteractions: 0,
            interactionBreakdown: {
              comments: 0,
              savedCampaigns: 0,
              campaignUpdates: 0,
            },
            donationGrowthRate: null,
            previousCompletedDonationAmount: 0,
            periodNotifications: 0,
            totalNotifications: 0,
          },
          charts: {
            donationTrend: [],
            userTrend: [],
            activityTrend: [],
            campaignCategories: [],
            campaignStatuses: [],
            verificationStatuses: [],
            donationMethods: [],
            userSegments: [],
          },
        };
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
      amount: number;
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
            body: JSON.stringify({ amount: data.amount }),
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
      ensureProfile,
      updateProfile,
      // Campaigns
      getCampaigns,
      getOrganizers,
      // Analytics
      getAnalytics,
      // Notifications
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
      ensureProfile,
      updateProfile,
      getCampaigns,
      getOrganizers,
      getAnalytics,
      getNotifications,
      markNotificationsAsRead,
      createFundTransfer,
      getFundTransferHistory,
    ]
  );

  return dbHook;
}
