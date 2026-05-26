import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PaymentMethod, PaymentStatus, Status, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyBisaQrAccessToken } from "@/lib/bisa/qr-access-token";

type BisaDonationAccessTarget = {
  id: string;
  campaignId: string;
  donorId: string;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentMethod: PaymentMethod;
  campaign: {
    organizerId: string;
  };
};

export function isPendingBisaDonation(donation: {
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentMethod: PaymentMethod;
}) {
  return (
    donation.paymentStatus === PaymentStatus.pending &&
    donation.paymentProvider === "bisa" &&
    donation.paymentMethod === PaymentMethod.qr
  );
}

async function getRequesterProfile() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  return prisma.profile.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });
}

export async function canAccessBisaDonation({
  donation,
  accessToken,
}: {
  donation: BisaDonationAccessTarget;
  accessToken?: unknown;
}) {
  const tokenPayload = verifyBisaQrAccessToken(accessToken);
  if (
    tokenPayload?.donationId === donation.id &&
    tokenPayload.campaignId === donation.campaignId
  ) {
    return true;
  }

  const profile = await getRequesterProfile();
  if (!profile) return false;

  return (
    profile.id === donation.donorId ||
    profile.id === donation.campaign.organizerId ||
    (profile.role === UserRole.admin && profile.status === Status.active)
  );
}
