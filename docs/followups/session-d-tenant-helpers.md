# Session D follow-up: unify tenant resolution helpers

## What shipped in Session D
- `src/lib/tenant-hook.ts` — new `useTenant()` client hook (reads Supabase session, queries `tenant_members`, fires PostHog `tenant.multi_membership_detected` breadcrumb once per browser session).
- `src/lib/tenant-server.ts` — new `resolveTenantFromSession()` + `tenantUnresolvedResponse()` for authenticated API routes.
- `src/lib/tenant.ts` — pre-existing `getTenantIdFromCookie()` helper. Still exported. Middleware still writes the `tenant_id` cookie, so the helper continues to work.

## Why they coexist post-Session-D
- `useTenant()` is the source of truth for session-derived tenant resolution. Every client page we touched in Refactor 1 uses it.
- `getTenantIdFromCookie()` is no longer called anywhere after this PR (we migrated the one caller, `src/app/settings/integrations/page.tsx`, to `useTenant()`).
- We left the cookie helper in place rather than deleting it because a full audit of the cookie lifecycle (middleware write, client read, stale-cookie handling across tenant switches) is Session E territory and we did not want to expand scope.

## Session E action item
- Delete `src/lib/tenant.ts` and stop writing `tenant_id` as a client-readable cookie in `src/middleware.ts`, OR
- Formalize the cookie as an optimization layer (e.g., `useTenant()` reads the cookie synchronously on first render and revalidates against the session) and document why both paths exist.

Pick one. Do not ship the multi-tenant selector UI on top of the current two-helper state without making this decision first, or the selector will have to write to both places.

## Related
- Bridge: 15 "remove fallback once Session D completes" TODOs in chief-of-staff still stand. Their removal is gated on telemetry observation, per the Session D brief.
