import type { ReactNode } from "react";
import { headers } from "next/headers";

/**
 * Tenant-branded layout for customer-facing pages served on
 * {tenant_slug}.endall.app subdomains.
 *
 * Strict no-Endall-branding rule (R2-7): this layout renders zero
 * "Endall" or "powered by Endall" marks. The contractor's own name,
 * logo (once a future slice adds tenant_brand_color and tenant_logo_url
 * columns), and contact info are the only branded elements.
 *
 * Tenant resolution from the x-tenant-slug header is deferred to the
 * route handlers. This layout only renders chrome.
 */

export const metadata = {
  title: "Customer portal",
};

export default async function TenantLayout({
  children,
}: {
  children: ReactNode;
}) {
  const hdrs = await headers();
  const slug = hdrs.get("x-tenant-slug") || "";

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <span style={{ fontSize: "15px", fontWeight: 500, color: "#1f1f1f" }}>
            {slug}
          </span>
        </div>
      </header>
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}
