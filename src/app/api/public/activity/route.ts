import { NextResponse } from "next/server";
import { CampaignStatus, PaymentStatus, Status } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PublicActivity = {
  id: string;
  type: "donation" | "comment" | "admin";
  title: string;
  message: string;
  campaignId?: string;
  campaignTitle?: string;
  createdAt: string;
};

export async function GET() {
  try {
    const [donations, comments, adminNotifications] = await Promise.all([
      prisma.donation.findMany({
        where: {
          paymentStatus: PaymentStatus.completed,
          campaign: {
            campaignStatus: CampaignStatus.active,
          },
        },
        select: {
          id: true,
          amount: true,
          isAnonymous: true,
          createdAt: true,
          donor: {
            select: {
              name: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.comment.findMany({
        where: {
          status: Status.active,
          campaign: {
            campaignStatus: CampaignStatus.active,
          },
        },
        select: {
          id: true,
          createdAt: true,
          profile: {
            select: {
              name: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.systemNotificationLog.findMany({
        where: {
          status: Status.active,
          target: "all",
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const activities: PublicActivity[] = [
      ...donations.map((donation) => {
        const donorName = donation.isAnonymous
          ? "Alguien"
          : donation.donor?.name || "Alguien";

        return {
          id: `donation:${donation.id}`,
          type: "donation" as const,
          title: "Nueva donación",
          message: `${donorName} donó Bs. ${Number(donation.amount).toLocaleString("es-BO")} a ${donation.campaign.title}.`,
          campaignId: donation.campaign.id,
          campaignTitle: donation.campaign.title,
          createdAt: donation.createdAt.toISOString(),
        };
      }),
      ...comments.map((comment) => ({
        id: `comment:${comment.id}`,
        type: "comment" as const,
        title: "Nuevo comentario",
        message: `${comment.profile?.name || "Alguien"} comentó en ${comment.campaign.title}.`,
        campaignId: comment.campaign.id,
        campaignTitle: comment.campaign.title,
        createdAt: comment.createdAt.toISOString(),
      })),
      ...adminNotifications.map((notification) => ({
        id: `admin:${notification.id}`,
        type: "admin" as const,
        title: notification.title,
        message: notification.content,
        createdAt: notification.createdAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching public activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch public activity" },
      { status: 500 },
    );
  }
}
