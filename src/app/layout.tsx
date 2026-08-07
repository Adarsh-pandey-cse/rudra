import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rudra | Master Learning. Every Day.",
  description: "Rudra is a modern, personalized learning and classroom management platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rudra",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import Providers from "@/components/Providers";
import SyncStores from "@/components/SyncStores";
import { UploadManager } from "@/components/ui/UploadManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#07111F] text-white font-sans overflow-x-hidden" suppressHydrationWarning>
        <Providers>
          <SyncStores />
          <UploadManager />
          {children}
        </Providers>
      </body>
    </html>
  );
}
