import { NextResponse, type NextRequest } from "next/server";

/**
 * R2-8d OAuth handshake landing page.
 *
 * The bridge 302s here at the end of an OAuth callback with one of:
 *   ?session_id=<sid>&connected=1&provider=...      (success)
 *   ?session_id=<sid>&error=<slug>&provider=...     (post-state error)
 *   ?error=<slug>&provider=...                      (pre-state error)
 *
 * For backwards compatibility during the staged deploy (frontend ships
 * before bridge), this also accepts the legacy R2-8c shape:
 *   ?admin_key=<key>&tenant_id=<id>&connected=1&provider=...
 *   ?admin_key=<key>&error=<slug>&provider=...
 * PR 2 will delete the legacy-shape handler after the new bridge ships.
 *
 * Why this route exists: the OAuth provider redirects the browser
 * directly to the bridge host (Railway). A Set-Cookie returned by the
 * bridge can only scope to the bridge host (RFC 6265 sec 5.3) and so
 * cannot reach endall.ai. This route runs on endall.ai, so its
 * Set-Cookie is endall.ai-scoped and the middleware can read it on
 * subsequent requests to /settings/integrations.
 *
 * The session_id leaks in the URL briefly (browser history, server
 * logs) but is single-use and consumed within ms. Worst-case leak: a
 * token already invalidated by the time anyone reads the URL.
 */

const COOKIE_NAME = "endall_session";
const COOKIE_MAX_AGE = 600;
// Cap the bridge consume call so a hung Railway response cannot stall
// the OAuth landing page indefinitely. 5s is well above the p99
// Supabase round-trip we have measured on the consume path.
const CONSUME_TIMEOUT_MS = 5000;

function bridgeUrl(): string {
  return (
    process.env.ASK_ENDALL_BRIDGE_URL ||
    "https://ask-endall-bridge-production.up.railway.app"
  );
}

function landingUrl(request: NextRequest, params: URLSearchParams): URL {
  const url = new URL("/settings/integrations", request.url);
  for (const [k, v] of params.entries()) {
    url.searchParams.set(k, v);
  }
  return url;
}

function setSessionCookie(
  response: NextResponse,
  admin_key: string,
  tenant_id: string,
) {
  // HttpOnly + Secure + SameSite=Lax + host-only (no Domain attr) so the
  // cookie scopes to whatever endall.ai surface served this response.
  // Value is JSON so the middleware can pull both fields in one read.
  response.cookies.set(
    COOKIE_NAME,
    JSON.stringify({ admin_key, tenant_id }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    },
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sessionId = params.get("session_id") || "";
  const adminKey = params.get("admin_key") || "";
  const tenantId = params.get("tenant_id") || "";
  const connected = params.get("connected") || "";
  const errorParam = params.get("error") || "";
  const provider = params.get("provider") || "";

  // Build the search params that get forwarded to /settings/integrations.
  // admin_key, tenant_id, session_id never propagate - they are absorbed
  // into the cookie or dropped.
  const out = new URLSearchParams();
  if (connected) out.set("connected", connected);
  if (errorParam) out.set("error", errorParam);
  if (provider) out.set("provider", provider);

  // New shape: session_id present. Exchange it for admin_key+tenant_id
  // server-side, set the cookie, redirect.
  if (sessionId) {
    let consumeOk = false;
    let timedOut = false;
    let resolvedKey = "";
    let resolvedTenant = "";
    try {
      const bridgeRes = await fetch(`${bridgeUrl()}/public/oauth/consume-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
        cache: "no-store",
        signal: AbortSignal.timeout(CONSUME_TIMEOUT_MS),
      });
      if (bridgeRes.ok) {
        const body = (await bridgeRes.json()) as {
          admin_key?: string;
          tenant_id?: string;
        };
        if (body.admin_key && body.tenant_id) {
          resolvedKey = body.admin_key;
          resolvedTenant = body.tenant_id;
          consumeOk = true;
        }
      }
    } catch (err) {
      // AbortSignal.timeout fires a DOMException named TimeoutError.
      // Surface that distinctly from session_invalid so the eventual
      // UX on /settings/integrations can show a retry hint instead of
      // implying the user did something wrong. Duck-type on .name so
      // a future runtime swap (Node where DOMException isn't a global
      // in older versions) doesn't bury the timeout signal.
      if ((err as { name?: string } | null)?.name === "TimeoutError") {
        timedOut = true;
      }
      // Other failures (network/parse) fall through to the generic
      // session_invalid path below.
    }

    if (!consumeOk) {
      const errCode = timedOut ? "handshake_timeout" : (out.get("error") || "session_invalid");
      out.set("error", errCode);
      return NextResponse.redirect(landingUrl(request, out), 302);
    }

    const response = NextResponse.redirect(landingUrl(request, out), 302);
    setSessionCookie(response, resolvedKey, resolvedTenant);
    return response;
  }

  // Legacy shape (R2-8c bridge): admin_key + tenant_id directly in URL.
  // Retained for the staged-deploy window where the frontend ships
  // before the bridge starts emitting the new ?session_id= shape. PR 2
  // deletes this branch.
  if (adminKey && tenantId) {
    const response = NextResponse.redirect(landingUrl(request, out), 302);
    setSessionCookie(response, adminKey, tenantId);
    return response;
  }

  // No session, no legacy admin_key - early-stage error or someone hit
  // the route directly. Forward whatever error param is present (or
  // none) and let /settings/integrations handle it.
  return NextResponse.redirect(landingUrl(request, out), 302);
}
