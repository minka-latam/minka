"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Footer } from "@/components/views/landing-page/Footer";
import { Header } from "@/components/views/landing-page/Header";
import { ProfileData } from "@/types";

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const supabase = createBrowserClient();
  const [isCampaignPage, setIsCampaignPage] = useState(false);

  useEffect(() => {
    async function getUserProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/sign-in");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(data);
      } catch (error) {
        console.error("Error getting user profile", error);
      }
    }

    getUserProfile();
  }, [router, supabase]);

  // Check if the page is a campaign detail page
  useEffect(() => {
    // This checks if we're on a specific campaign page (/dashboard/campaigns/[id])
    const path = window.location.pathname;
    const isCampaignDetailPage = /\/dashboard\/campaigns\/[^\/]+$/.test(path);
    setIsCampaignPage(isCampaignDetailPage);
  }, []);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex flex-col">
      {/* Use the landing page Header */}
      <Header />

      <main
        className={
          isCampaignPage
            ? "flex-grow w-full mt-28" // Add margin-top to account for fixed header
            : "flex-grow container mx-auto px-4 py-8 mt-28" // Add margin-top to account for fixed header
        }
      >
        <div className={isCampaignPage ? "w-full" : "max-w-[80%] mx-auto"}>
          {children}
        </div>
      </main>

      {/* Added extra space before footer */}
      {!isCampaignPage && <div className="py-16"></div>}

      {/* Only show footer on non-campaign pages */}
      {!isCampaignPage && <Footer />}
    </div>
  );
}

