import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForStore - Gamified Loyalty & Merchant Portal",
  description: "Configure and manage cafe games, rewards, QR scans, and staff counter voucher redemption.",
  applicationName: "ForStore",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ForStore",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111111",
};

import { Suspense } from "react";
import EnvironmentBanner from "../components/EnvironmentBanner";
import DemoOnboardingFab from "../components/DemoOnboardingFab";
import ProspectTelemetryTracker from "../components/ProspectTelemetryTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#F6F3EB] text-[#1A1A1A]">
        <Suspense fallback={null}>
          <ProspectTelemetryTracker />
        </Suspense>
        <EnvironmentBanner />
        {children}
        <DemoOnboardingFab />
      </body>
    </html>
  );
}
