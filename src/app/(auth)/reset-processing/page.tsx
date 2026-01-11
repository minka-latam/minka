"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ResetProcessingPage() {
  const router = useRouter();

  useEffect(() => {
    // Set the flag in sessionStorage
    // We use sessionStorage so it clears when the tab is closed and is specific to this session
    if (typeof window !== "undefined") {
      sessionStorage.setItem("trigger_reset_password", "true");
      
      // Redirect to dashboard immediately
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoadingSpinner size="lg" text="Procesando..." showText />
    </div>
  );
}
