"use client";

import type { CSSProperties } from "react";

import { getCampaignCategoryIcon } from "@/lib/campaign-categories";
import { cn } from "@/lib/utils";

type CategoryIconProps = {
  category?: string | null;
  className?: string;
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const icon = getCampaignCategoryIcon(category);
  const iconStyle = {
    WebkitMask: `url(${icon}) center / contain no-repeat`,
    mask: `url(${icon}) center / contain no-repeat`,
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-[#2c6e49]", className)}
      style={iconStyle}
    />
  );
}
