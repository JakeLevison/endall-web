import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Token-bearing customer URL. Strip Referer + cache-control + frame-options
        // so the token cannot leak via subresource Referer headers and the page is
        // not embeddable. R2-8b security review H2.
        source: "/approve/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // Same defenses for the public proxy endpoints that the customer
        // page calls. Token is in the path; do not let it leak.
        source: "/api/public/approval/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
