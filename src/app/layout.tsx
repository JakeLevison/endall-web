import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
