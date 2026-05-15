import { CampaignStatus } from "@prisma/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export function isPublicCampaign(campaign: {
  campaignStatus?: CampaignStatus | string;
  campaign_status?: CampaignStatus | string;
}) {
  const campaignStatus = campaign.campaignStatus ?? campaign.campaign_status;

  return campaignStatus === CampaignStatus.active;
}

export function canReceiveCampaignPayments(campaign: {
  campaignStatus?: CampaignStatus | string;
  campaign_status?: CampaignStatus | string;
}) {
  return isPublicCampaign(campaign);
}

export async function findPublicCampaignById(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      campaignStatus: true,
    },
  });

  return campaign && isPublicCampaign(campaign) ? campaign : null;
}

export async function findPublicOrOwnedCampaignById(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      campaignStatus: true,
      organizerId: true,
    },
  });

  if (!campaign) return null;
  if (isPublicCampaign(campaign)) return campaign;

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
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const profileWhere: Array<{ id: string } | { email: string }> = [];
  if (session?.user?.id) profileWhere.push({ id: session.user.id });
  if (session?.user?.email) profileWhere.push({ email: session.user.email });

  const requester =
    profileWhere.length > 0
      ? await prisma.profile.findFirst({
          where: { OR: profileWhere },
          select: { id: true, role: true },
        })
      : null;

  if (requester?.role === "admin" || requester?.id === campaign.organizerId) {
    return campaign;
  }

  return null;
}
