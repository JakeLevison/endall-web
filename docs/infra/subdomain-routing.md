# Per-tenant subdomain routing

Customer-facing surfaces live at `{tenant_slug}.endall.app`. The main
marketing site at `endall.ai` is unaffected. This doc captures the DNS,
Vercel, and middleware contract so the flow is reproducible.

## Canonical decision

- Customer-facing surfaces use per-tenant subdomains, never shared
  `endall.ai/approve/*` style paths. Source: `cc-session-prompts-round2.md`
  canonical decisions block, 2026-04-23.
- Zero Endall branding on the tenant routes. The header renders only the
  tenant slug. Tenant logo and brand color land in a follow-up slice when
  the `tenants` table gains `tenant_brand_color` and `tenant_logo_url`.

## DNS configuration (Jake runs these manually)

Add a wildcard A/CNAME record for `*.endall.app`:

```
Type: CNAME
Host: *.endall.app
Target: cname.vercel-dns.com
TTL: 300
```

If the root `endall.app` should fall through to the Endall marketing site,
add a separate A record for the apex pointing at Vercel's apex IPs, or
use an ALIAS/ANAME at your DNS provider.

## Vercel project configuration

Open the `endall-web` project in Vercel and add these domains:

1. `endall.app` (apex) - root marketing fallback
2. `*.endall.app` - tenant wildcard
3. `www.endall.app` → redirects to `endall.ai` (optional, keeps users on
   the canonical marketing domain)

Vercel will issue wildcard SSL automatically once DNS propagates.

## Middleware behavior

File: `src/middleware.ts`, helper: `src/lib/subdomain.ts`.

1. Parse the Host header.
2. Hostname on `endall.ai`, `www.endall.ai`, or `endall.app` (no
   subdomain): fall through to the existing contractor auth pipeline.
3. Hostname matches `{slug}.endall.app`:
   - Validate the slug against the kebab-case regex in
     `lib/subdomain.ts`. Reserved slugs (`www`, `api`, `admin`, etc.) are
     rejected.
   - Set `x-tenant-slug` header on the forwarded request.
   - If the URL path is in `TENANT_PATH_PREFIXES` (`/approve`, `/invoice`,
     `/tech`), continue to the `(tenant)` route group.
   - Otherwise rewrite to `/tenant-not-found` (neutral 404, no Endall
     branding).

No DB query runs in middleware. Route handlers in `(tenant)` perform the
tenant lookup by slug and render `notFound()` if the slug does not
resolve. This keeps middleware fast and avoids per-request Supabase hits.

## Route tree

```
src/app/(tenant)/
  layout.tsx                    # tenant-branded chrome, reads x-tenant-slug
  approve/[token]/page.tsx      # stub for Estimator E3
  invoice/[token]/page.tsx      # stub for invoicing follow-up
  tenant-not-found/page.tsx     # neutral 404
```

All routes under `(tenant)` are public (no Supabase session required).
The `[token]` segments are validated length-wise in each page; the real
token-to-entity resolution ships with the consuming slice (E3 for approval).

## Deployment checklist

1. Merge this PR to `main`. Vercel deploy runs automatically.
2. Verify `/_next/static/*` assets still serve from the marketing domain.
3. Add the DNS records and Vercel domains per the blocks above.
4. Once DNS propagates (5 to 30 minutes): browse to
   `anyslug.endall.app/approve/verylongtoken123456` and confirm the stub
   approval page renders with the slug in the header.
5. Browse to `anyslug.endall.app/` and confirm the neutral
   "Site not found" page renders, not an Endall marketing page.
6. Browse to `endall.ai/` and confirm the marketing flow is unchanged.

## Open questions for Jake

- Wildcard SSL: Vercel issues automatically on the first request to a
  new subdomain; first-request latency is typically 1-3 seconds. Confirm
  this is acceptable for the customer approval flow.
- Tenant-slug lookup cache: middleware currently skips the DB lookup and
  lets route handlers resolve. If customer traffic grows past the first
  cohort of tenants, a short-TTL in-memory cache in a Vercel Edge Config
  may be warranted. Not in scope for R2-7.
