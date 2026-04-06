# Production URL Audit

Generated: 2026-04-06

## Summary

The codebase follows proper configuration patterns. All non-production URLs are intentional development fallbacks with environment variable overrides. No accidental exposure was found. No Cloudflare tunnel, ngrok, or Vercel preview URLs detected.

---

## Findings

### 1. localhost:8101 — ASK_ENDALL_BRIDGE_URL (Intentional Dev Fallback)

| File | Line | Code |
|------|------|------|
| `src/app/api/chat/route.ts` | 200 | `process.env.ASK_ENDALL_BRIDGE_URL \|\| "http://localhost:8101"` |
| `src/app/api/chat/download/route.ts` | 19 | `process.env.ASK_ENDALL_BRIDGE_URL \|\| "http://localhost:8101"` |
| `src/app/api/settings/company/route.ts` | ~10 | `"http://localhost:8101"` (fallback in bridgeUrl function) |

**Status:** Safe. All guarded by `ASK_ENDALL_BRIDGE_URL` env var. Production should set this to the Railway deployment URL.

**Production value:** `https://ask-endall-bridge-production.up.railway.app` (or via env var)

---

### 2. localhost:8100 — COS_API_URL (Intentional Dev Fallback)

| File | Line | Code |
|------|------|------|
| `src/app/api/calendar/route.ts` | 3 | `process.env.COS_API_URL \|\| "http://localhost:8100"` |
| `src/app/api/gmail/route.ts` | 3 | `process.env.COS_API_URL \|\| "http://localhost:8100"` |
| `src/app/api/sequences/process/route.ts` | 3 | `process.env.COS_API_URL \|\| "http://localhost:8100"` |

**Status:** Safe. All guarded by `COS_API_URL` env var. Production should set this to the Railway chief-of-staff deployment.

**Production value:** Set `COS_API_URL` in Vercel env vars.

---

### 3. Hardcoded Railway URL in Client-Side Code (Review Recommended)

| File | Line | Code |
|------|------|------|
| `src/lib/ops-api.ts` | 9 | `"https://ask-endall-bridge-production.up.railway.app"` |

**Status:** Works correctly but exposes production Railway domain in client bundle. Guarded by `NEXT_PUBLIC_OPS_API_URL` env var as primary source.

**Recommendation:** Set `NEXT_PUBLIC_OPS_API_URL` in Vercel env vars so the hardcoded fallback is never reached in production. Consider removing the hardcoded fallback entirely once env var is confirmed set in all environments.

---

### 4. localhost:3000 — Next.js Dev Server (Test/Docs Only)

| File | Line | Code |
|------|------|------|
| `playwright.config.ts` | 11 | `process.env.BASE_URL \|\| 'http://localhost:3000'` |
| `playwright.config.ts` | 22 | `url: 'http://localhost:3000'` (webServer config) |
| `README.md` | 17 | Documentation reference |

**Status:** Intentional. Standard test/development configuration.

---

## Not Found (Clean)

- No Cloudflare tunnel URLs (`*.trycloudflare.com`)
- No ngrok URLs
- No hardcoded Vercel preview URLs
- No hardcoded webhook URLs (webhook system reads from database)

---

## Required Env Vars for Production (Vercel)

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `ASK_ENDALL_BRIDGE_URL` | Ask Endall Python bridge | `https://ask-endall-bridge-production.up.railway.app` |
| `COS_API_URL` | Chief-of-staff API | `https://<cos-service>.up.railway.app` |
| `NEXT_PUBLIC_OPS_API_URL` | Client-side ops API | `https://ask-endall-bridge-production.up.railway.app` |
