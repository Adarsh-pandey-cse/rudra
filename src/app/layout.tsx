import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rudra | Master Learning. Every Day.",
  description: "AI Academic Operating System — Plan, execute, track, and master your learning journey.",
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
