import type { Metadata } from "next";
import { EB_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
      className={`${ebGaramond.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
