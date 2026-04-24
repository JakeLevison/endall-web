# Threat Model: PR #21 - `feature/subdomain-routing`

**Audit date:** 2026-04-23
**Reviewer:** security-auditor (read-only)
**Branch reviewed:** `feature/subdomain-routing` @ `6cb7b11`
**Base:** `main`
**Scope:** Tenant subdomain routing infrastructure (middleware + `(tenant)` route group + `parseTenantSlug` helper).

## Summary

PR #21 introduces per-tenant subdomain routing (`{slug}.endall.app`) by adding an early branch in `src/middleware.ts` that parses the Host header, validates the slug against a strict kebab-case regex + reserved-word list, and rewrites requests into the new `(tenant)` route group with an `x-tenant-slug` request header. The design is conservative: no DB lookup in middleware, tight slug validation, non-tenant paths on subdomains 404 to a neutral page, and the `(tenant)` route stubs only render placeholder content. The threat surface introduced here is primarily about **trust of the `x-tenant-slug` header downstream** and **one information-leak edge case on bare `endall.app`**. No critical or high findings; one medium (forward-looking) and several low/informational findings. See table.

## Findings table

| # | Severity | Title |
|---|----------|-------|
| 1 | Medium | `x-tenant-slug` on `endall.ai`/`endall.app` is not sanitized; trust boundary is implicit, not enforced |
| 2 | Low | `(tenant)` route group URLs are reachable on the marketing domain (gated only by auth) |
| 3 | Low | `endall.app` apex falls through to the contractor auth pipeline |
| 4 | Low | Reserved-subdomain list is incomplete (missing mail/auth/sso/status/etc.) |
| 5 | Low | `xn--*` (Punycode / IDN) slugs are accepted by the regex |
| 6 | Low | Static assets and `/_next` on tenant subdomains serve the marketing bundle (branding/info leak, not privilege) |
| 7 | Informational | Middleware is fail-closed on parser errors (good); documented here for completeness |
| 8 | Informational | DoS/enumeration surface on tenant-slug guessing is minimal today but grows with E3 |
| 9 | Informational | Local-dev Host-header spoof bypass (Vercel production is not affected) |

**BLOCKER:** None. No critical or high-severity findings.

---

## 1. Middleware input trust model

The new code (`src/middleware.ts:45-71`) trusts exactly one thing as input: `request.headers.get("host")`. On Vercel production this header is set by the edge network to the configured public hostname (Vercel rejects requests whose Host does not match a configured project domain before routing to the function), so it is not client-controlled end-to-end. Locally it is fully client-controlled.

`X-Forwarded-Host` is not read anywhere in the repo (confirmed via `grep -rn "X-Forwarded-Host" src/`), so host-header-vs-forwarded-host confusion is not exploitable.

The middleware does **not** strip any inbound `x-tenant-slug` header from the request. On the tenant branch it calls `new Headers(request.headers)` (copies incoming) then `.set("x-tenant-slug", tenantSlug)` (overwrites) - `set` is destructive, so the attacker-supplied value is replaced. That is correct.

On the non-tenant branch (`endall.ai` / `endall.app` apex), the middleware does **not** call `.set("x-tenant-slug", …)` and does **not** call `.delete("x-tenant-slug", …)`. The incoming value, if any, passes through untouched. See finding #1.

## 2. Validation performed before any lookup

`parseTenantSlug` (`src/lib/subdomain.ts:36-57`) does:

1. Strip port (`split(":")[0]`).
2. Lowercase + trim.
3. Reject `endall.ai`, `*.endall.ai`, `endall.app`, and any host that does not end in `.endall.app`.
4. Slice the slug prefix.
5. Reject empty, any slug containing a `.`, any slug in the reserved set, or any slug that fails the regex `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`.

Validation is tight and happens before any use. No DB query runs in middleware; `(tenant)` route handlers are responsible for resolving slug → tenant and calling `notFound()` on miss (documented intent, `docs/infra/subdomain-routing.md:59-61`; not yet exercised because stubs don't do DB lookups).

I confirmed the regex with the inputs in the question prompt:

- SQL payloads (`' OR 1=1 --`, `robert'); DROP TABLE…`): rejected - contain spaces, quotes, semicolons that fail the `[a-z0-9-]` class.
- Path-traversal (`../`, `%2e%2e`): rejected - contain `.` or `%`.
- Null bytes (`\x00`): rejected.
- RTL unicode / emoji: rejected - regex is ASCII-only.
- Very long strings (>63 chars): rejected by the `{0,61}` quantifier.
- Punycode (`xn--acme`): **accepted** - regex allows consecutive hyphens. See finding #5.

## 3. Downstream consumers of `x-tenant-slug`

Grep (`grep -rn "x-tenant-slug" src/`) returns exactly one non-doc consumer today: `src/app/(tenant)/layout.tsx:27`, which reads the slug and renders it in the page header. React's default JSX escaping protects against XSS. No API route, no RPC handler, no DB query currently trusts `x-tenant-slug`. That makes the **blast radius of header spoofing small today** but the next slice (Estimator E3) is documented to wire real tenant lookups off this header, so the trust boundary must be enforced before E3 ships. See finding #1.

## 4. Cookie scoping

No cookie is set on the tenant-subdomain branch. The existing `tenant_id` cookie (unchanged from main) is set only on the contractor path and has no explicit `Domain` attribute, so it defaults to the request host - the cookie set from `endall.ai` goes to `endall.ai` only, and does not leak to `*.endall.app` (different eTLD+1; browsers scope by default).

Supabase auth cookies are scoped to `endall.ai` by Supabase's default. They are not sent to `*.endall.app` requests. A contractor session cannot cross into a tenant subdomain request as authenticated identity. Good.

---

## Findings

### Finding 1 - `x-tenant-slug` on marketing domain is not sanitized before forwarding

**Severity:** Medium.

**Location:** `src/middleware.ts:55` (tenant branch - fine), `src/middleware.ts:146-148` (non-tenant branch - missing strip).

**Reproduction:**

```
curl -s https://endall.ai/approve/abcdefghijklmnop \
  -H 'x-tenant-slug: victim-tenant' \
  -H 'Cookie: <valid contractor session>'
```

Trace through the middleware:

1. `parseTenantSlug("endall.ai") → null`, tenant branch skipped.
2. Path `/approve/abcdefghijklmnop` is not in `isPublicRoute` (line 100), so the protected-route path runs.
3. Authenticated contractor passes `supabase.auth.getUser()`, tenant membership lookup succeeds.
4. `const headers = new Headers(request.headers)` (line 146) **preserves the attacker-supplied `x-tenant-slug: victim-tenant`**; the middleware only `.set("x-tenant-id", …)` - it does not `.delete("x-tenant-slug", …)`.
5. Request reaches `src/app/(tenant)/approve/[token]/page.tsx` and `src/app/(tenant)/layout.tsx` reads `hdrs.get("x-tenant-slug")` → `victim-tenant`.

**Impact today:** Low - only the string is rendered in the page header, React-escaped. No DB lookup uses it.

**Impact after Estimator Slice E3:** High. The documented intent (`docs/infra/subdomain-routing.md:59-61`) is that route handlers will resolve slug → tenant via DB and render the approval/invoice flow. If E3 trusts the `x-tenant-slug` header verbatim, an authenticated contractor on `endall.ai/approve/<any-token-they-guess-or-steal>` can target a different tenant's approval context. That is cross-tenant data exposure.

**Recommended fix:**

Enforce that `x-tenant-slug` is set only by the middleware on the tenant-subdomain branch, nowhere else. Two concrete options (pick one, do both if cheap):

1. **Strip on entry, always.** Add at the top of the middleware, before any branching:

   ```ts
   // src/middleware.ts, right after `const { pathname, searchParams } = request.nextUrl;`
   const requestHeaders = new Headers(request.headers);
   requestHeaders.delete("x-tenant-slug");
   requestHeaders.delete("x-tenant-id"); // same concern: only middleware should set this
   ```

   Then use `requestHeaders` as the base for both branches' `new Headers(...)` calls. This is the defense-in-depth fix - applies whether or not a downstream handler later trusts the header.

2. **Refuse `(tenant)` route group on non-tenant hosts.** Add an explicit block in the non-tenant branch that 404s `/approve`, `/invoice`, `/tech` paths when the host does not resolve to a tenant:

   ```ts
   // src/middleware.ts, after `if (tenantSlug) { … return … }`
   if (TENANT_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
     return new NextResponse(null, { status: 404 });
   }
   ```

   This also closes finding #2.

Both should be in the same commit that merges this PR or in an immediate follow-up before E3 ships.

---

### Finding 2 - `(tenant)` route group is reachable from the marketing domain

**Severity:** Low.

**Location:** `src/app/(tenant)/approve/[token]/page.tsx`, `src/app/(tenant)/invoice/[token]/page.tsx`, `src/app/(tenant)/tenant-not-found/page.tsx`.

**Reproduction:** An authenticated contractor requests `https://endall.ai/approve/sixteencharstoken` or `https://endall.ai/tenant-not-found`. Next.js route groups (`(tenant)`) do not segment URLs - the URL `/approve/[token]` resolves regardless of host. The middleware does not 404 these paths on `endall.ai`; it runs them through the standard protected-route pipeline, so any logged-in contractor sees them.

**Impact:** Low today (stub pages, no data). Combined with finding #1, this is the surface area that makes `x-tenant-slug` spoofing useful. After E3, this becomes the attack path for cross-tenant data access from within the contractor surface.

**Recommended fix:** Option 2 from finding #1 - 404 `TENANT_PATH_PREFIXES` paths on the non-tenant branch. Fix in `src/middleware.ts`, insert between line 71 (end of tenant branch) and line 73 (start of Supabase client). One commit can address both findings #1 and #2.

---

### Finding 3 - `endall.app` apex falls through to the contractor auth pipeline

**Severity:** Low.

**Location:** `src/lib/subdomain.ts:42`; `src/middleware.ts:45-71`.

**Reproduction:** `parseTenantSlug("endall.app") → null`. The middleware then runs the full marketing/contractor pipeline. A logged-out visitor to `endall.app/` hits the marketing home; a logged-in contractor lands on `/dispatch`. A request to `endall.app/dispatch` behaves identically to `endall.ai/dispatch`.

**Impact:** SEO + brand: `endall.app` will serve the full Endall marketing site and the contractor console, which contradicts the doc's statement that `endall.app` apex "falls through to marketing" (the intent in `docs/infra/subdomain-routing.md:27-29` is marketing, not the contractor console). Also creates duplicate content indexed by search engines on both domains.

**Recommended fix:** Two options, pick one:

1. Redirect `endall.app` apex to `endall.ai` in `src/middleware.ts`, early branch:

   ```ts
   // before the tenantSlug parse
   const rawHost = (request.headers.get("host") || "").split(":")[0].toLowerCase();
   if (rawHost === "endall.app") {
     return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, "https://endall.ai"), 308);
   }
   ```

2. Configure the redirect at the Vercel domain level instead (simpler). Document the decision in `docs/infra/subdomain-routing.md:27-29` so the next reader knows which layer owns it.

Needs verification with Jake - which domain-layer approach he wants.

---

### Finding 4 - Reserved-subdomain list is incomplete

**Severity:** Low.

**Location:** `src/lib/subdomain.ts:21-30`.

Current reserved set: `www`, `api`, `admin`, `app`, `staging`, `dev`, `preview`, `localhost`.

Notable gaps that commonly appear in phishing / takeover patterns: `mail`, `smtp`, `imap`, `ftp`, `ns`, `ns1`, `ns2`, `mx`, `auth`, `login`, `oauth`, `sso`, `status`, `docs`, `support`, `help`, `blog`, `cdn`, `static`, `assets`, `media`, `images`, `img`, `files`, `download`, `secure`, `vpn`, `portal`, `internal`, `test`, `qa`, `beta`, `demo`, `sandbox`.

**Impact:** A tenant that registers slug `mail`, `support`, or `login` could host a page at (e.g.) `login.endall.app` and use it for phishing against your users, who might conflate it with a legit Endall auth page. Low because it requires either self-service tenant creation (which per memory is gated / only a handful of tenants exist today) or operator error.

**Recommended fix:** Expand `RESERVED_SUBDOMAINS` in `src/lib/subdomain.ts:21-30` to include at least: `mail`, `smtp`, `imap`, `ftp`, `auth`, `login`, `oauth`, `sso`, `status`, `docs`, `support`, `help`, `blog`, `cdn`, `static`, `assets`, `media`, `img`, `images`, `files`, `download`, `secure`, `vpn`, `portal`, `internal`, `test`, `qa`, `beta`, `demo`, `sandbox`, `ns`, `ns1`, `ns2`, `mx`. Add a test asserting a representative subset returns null.

---

### Finding 5 - Punycode / IDN slugs are accepted

**Severity:** Low.

**Location:** `src/lib/subdomain.ts:34` (regex).

The regex `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$` accepts `xn--acme` and other Punycode-prefixed slugs (verified with `node -e`). This is benign unless an attacker gets a tenant record provisioned with a Punycode slug that visually resembles a trusted brand (`xn--endll-…` rendered as `endàll`). Exploitation requires tenant-creation privilege, which is gated today.

**Impact:** Homograph phishing on the tenant surface if provisioning is ever opened up.

**Recommended fix:** At tenant-slug provisioning time (not in middleware - the middleware is deliberately pattern-only), reject slugs starting with `xn--`. Add a DB-level check constraint on the `tenants.slug` column, or validate in the provisioning endpoint. Out of scope for this PR if provisioning lives elsewhere - file a follow-up on the Estimator E3 or tenant-onboarding slice that owns `tenants` creation. Track as a Low follow-up.

---

### Finding 6 - Static assets and `/_next` leak the marketing bundle to tenant subdomains

**Severity:** Low.

**Location:** `src/middleware.ts:175` (matcher excludes static assets); `src/middleware.ts:64` (`!pathname.startsWith("/_next")` skips rewrite inside the tenant branch).

**Reproduction:** `curl https://acme.endall.app/favicon.ico` returns the Endall favicon. `curl https://acme.endall.app/_next/static/chunks/main-<hash>.js` returns the shared JS bundle. These bypass middleware via the matcher exclusion.

**Impact:** Contradicts the "zero Endall branding on tenant routes" goal (`docs/infra/subdomain-routing.md:10-14`). Bundle analysis could fingerprint internal routes. No privilege boundary crossed.

**Recommended fix:** Two options:

1. Accept the leak for R2-7 and document it in `docs/infra/subdomain-routing.md`. Plan per-tenant favicons + minimal JS bundle for the `(tenant)` route group as part of the future brand-color/logo slice.
2. Serve a neutral `favicon.ico` for all requests where `Host` resolves to a tenant subdomain - this requires a `rewrites()` in `next.config.ts` or a route-level handler for `/favicon.ico`. Heavier lift.

Option 1 is appropriate for R2-7. File as a Low follow-up against the brand-asset slice.

---

### Finding 7 - Fail-closed behavior on parser errors (informational)

**Severity:** Informational.

`parseTenantSlug` returns `null` on every failure mode (empty host, non-`endall.app`, reserved slug, regex miss). A `null` return drops through to the contractor auth pipeline. On a request whose Host is a syntactically valid tenant subdomain but whose slug doesn't exist in the DB, the middleware lets the request through with `x-tenant-slug` set; the route handler is expected to 404 via `notFound()` (not yet implemented - stubs check token length only). This is **fail-closed from the middleware's perspective** (no secret/data exposure on a bogus slug today), but it becomes **fail-open from the user's perspective** if a future route handler forgets to resolve the slug and renders generic content.

**Recommended fix:** None for this PR. When E3 wires the DB resolution, require every `(tenant)` route handler to call a shared helper (`getTenantOrNotFound(slug)`) that resolves slug → tenant and returns `notFound()` on miss. Enforce via lint or code review, not just convention.

---

### Finding 8 - DoS / enumeration surface (informational)

**Severity:** Informational.

Middleware does no DB work for tenant subdomains, so a guessing attack (`aaa.endall.app`, `aab.endall.app`, …) is cheap to serve - each request returns the `/tenant-not-found` page for any path other than `/approve`, `/invoice`, `/tech`. For tenant paths, the stub pages return static content. Vercel's per-deployment DDoS protection is the only rate-limit layer today.

**Impact:** Low. No data leak, no amplification. Once E3 wires DB lookups for slug resolution, each unique slug triggers a DB read - then rate limiting becomes relevant.

**Recommended fix:** Defer. When E3 adds the DB lookup, add a short-TTL cache (doc already suggests Vercel Edge Config, `docs/infra/subdomain-routing.md:94-97`) and a negative-cache entry for 404s.

---

### Finding 9 - Local-dev Host-header spoof (informational)

**Severity:** Informational.

On `localhost:3000`, `curl -H 'Host: acme.endall.app'` triggers the tenant branch. This is expected and useful for dev, but means local dev servers have no effective host validation. On Vercel production, the Host header is normalized by the edge before reaching the function, so the matcher is effectively `domain ∈ Vercel-configured-domains`.

**Recommended fix:** None. Informational.

---

## Merge recommendation

**Recommend merge with low-severity follow-ups.** The PR is safe to ship for R2-7 as-is because:

- No downstream handler trusts `x-tenant-slug` for data access today - the only consumer is a layout that renders the slug as React-escaped text.
- Host-header spoofing is not exploitable on Vercel production.
- Slug validation is tight and the fail-closed default is correct.
- No cookies cross the `endall.ai` ↔ `endall.app` boundary.

**Before Estimator Slice E3 merges**, finding #1 (middleware strips `x-tenant-slug` on all non-tenant-subdomain branches) **must** be fixed. Track as a blocker on E3, not on this PR. Findings #2, #3, and #4 should land as part of the same follow-up commit. Findings #5, #6, #7, #8, #9 are tracked as Low / Informational and can ship independently.

## Out of scope

- Estimator E3 token generation / validation (deferred slice).
- Tenant provisioning flow, `tenants` table schema, `tenant_brand_color` / `tenant_logo_url` columns (not in this PR).
- Supabase RLS policies on `tenants` and `tenant_members` (unchanged by this PR).
- Wildcard SSL issuance latency (platform concern; flagged in `docs/infra/subdomain-routing.md:91-93`).
- DNS configuration at the registrar (operator task per the doc).
