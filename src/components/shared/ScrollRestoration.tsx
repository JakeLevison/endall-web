"use client";

import { useEffect } from "react";

/**
 * Forces every page load (including hard refresh) to start at the top.
 *
 * The browser's default behavior is `history.scrollRestoration = "auto"`,
 * which restores the last scroll position after refresh. That's usually
 * fine - except on our landing page where a mid-scroll refresh dumps
 * prospects into the accordion or footer instead of the hero.
 *
 * We set it to `"manual"` and jump to 0,0 on first mount. Route changes
 * through Next's `<Link>` already scroll to top on their own.
 */
export default function ScrollRestoration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* older browsers: ignore */
    }
    // Use instant scroll so the user never sees the restored position
    // flash before we jump them to the top.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return null;
}
