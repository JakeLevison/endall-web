/**
 * Per-tenant subdomain parsing helpers.
 *
 * Subdomain policy: `{tenant_slug}.endall.app` for customer-facing surfaces.
 * The main `endall.ai` domain and `www.endall.ai` stay on the marketing
 * tree. `endall.app` without a subdomain falls through to marketing too.
 *
 * Design intent (2026-04-23, R2-7):
 * - The proxy parses the subdomain from the Host header and, when valid,
 *   rewrites the request to the (tenant) route group by setting a header
 *   that downstream handlers consume.
 * - The proxy does NOT hit the database; it only does pattern validation.
 *   Route handlers perform the DB lookup and render a 404 if the slug
 *   does not resolve to a real tenant.
 */

const TENANT_HOSTNAME_SUFFIX = ".endall.app";

// Slugs that must never route as a tenant, even if they are grammatically
// valid subdomains. Matches reserved marketing / infra subdomains.
const RESERVED_SUBDOMAINS = new Set<string>([
  "www",
  "api",
  "admin",
  "app",
  "staging",
  "dev",
  "preview",
  "localhost",
]);

// Kebab-case slug validator: lowercase letters, digits, hyphens (no
// leading/trailing hyphen, no consecutive hyphens). 1-63 chars.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function parseTenantSlug(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase().trim();

  // Main marketing domain: endall.ai (any subdomain) or endall.app root.
  if (hostname === "endall.ai" || hostname.endsWith(".endall.ai")) return null;
  if (hostname === "endall.app") return null;

  if (!hostname.endsWith(TENANT_HOSTNAME_SUFFIX)) return null;

  const slug = hostname.slice(
    0,
    hostname.length - TENANT_HOSTNAME_SUFFIX.length,
  );

  if (!slug) return null;
  if (slug.includes(".")) return null; // multi-level subdomains not allowed
  if (RESERVED_SUBDOMAINS.has(slug)) return null;
  if (!SLUG_RE.test(slug)) return null;

  return slug;
}

export function isTenantHost(host: string | null | undefined): boolean {
  return parseTenantSlug(host) !== null;
}
