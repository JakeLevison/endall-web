import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ScrollRestoration from "@/components/shared/ScrollRestoration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Endall — AI Ops Team for MEP Contractors",
  description:
    "Financial models, proposals, project estimates, competitive analysis, call answering, and morning briefings. One AI ops team for MEP contractors.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Endall — AI Ops Team for MEP Contractors",
    description:
      "Financial models, proposals, project estimates, and competitive analysis. One AI ops team for MEP contractors.",
    url: "https://endall.ai",
    siteName: "Endall",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Endall",
    description:
      "Financial models, proposals, project estimates, and competitive analysis. One AI ops team for MEP contractors.",
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
      className={`dark ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sans)]">
        <ThemeProvider>
          <ScrollRestoration />
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
