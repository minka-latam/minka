"use client";

import Image from "next/image";
import { Copy, Instagram, Share2 } from "lucide-react";
import { useState } from "react";

import {
  buildCampaignSharePayload,
  type CampaignShareData,
  type CampaignShareIntent,
  type CampaignSharePlatform,
} from "@/lib/campaign-share";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { InstagramStoryShareDialog } from "@/components/share/InstagramStoryShareDialog";

interface CampaignShareMenuProps {
  campaign: CampaignShareData;
  intent?: CampaignShareIntent;
  buttonLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerClassName?: string;
  dropdownClassName?: string;
  dropdownPlacement?: "top" | "bottom";
  useNativeShare?: boolean;
}

const platformLabels: Record<CampaignSharePlatform, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  instagram: "Historia IG",
  copy: "Copiar enlace",
};

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function CampaignShareMenu({
  campaign,
  intent = "support",
  buttonLabel = "Compartir",
  triggerVariant = "outline",
  triggerClassName,
  dropdownClassName,
  dropdownPlacement = "top",
  useNativeShare = false,
}: CampaignShareMenuProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showInstagramStoryDialog, setShowInstagramStoryDialog] =
    useState(false);
  const { toast } = useToast();
  const sharePayload = buildCampaignSharePayload(campaign, {
    intent,
  });

  const closeMenu = () => setShowShareOptions(false);

  const copyToClipboard = async (value: string, successDescription: string) => {
    try {
      await navigator.clipboard.writeText(value);
      closeMenu();
      toast({
        title: "Copiado",
        description: successDescription,
      });
    } catch (error) {
      console.error("Failed to copy share text:", error);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const tryCopyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.error("Failed to copy share text:", error);
      return false;
    }
  };

  const openShareUrl = (
    url: string,
    platform: CampaignSharePlatform,
    options: { showToast?: boolean; mobileDelayMs?: number } = {},
  ) => {
    const showToast = options.showToast ?? true;

    if (isMobileDevice()) {
      window.setTimeout(() => {
        window.location.href = url;
      }, options.mobileDelayMs ?? 0);
    } else {
      window.open(url, "_blank", "noopener,noreferrer,width=640,height=560");
    }

    closeMenu();

    if (showToast) {
      toast({
        title: "Compartir campaña",
        description: `Se abrió ${platformLabels[platform]} para compartir.`,
      });
    }
  };

  const canUseNativeShare = () =>
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleShareClick = () => {
    if (useNativeShare && isMobileDevice() && canUseNativeShare()) {
      navigator
        .share({
          title: sharePayload.title,
          text: sharePayload.text,
          url: sharePayload.url,
        })
        .catch(() => {
          setShowShareOptions(true);
        });
      return;
    }

    setShowShareOptions(true);
  };

  const shareOnPlatform = (platform: CampaignSharePlatform) => {
    if (platform === "copy") {
      copyToClipboard(
        sharePayload.url,
        "El enlace de la campaña fue copiado al portapapeles.",
      );
      return;
    }

    if (platform === "facebook" || platform === "linkedin") {
      const isMobileShare = isMobileDevice();
      const copyPromise = tryCopyToClipboard(sharePayload.caption);

      if (isMobileShare) {
        toast({
          title: "Texto copiado",
          description: `En unos segundos se abrirá ${platformLabels[platform]}. Pega el texto copiado en la publicación.`,
        });
      }

      openShareUrl(sharePayload.links[platform], platform, {
        showToast: false,
        mobileDelayMs: isMobileShare ? 1200 : 0,
      });

      copyPromise.then((copied) => {
        if (isMobileShare) return;

        toast({
          title: "Texto copiado",
          description: copied
            ? `Pega el texto copiado en ${platformLabels[platform]} para acompañar el enlace.`
            : `${platformLabels[platform]} no permite rellenar el post automáticamente; copia el texto manualmente si lo necesitas.`,
        });
      });
      return;
    }

    if (platform === "instagram") {
      closeMenu();
      setShowInstagramStoryDialog(true);
      return;
    }

    openShareUrl(sharePayload.links[platform], platform);
  };

  const placementClass =
    dropdownPlacement === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <div
      className={cn(
        "relative inline-flex items-center",
        triggerClassName?.includes("w-full") && "w-full",
      )}
    >
      <Button
        type="button"
        variant={triggerVariant}
        className={triggerClassName}
        onClick={handleShareClick}
      >
        {buttonLabel}
        <Share2 className="h-4 w-4" />
      </Button>

      {showShareOptions && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            className={cn(
              "absolute z-50 bg-white border border-gray-200 rounded-2xl shadow-lg p-4",
              placementClass,
              dropdownClassName,
            )}
          >
            <div className="text-sm font-medium text-gray-700 mb-3 text-center">
              Compartir en:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => shareOnPlatform("whatsapp")}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Image
                  src="/social-media/whatsapp.svg"
                  alt="WhatsApp"
                  width={20}
                  height={20}
                />
                <span className="text-sm">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => shareOnPlatform("facebook")}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Image
                  src="/social-media/facebook.svg"
                  alt="Facebook"
                  width={20}
                  height={20}
                />
                <span className="text-sm">Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => shareOnPlatform("twitter")}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Image
                  src="/social-media/X.svg"
                  alt="X (Twitter)"
                  width={20}
                  height={20}
                />
                <span className="text-sm">X (Twitter)</span>
              </button>

              <button
                type="button"
                onClick={() => shareOnPlatform("linkedin")}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Image
                  src="/icons/LinkedIN_white.svg"
                  alt="LinkedIn"
                  width={20}
                  height={20}
                  style={{ filter: "brightness(0.43)" }}
                />
                <span className="text-sm">LinkedIn</span>
              </button>

              <button
                type="button"
                onClick={() => shareOnPlatform("instagram")}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Instagram className="h-5 w-5 text-[#E4405F]" />
                <span className="text-sm">Historia IG</span>
              </button>

              <button
                type="button"
                onClick={() => shareOnPlatform("copy")}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Copy className="h-5 w-5 text-gray-600" />
                <span className="text-sm">Copiar enlace</span>
              </button>
            </div>

            <p className="mt-3 text-center text-sm leading-relaxed text-gray-800">
              Hemos preparado un texto y lo copiamos por ti. Solo pégalo en la
              publicación.
            </p>

            <button
              type="button"
              onClick={closeMenu}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
      <InstagramStoryShareDialog
        open={showInstagramStoryDialog}
        onOpenChange={setShowInstagramStoryDialog}
        campaign={campaign}
      />
    </div>
  );
}
