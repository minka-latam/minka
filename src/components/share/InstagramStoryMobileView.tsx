"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Download,
  ExternalLink,
  Link as LinkIcon,
  Share2,
  Sticker,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCampaign } from "@/hooks/useCampaign";
import {
  getCampaignShareTitle,
  getCampaignShareUrl,
} from "@/lib/campaign-share";
import {
  createInstagramStoryImage,
  dataUrlToPngFile,
  downloadDataUrl,
  getInstagramStoryFilename,
} from "@/lib/instagram-story-image";
import { useToast } from "@/components/ui/use-toast";

function getPrimaryCampaignImage(
  media?: Array<{
    media_url: string;
    is_primary: boolean;
  }>,
) {
  return (
    media?.find((item) => item.is_primary)?.media_url ||
    media?.[0]?.media_url ||
    null
  );
}

export function InstagramStoryMobileView({
  campaignId,
}: {
  campaignId: string;
}) {
  const { campaign, isLoading, error } = useCampaign(campaignId);
  const [storyDataUrl, setStoryDataUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const campaignTitle = getCampaignShareTitle({
    id: campaignId,
    title: campaign?.title,
  });
  const campaignUrl = useMemo(
    () => getCampaignShareUrl(campaignId),
    [campaignId],
  );
  const campaignImage = getPrimaryCampaignImage(campaign?.media);
  const filename = getInstagramStoryFilename(campaign?.title);

  useEffect(() => {
    if (!campaign) return;

    let isMounted = true;
    setIsGenerating(true);

    createInstagramStoryImage({
      title: campaignTitle,
      imageUrl: campaignImage,
      campaignUrl,
    })
      .then((dataUrl) => {
        if (isMounted) setStoryDataUrl(dataUrl);
      })
      .catch((generationError) => {
        console.error("Error generating mobile Instagram story:", generationError);
        if (!isMounted) return;
        toast({
          title: "No se pudo generar la historia",
          description: "Intenta nuevamente en unos segundos.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [campaign, campaignImage, campaignTitle, campaignUrl, toast]);

  const handleDownload = () => {
    if (!storyDataUrl) return;
    downloadDataUrl(storyDataUrl, filename);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      toast({
        title: "Enlace copiado",
        description: "Pégalo en el sticker de enlace de tu historia.",
      });
    } catch (copyError) {
      console.error("Error copying campaign link:", copyError);
      toast({
        title: "No se pudo copiar el enlace",
        description: "Copia el enlace manualmente desde el campo.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (!storyDataUrl) return;

    try {
      const file = await dataUrlToPngFile(storyDataUrl, filename);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: campaignTitle,
          text: "Comparte esta historia en Instagram.",
        });
        return;
      }

      handleDownload();
      toast({
        title: "Imagen descargada",
        description: "Súbela manualmente a tu historia de Instagram.",
      });
    } catch (shareError) {
      console.error("Error sharing Instagram story image:", shareError);
      handleDownload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7e9] px-4">
        <p className="text-base text-[#2c6e49]">Generando historia...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7e9] px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            No se pudo cargar la campaña
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Revisa el enlace o intenta nuevamente.
          </p>
          <Button asChild className="mt-5 bg-[#2c6e49] text-white">
            <Link href={`/campaign/${campaignId}`}>Ver campaña</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7e9] px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="w-full max-w-[240px] overflow-hidden rounded-3xl border border-[#d9ead7] bg-[#0f3524] shadow-xl">
          {storyDataUrl ? (
            <Image
              src={storyDataUrl}
              alt="Historia de Instagram para compartir"
              width={240}
              height={427}
              className="h-auto w-full"
              priority
            />
          ) : (
            <div className="aspect-[9/16] w-full animate-pulse bg-[#2c6e49]" />
          )}
        </div>

        <section className="mt-6 w-full rounded-t-3xl bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold leading-tight text-gray-950">
            Cómo agregar el enlace a tu historia
          </h1>
          <p className="mt-2 text-base leading-relaxed text-gray-700">
            Comparte la imagen en Instagram y agrega el enlace de la campaña
            con el sticker de enlace.
          </p>

          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-[1fr_92px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="p-4">
                <span className="inline-flex rounded-md bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                  Paso 1
                </span>
                <p className="mt-3 text-lg font-medium leading-snug text-gray-900">
                  En Instagram, toca el ícono de stickers.
                </p>
              </div>
              <div className="flex items-center justify-center border-l border-gray-200 bg-gray-50">
                <Sticker className="h-10 w-10 text-[#2c6e49]" />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_92px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="p-4">
                <span className="inline-flex rounded-md bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                  Paso 2
                </span>
                <p className="mt-3 text-lg font-medium leading-snug text-gray-900">
                  Elige el sticker de enlace.
                </p>
              </div>
              <div className="flex items-center justify-center border-l border-gray-200 bg-gray-50">
                <LinkIcon className="h-10 w-10 text-[#2c6e49]" />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_92px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="p-4">
                <span className="inline-flex rounded-md bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                  Paso 3
                </span>
                <p className="mt-3 text-lg font-medium leading-snug text-gray-900">
                  Pega el enlace copiado y ubícalo en la imagen.
                </p>
              </div>
              <div className="flex items-center justify-center border-l border-gray-200 bg-gray-50">
                <ExternalLink className="h-10 w-10 text-[#2c6e49]" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="min-w-0 px-4 py-3">
              <p className="text-sm font-medium text-gray-500">
                Enlace de campaña
              </p>
              <p className="truncate text-base font-semibold text-gray-900">
                {campaignUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 border-l border-gray-200 px-4 text-base font-bold text-gray-900"
            >
              <Copy className="h-5 w-5" />
              Copiar
            </button>
          </div>

          <div className="mt-5 grid w-full gap-3">
            <Button
              type="button"
              className="rounded-full bg-[#2c6e49] py-6 text-base font-bold text-white hover:bg-[#1e4d33]"
              onClick={handleNativeShare}
              disabled={!storyDataUrl || isGenerating}
            >
              <Share2 className="h-4 w-4" />
              Abrir Instagram
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-[#2c6e49] py-6 text-[#2c6e49]"
              onClick={handleDownload}
              disabled={!storyDataUrl || isGenerating}
            >
              <Download className="h-4 w-4" />
              Descargar imagen
            </Button>
            <Button asChild variant="ghost" className="text-[#2c6e49]">
              <Link href={`/campaign/${campaignId}`}>Volver a la campaña</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
