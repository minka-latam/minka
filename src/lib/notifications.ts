import { prisma } from "@/lib/prisma";

export interface CreateNotificationParams {
  userId: string;
  type:
    | "donation_received"
    | "comment_received"
    | "campaign_update"
    | "general_news";
  title: string;
  message: string;
  campaignId?: string;
  donationId?: string;
  commentId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        campaignId: params.campaignId,
        donationId: params.donationId,
        commentId: params.commentId,
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

export async function createDonationNotification(
  donationId: string,
  campaignId: string,
  organizerId: string,
  donorName: string,
  amount: number,
  campaignTitle: string,
  isAnonymous: boolean = false
) {
  const displayName = isAnonymous ? "un colaborador anónimo" : donorName;

  return createNotification({
    userId: organizerId,
    type: "donation_received",
    title: "¡Nuevo aporte recibido!",
    message: `${displayName} ha donado Bs. ${amount} a tu campaña "${campaignTitle}". ¡Gracias por hacer la diferencia!`,
    campaignId,
    donationId,
  });
}

export async function createCommentNotification(
  commentId: string,
  campaignId: string,
  organizerId: string,
  commenterName: string,
  campaignTitle: string,
  commentMessage: string
) {
  // Truncate comment message if too long
  const truncatedMessage =
    commentMessage.length > 100
      ? `${commentMessage.substring(0, 100)}...`
      : commentMessage;

  return createNotification({
    userId: organizerId,
    type: "comment_received",
    title: "Nuevo comentario en tu campaña",
    message: `${commenterName} ha comentado en tu campaña "${campaignTitle}": "${truncatedMessage}"`,
    campaignId,
    commentId,
  });
}
