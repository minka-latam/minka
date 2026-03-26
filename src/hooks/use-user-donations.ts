import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";

type DonationMedia = {
  mediaUrl: string;
};

type DonationCampaign = {
  id: string;
  title: string;
  category: string;
  media: DonationMedia[];
};

export type Donation = {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  payment_method: string;
  is_anonymous: boolean;
  message?: string;
  campaign: DonationCampaign;
};

type DonationsResponse = {
  donations: Donation[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

type DonationDetailsResponse = {
  donation: Donation & {
    donor: {
      id: string;
      name: string;
      email: string;
      profile_picture?: string;
    };
    campaign: DonationCampaign & {
      description: string;
      story: string;
      goal_amount: number;
      collected_amount: number;
      percentage_funded: number;
    };
  };
};

// Mock data for development
const mockDonations: Donation[] = [
  {
    id: "1",
    amount: 123.0,
    currency: "BOB",
    created_at: "2024-01-04T10:00:00Z",
    payment_status: "completed",
    payment_method: "credit_card",
    is_anonymous: false,
    message: "¡Excelente iniciativa!",
    campaign: {
      id: "101",
      title: "Esperanza en acción",
      category: "salud",
      media: [{ mediaUrl: "/amboro-main.jpg" }],
    },
  },
  {
    id: "2",
    amount: 789.0,
    currency: "BOB",
    created_at: "2024-01-04T09:30:00Z",
    payment_status: "pending",
    payment_method: "bank_transfer",
    is_anonymous: true,
    campaign: {
      id: "102",
      title: "Unidos por la alegría",
      category: "educacion",
      media: [{ mediaUrl: "/amboro-main.jpg" }],
    },
  },
  {
    id: "3",
    amount: 234.0,
    currency: "BOB",
    created_at: "2024-01-04T09:00:00Z",
    payment_status: "completed",
    payment_method: "qr",
    is_anonymous: false,
    campaign: {
      id: "103",
      title: "Cambiando vidas con sonrisas",
      category: "medioambiente",
      media: [{ mediaUrl: "/amboro-main.jpg" }],
    },
  },
];

const fetchUserDonations = async (page = 1, pageSize = 6) => {
  // In development, return mock data
  if (process.env.NODE_ENV === "development") {
    return {
      donations: mockDonations,
      meta: {
        currentPage: page,
        pageSize,
        totalItems: mockDonations.length,
        totalPages: Math.ceil(mockDonations.length / pageSize),
      },
    };
  }

  try {
    const response = await fetch(
      `/api/user/donations?page=${page}&pageSize=${pageSize}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch donations");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching donations:", error);
    throw error;
  }
};

const fetchDonationDetails = async (donationId: string) => {
  // In development, return mock data
  if (process.env.NODE_ENV === "development") {
    const donation = mockDonations.find((d) => d.id === donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    return {
      donation: {
        ...donation,
        donor: {
          id: "user123",
          name: "Juan Pérez",
          email: "juan@example.com",
          profile_picture: null,
        },
        campaign: {
          ...donation.campaign,
          description: "Una campaña para apoyar a quienes más lo necesitan",
          story: "Esta historia comenzó cuando...",
          goal_amount: 10000,
          collected_amount: 5000,
          percentage_funded: 50,
        },
      },
    };
  }

  try {
    const response = await fetch(`/api/user/donations/${donationId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch donation details");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching donation details:", error);
    throw error;
  }
};

export function useUserDonations(page = 1, pageSize = 6) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const { data, isLoading, isError, error, refetch } =
    useQuery<DonationsResponse>({
      queryKey: ["userDonations", page, pageSize],
      queryFn: () => fetchUserDonations(page, pageSize),
      retry: 1,
      retryDelay: 1000,
      staleTime: 60000, // 1 minute
    });

  return {
    donations: data?.donations || [],
    meta: data?.meta || {
      currentPage: 1,
      pageSize,
      totalItems: 0,
      totalPages: 0,
    },
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useUserDonationDetails(donationId: string | null) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const { data, isLoading, isError, error, refetch } =
    useQuery<DonationDetailsResponse>({
      queryKey: ["userDonationDetails", donationId],
      queryFn: () => fetchDonationDetails(donationId as string),
      enabled: !!donationId,
      retry: 1,
      retryDelay: 1000,
      staleTime: 300000, // 5 minutes
    });

  return {
    donation: data?.donation,
    isLoading,
    isError,
    error,
    refetch,
  };
}

