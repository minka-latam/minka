import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CampaignStatus,
  MediaType,
  Status,
} from "@prisma/client";

import Loading from "./loading";
import CampaignClientPage from "@/components/views/campaign/CampaignClientPage";
import { prisma } from "@/lib/prisma";
import {
  getCampaignShareDescription,
  getCampaignShareTitle,
  getCampaignShareUrl,
  getPublicAppUrl,
  MINKA_FALLBACK_SHARE_IMAGE,
  toAbsoluteShareUrl,
} from "@/lib/campaign-share";

function getSocialImageType(url: string) {
  const cleanUrl = url.split("?")[0]?.toLowerCase() || "";

  if (cleanUrl.endsWith(".png")) return "image/png";
  if (cleanUrl.endsWith(".webp")) return "image/webp";
  if (cleanUrl.endsWith(".gif")) return "image/gif";

  return "image/jpeg";
}

function getSocialImage(url: string, alt: string, isFallback = false) {
  return {
    url,
    width: isFallback ? 512 : 1200,
    height: isFallback ? 512 : 630,
    alt,
    type: getSocialImageType(url),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = getPublicAppUrl();
  const campaignUrl = getCampaignShareUrl(id, baseUrl);
  const fallbackImage = toAbsoluteShareUrl(
    MINKA_FALLBACK_SHARE_IMAGE,
    baseUrl,
  );

  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        campaignStatus: CampaignStatus.active,
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        media: {
          where: {
            status: Status.active,
            type: MediaType.image,
          },
          orderBy: [
            { isPrimary: "desc" },
            { orderIndex: "asc" },
          ],
          take: 1,
          select: {
            mediaUrl: true,
            previewUrl: true,
          },
        },
      },
    });

    if (!campaign) {
      return {
        title: "Campaña en Minka",
        description:
          "Conoce campañas solidarias y causas sociales en Minka.",
        alternates: {
          canonical: campaignUrl,
        },
      openGraph: {
          title: "Campaña en Minka",
          description:
            "Conoce campañas solidarias y causas sociales en Minka.",
          url: campaignUrl,
          siteName: "Minka",
          type: "website",
          images: [getSocialImage(fallbackImage, "Minka", true)],
        },
        twitter: {
          card: "summary_large_image",
          title: "Campaña en Minka",
          description:
            "Conoce campañas solidarias y causas sociales en Minka.",
          images: [fallbackImage],
        },
      };
    }

    const title = getCampaignShareTitle(campaign);
    const description = getCampaignShareDescription(campaign);
    const primaryImage = toAbsoluteShareUrl(
      campaign.media[0]?.previewUrl ||
        campaign.media[0]?.mediaUrl ||
        MINKA_FALLBACK_SHARE_IMAGE,
      baseUrl,
    );
    const hasCampaignImage = Boolean(campaign.media[0]?.mediaUrl);

    return {
      title,
      description,
      alternates: {
        canonical: campaignUrl,
      },
      openGraph: {
        title,
        description,
        url: campaignUrl,
        siteName: "Minka",
        locale: "es_BO",
        type: "website",
        images: [getSocialImage(primaryImage, title, !hasCampaignImage)],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [primaryImage],
      },
    };
  } catch (error) {
    console.error("Error generating campaign metadata:", error);

    return {
      title: "Campaña en Minka",
      description:
        "Conoce campañas solidarias y causas sociales en Minka.",
      alternates: {
        canonical: campaignUrl,
      },
        openGraph: {
        title: "Campaña en Minka",
        description:
          "Conoce campañas solidarias y causas sociales en Minka.",
        url: campaignUrl,
        siteName: "Minka",
        type: "website",
        images: [getSocialImage(fallbackImage, "Minka", true)],
      },
      twitter: {
        card: "summary_large_image",
        title: "Campaña en Minka",
        description:
          "Conoce campañas solidarias y causas sociales en Minka.",
        images: [fallbackImage],
      },
    };
  }
}

// Server component that passes the campaign ID to the client component
export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  if (!id) {
    console.error("Server: Campaign ID is required but not provided");
    return notFound();
  }

  // Use Suspense to show loading state while client component fetches data
  return (
    <div className="flex flex-col min-h-screen overflow-wrap break-words">
      <Suspense fallback={<Loading />}>
        <CampaignClientPage id={id} />
      </Suspense>
    </div>
  );
}
