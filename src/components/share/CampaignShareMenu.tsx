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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CampaignShareMenuProps {
  campaign: CampaignShareData;
  intent?: CampaignShareIntent;
  buttonLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerClassName?: string;
  dropdownClassName?: string;
  dropdownPlacement?: "top" | "bottom";
  useNativeShare?: boolean;
  disabled?: boolean;
  disabledReason?: string;
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

function isAppleMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
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
  disabled = false,
  disabledReason,
}: CampaignShareMenuProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showInstagramStoryDialog, setShowInstagramStoryDialog] =
    useState(false);
  const { toast } = useToast();
  const sharePayload = buildCampaignSharePayload(campaign, {
    intent,
  });

  const closeMenu = () => setShowShareOptions(false);

  const copyTextWithSelectionFallback = (value: string) => {
    let textarea: HTMLTextAreaElement | null = null;
    let selection: Selection | null = null;
    let selectedRange: Range | null = null;

    try {
      textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "-9999px";
      textarea.style.width = "1px";
      textarea.style.height = "1px";
      textarea.style.opacity = "0";
      textarea.style.fontSize = "16px";

      selection = document.getSelection();
      selectedRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.setSelectionRange(0, textarea.value.length);

      return document.execCommand("copy");
    } catch (error) {
      console.error("Failed to copy share text with fallback:", error);
      return false;
    } finally {
      if (textarea?.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }

      if (selection) {
        selection.removeAllRanges();
        if (selectedRange) {
          selection.addRange(selectedRange);
        }
      }
    }
  };

  const writeTextToClipboard = async (value: string) => {
    try {
      const copiedWithSelection = copyTextWithSelectionFallback(value);
      if (copiedWithSelection) {
        return true;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (error) {
      console.error("Failed to copy share text:", error);
    }

    return false;
  };

  const copyToClipboard = async (value: string, successDescription: string) => {
    const copied = await writeTextToClipboard(value);

    closeMenu();

    if (copied) {
      toast({
        title: "Copiado",
        description: successDescription,
      });
      return;
    }

    toast({
      title: "Error",
      description: "No se pudo copiar el enlace",
      variant: "destructive",
    });
  };

  const tryCopyToClipboard = async (value: string) => {
    return writeTextToClipboard(value);
  };

  const showPreparedTextToast = (platform: "facebook" | "linkedin") => {
    toast({
      title: "Texto y enlace copiados",
      description: `Hemos copiado un texto y el enlace para que solo pongas "pegar" en tu publicación de ${platformLabels[platform]}.`,
    });
  };

  const showPreparedTextResultToast = (
    copied: boolean,
    platform: "facebook" | "linkedin",
  ) => {
    if (copied) {
      showPreparedTextToast(platform);
      return;
    }

    toast({
      title: "No se pudo copiar el texto",
      description: `Abre ${platformLabels[platform]} y comparte el enlace manualmente.`,
      variant: "destructive",
    });
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

  const shareWithDeviceSheet = async (platform: "facebook" | "linkedin") => {
    const copiedImmediately = copyTextWithSelectionFallback(
      sharePayload.caption,
    );
    const copyPromise = copiedImmediately
      ? Promise.resolve(true)
      : tryCopyToClipboard(sharePayload.caption);
    closeMenu();

    try {
      await navigator.share({
        title: sharePayload.title,
        text: sharePayload.text,
        url: sharePayload.url,
      });
      const copied = await copyPromise;
      showPreparedTextResultToast(copied, platform);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const copied = await copyPromise;
      showPreparedTextResultToast(copied, platform);

      openShareUrl(sharePayload.links[platform], platform, {
        showToast: false,
      });
    }
  };

  const handleShareClick = () => {
    if (disabled) return;

    if (useNativeShare && isMobileDevice() && canUseNativeShare()) {
      const copiedImmediately = copyTextWithSelectionFallback(
        sharePayload.caption,
      );
      const copyPromise = copiedImmediately
        ? Promise.resolve(true)
        : tryCopyToClipboard(sharePayload.caption);
      navigator
        .share({
          title: sharePayload.title,
          text: sharePayload.text,
          url: sharePayload.url,
        })
        .then(async () => {
          await copyPromise;
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
      if (isAppleMobileDevice() && canUseNativeShare()) {
        shareWithDeviceSheet(platform);
        return;
      }

      const isMobileShare = isMobileDevice();
      const copyPromise = tryCopyToClipboard(sharePayload.caption);

      if (isMobileShare) {
        showPreparedTextToast(platform);
      }

      openShareUrl(sharePayload.links[platform], platform, {
        showToast: false,
        mobileDelayMs: isMobileShare ? 1800 : 0,
      });

      copyPromise.then((copied) => {
        if (isMobileShare) return;

        showPreparedTextResultToast(copied, platform);
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
  const triggerButton = (
    <Button
      type="button"
      variant={triggerVariant}
      className={triggerClassName}
      disabled={disabled}
      onClick={handleShareClick}
    >
      {buttonLabel}
      <Share2 className="h-4 w-4" />
    </Button>
  );

  return (
    <div
      className={cn(
        "relative inline-flex items-center",
        triggerClassName?.includes("w-full") && "w-full",
      )}
    >
      {disabled && disabledReason ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex cursor-not-allowed",
                  triggerClassName?.includes("w-full") && "w-full",
                )}
              >
                {triggerButton}
              </span>
            </TooltipTrigger>
            <TooltipContent>{disabledReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        triggerButton
      )}

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
