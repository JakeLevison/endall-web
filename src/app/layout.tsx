import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "endall — The AI Operating System for Service Companies",
  description:
    "CRM, scheduling, and sales automation that runs itself. One platform for HVAC, plumbing, electrical, and mechanical contractors.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "endall — The AI Operating System for Service Companies",
    description:
      "CRM, scheduling, and sales automation that runs itself. Built for service companies.",
    url: "https://endall.ai",
    siteName: "endall",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "endall",
    description:
      "CRM, scheduling, and sales automation that runs itself. Built for service companies.",
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
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
