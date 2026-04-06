"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Forces every page load and client-side navigation to start at the top.
 *
 * 1. Sets scrollRestoration to "manual" so refreshes don't restore mid-page.
 * 2. Scrolls to top on initial mount.
 * 3. Scrolls to top on every pathname change (covers router.push, Link, etc.).
 */
export default function ScrollRestoration() {
  const pathname = usePathname();

  // Set manual scroll restoration once
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* older browsers: ignore */
    }
  }, []);

  // Scroll to top on every route change (including initial mount)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
