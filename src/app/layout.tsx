import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Endall — The AI Operating System for Your Business",
  description:
    "CRM, email automation, task management, and AI agents — all in one platform. Built for SMBs who want enterprise tools without enterprise complexity.",
  openGraph: {
    title: "Endall — The AI Operating System for Your Business",
    description:
      "CRM, email automation, task management, and AI agents — all in one platform.",
    url: "https://endall.ai",
    siteName: "Endall",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Endall",
    description:
      "CRM, email automation, task management, and AI agents — all in one platform.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
