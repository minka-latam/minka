import type { Metadata } from "next";
import { Quicksand, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/context/theme-context";
import { LoadingProvider } from "@/components/ui/loading-provider";
import { GlobalActivityToast } from "@/components/notifications/GlobalActivityToast";

const APP_NAME = "MINKA - Impulsa sueños, transforma vidas";
const APP_DESCRIPTION =
  "Plataforma de donaciones para causas sociales en Bolivia";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://minka-comunidad.org";

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
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  generator: "MINKA",
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  keywords: [
    "donaciones",
    "causas sociales",
    "bolivia",
    "crowdfunding",
    "ayuda social",
    "MINKA",
    "plataforma de donaciones",
    "transformar vidas",
  ],
  authors: [{ name: "MINKA Team" }],
  creator: "MINKA",
  publisher: "MINKA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`
          ${quicksand.variable} 
          ${geistMono.variable} 
          antialiased
          flex 
          min-h-screen 
          flex-col 
          bg-gradient-to-r from-white to-[#f5f7e9]
          font-quicksand
        `}
      >
        <ThemeProvider defaultTheme="system" storageKey="app-theme">
          <AuthProvider>
            <LoadingProvider>
              <QueryProvider>
                <div className="flex-grow">{children}</div>
                <GlobalActivityToast />
                <Toaster />
              </QueryProvider>
            </LoadingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
