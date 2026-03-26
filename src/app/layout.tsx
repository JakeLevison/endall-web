import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Endall AI — The AI Operating System for Your Business",
  description: "CRM, email automation, task management, and AI agents — all in one platform. Built for SMBs who want enterprise tools without enterprise complexity.",
  openGraph: {
    title: "Endall AI — The AI Operating System for Your Business",
    description: "CRM, email automation, task management, and AI agents — all in one platform.",
    url: "https://endall.ai",
    siteName: "Endall AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Endall AI",
    description: "CRM, email automation, task management, and AI agents — all in one platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
