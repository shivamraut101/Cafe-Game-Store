import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForStore | White-Label Gamified Loyalty Platform & QR Engine for Local Stores",
  description:
    "Turn every customer visit into a game. White-label gamified QR loyalty platform for cafes, restaurants, and retail stores with subscription plans and pay-as-you-go wallet credits.",
  keywords: [
    "QR loyalty system",
    "white label gamification",
    "cafe loyalty rewards",
    "restaurant QR games",
    "spin the wheel customer loyalty",
    "pay as you go QR marketing",
  ],
  openGraph: {
    title: "ForStore | Gamified Loyalty & White-Label QR Engine",
    description: "Engage cafe customers with instant QR mini-games under your own brand.",
    url: "https://forstore.app",
    siteName: "ForStore SaaS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ForStore | White-Label QR Loyalty SaaS",
    description: "Custom branded QR minigames & pay-as-you-go customer loyalty for local stores.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F6F3EB] text-[#1A1A1A] font-sans">
        {children}
      </body>
    </html>
  );
}
