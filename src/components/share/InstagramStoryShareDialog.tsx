"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { Download, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CampaignShareData,
  getCampaignShareTitle,
  getCampaignShareUrl,
  getInstagramStoryShareUrl,
} from "@/lib/campaign-share";
import {
  createInstagramStoryImage,
  downloadDataUrl,
  getInstagramStoryFilename,
} from "@/lib/instagram-story-image";
import { useToast } from "@/components/ui/use-toast";

interface InstagramStoryShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignShareData;
}

export function InstagramStoryShareDialog({
  open,
  onOpenChange,
  campaign,
}: InstagramStoryShareDialogProps) {
  const [mobileQrDataUrl, setMobileQrDataUrl] = useState("");
  const [storyDataUrl, setStoryDataUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const campaignTitle = getCampaignShareTitle(campaign);
  const campaignUrl = useMemo(
    () => getCampaignShareUrl(campaign.id),
    [campaign.id],
  );
  const mobileShareUrl = useMemo(
    () => getInstagramStoryShareUrl(campaign.id),
    [campaign.id],
  );

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setIsGenerating(true);

    Promise.all([
      QRCode.toDataURL(mobileShareUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: "#0f3524",
          light: "#ffffff",
        },
      }),
      createInstagramStoryImage({
        title: campaignTitle,
        imageUrl: campaign.imageUrl,
        campaignUrl,
      }),
    ])
      .then(([qr, story]) => {
        if (!isMounted) return;
        setMobileQrDataUrl(qr);
        setStoryDataUrl(story);
      })
      .catch((error) => {
        console.error("Error generating Instagram story assets:", error);
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
  }, [
    campaign.imageUrl,
    campaignTitle,
    campaignUrl,
    mobileShareUrl,
    open,
    toast,
  ]);

  const handleDownload = () => {
    if (!storyDataUrl) return;
    downloadDataUrl(storyDataUrl, getInstagramStoryFilename(campaign.title));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-2xl p-0">
        <div className="border-b border-gray-100 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Comparte en Instagram desde tu teléfono
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-gray-700">
              Escanea el código QR con tu dispositivo móvil para descargar la
              imagen de historia y subirla a Instagram.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-6 bg-[#f7f7f3] p-6 md:grid-cols-[1fr_220px]">
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0e9] text-[#2c6e49]">
              <Smartphone className="h-6 w-6" />
            </div>
            {mobileQrDataUrl ? (
              <Image
                src={mobileQrDataUrl}
                alt="QR para compartir en Instagram"
                width={220}
                height={220}
                className="rounded-lg"
              />
            ) : (
              <div className="h-[220px] w-[220px] animate-pulse rounded-lg bg-gray-100" />
            )}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-600">
              Escanea este QR para abrir la imagen en tu celular. Desde ahí
              podrás descargarla o compartirla.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 border-[#2c6e49] text-[#2c6e49]"
              onClick={handleDownload}
              disabled={!storyDataUrl || isGenerating}
            >
              <Download className="h-4 w-4" />
              Descargar desde aquí
            </Button>
          </div>

          <div className="mx-auto w-[180px]">
            <div className="overflow-hidden rounded-2xl border border-[#d9ead7] bg-[#0f3524] shadow-lg">
              {storyDataUrl ? (
                <Image
                  src={storyDataUrl}
                  alt="Vista previa de historia de Instagram"
                  width={180}
                  height={320}
                  className="h-auto w-full"
                />
              ) : (
                <div className="aspect-[9/16] w-full animate-pulse bg-[#2c6e49]" />
              )}
            </div>
            <p className="mt-3 text-center text-xs leading-relaxed text-gray-600">
              Vista previa de la historia generada para esta campaña.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
