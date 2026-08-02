import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForStore Admin - Manage Gamified Loyalty",
  description: "Configure and manage games, rewards, and QR scans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#F6F3EB] text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
