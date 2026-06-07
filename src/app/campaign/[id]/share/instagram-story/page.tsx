import type { Metadata } from "next";

import { InstagramStoryMobileView } from "@/components/share/InstagramStoryMobileView";

export const metadata: Metadata = {
  title: "Compartir historia de Instagram | Minka",
  description: "Descarga una historia para compartir esta campaña en Instagram.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function InstagramStorySharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <InstagramStoryMobileView campaignId={id} />;
}
