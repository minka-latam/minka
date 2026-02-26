"use client";

import Image from "next/image";
import Link from "next/link";
import { Quicksand, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Header } from "@/components/views/landing-page/Header";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect logged-in users away from auth pages
  useEffect(() => {
    if (user && !isLoading) {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");
      const redirectPath =
        returnUrl && returnUrl.startsWith("/")
          ? returnUrl
          : "/dashboard";
      router.replace(redirectPath);
    }
  }, [user, isLoading, router]);

  // If loading or already authenticated, show minimal content
  if (isLoading || user) {
    return <LoadingScreen />;
  }

  return (
    <div
      className={`${quicksand.variable} ${geistMono.variable} font-quicksand min-h-screen bg-gradient-to-r from-white to-[#f5f7e9]`}
    >
      {/* Add Header component */}
      <Header />

      {/* Background SVG covering the screen width */}
      <div className="fixed bottom-0 left-0 right-0 z-0">
        <Image
          src="/auth/auth-bg.svg"
          alt="Background with plants"
          width={1440}
          height={535}
          priority
          className="h-auto w-full"
        />
      </div>

      {/* Content container - adjusted to account for header */}
      <div className="relative z-10 flex min-h-screen items-center justify-center pt-28">
        <div className="flex w-full max-w-6xl items-center justify-between px-4">
          {/* Logo on the left - much larger and with link */}
          <div className="hidden lg:block">
            <Link href="/">
              <Image
                src="/brand/logo.svg"
                alt="Minka Logo"
                width={420}
                height={134}
                priority
                className="transition-transform hover:scale-105"
              />
            </Link>
          </div>

          {/* Auth content (sign-in or sign-up) */}
          <div className="w-full max-w-md lg:w-2/5">
            {/* Mobile logo (only visible on small screens) */}
            <div className="mb-6 flex justify-center lg:hidden">
              <Link href="/">
                <Image
                  src="/brand/logo.svg"
                  alt="Minka Logo"
                  width={140}
                  height={45}
                  priority
                />
              </Link>
            </div>
            <Card className="p-8 shadow-md bg-white rounded-xl">
              {children}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
