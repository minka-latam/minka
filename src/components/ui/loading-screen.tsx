"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingScreenProps {
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
  className?: string;
  /** If true, shows the loader immediately without delay */
  immediate?: boolean;
}

export function LoadingScreen({
  text = "Loading...",
  showText = false,
  fullScreen = true,
  className,
  immediate = false,
}: LoadingScreenProps) {
  // Add a small delay before showing the loading screen for a smoother experience
  // Skip delay if immediate is true (for critical loading states like auth)
  const [showLoader, setShowLoader] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    // Short delay before showing loader to prevent flash for quick operations
    const timer = setTimeout(() => setShowLoader(true), 100);
    return () => clearTimeout(timer);
  }, [immediate]);

  // Always render the container to prevent layout shift, but control visibility
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-r from-white to-[#f5f7e9]",
        fullScreen ? "fixed inset-0 z-50" : "w-full h-full min-h-[200px]",
        showLoader ? "opacity-100" : "opacity-0",
        "transition-opacity duration-150",
        className
      )}
    >
      <LoadingSpinner size="lg" text={text} showText={showText} />
    </div>
  );
}
