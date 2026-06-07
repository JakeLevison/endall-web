import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ScrollRestoration from "@/components/shared/ScrollRestoration";
import PostHogProvider from "@/components/providers/PostHogProvider";
import "./globals.css";

const TITLE = "Endall: AI Ops Team for MEP Contractors";
const DESCRIPTION =
  "Call answering, estimates, proposals, competitive intelligence, and daily ops briefings. One AI ops team for MEP contractors.";

export const metadata: Metadata = {
  metadataBase: new URL("https://endall.ai"),
  title: TITLE,
  description: DESCRIPTION,
  // favicon.ico is wired automatically by the app/favicon.ico file convention.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://endall.ai",
    siteName: "Endall",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Endall: AI Ops Team for MEP Contractors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
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
        <PostHogProvider>
          <ThemeProvider>
            <ScrollRestoration />
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
