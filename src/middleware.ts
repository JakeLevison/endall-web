import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parseTenantSlug } from "@/lib/subdomain";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/no-tenant"];
// Paths served by the (tenant) route group. Requests on a valid tenant
// subdomain receive x-tenant-slug; requests on the main marketing domain
// never reach these paths because they do not exist outside (tenant).
const TENANT_PATH_PREFIXES = ["/approve", "/invoice", "/tech"];
const PUBLIC_PREFIXES = [
  "/contact",
  "/demo",
  "/discovery",
  "/features",
  "/onboarding",
  "/privacy",
  "/team",
  "/terms",
  "/ask",
];

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    ) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/")
  );
}

function withTenantCookie(response: NextResponse, tenantId: string) {
  response.cookies.set("tenant_id", tenantId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // endall.app apex redirects to endall.ai. The .app domain hosts tenant
  // surfaces at {slug}.endall.app only; the apex falling through to the
  // contractor auth pipeline causes SEO duplicate content and wrong UX.
  // Per PR #21 threat model finding 3
  // (docs/security/pr21-subdomain-routing-threat-model.md). Subdomains of
  // endall.app are unaffected and continue through tenant routing below.
  const rawHost = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (rawHost === "endall.app") {
    // Build the redirect URL with the setter form, not the relative-URL
    // constructor. A pathname like "//evil.com" passed as the relative spec
    // would let the URL parser reinterpret evil.com as the authority and
    // redirect off-domain. The pathname setter normalizes leading "//" and
    // cannot change the host.
    const target = new URL("https://endall.ai");
    target.pathname = pathname;
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }

  // Defense-in-depth: middleware owns x-tenant-slug and x-tenant-id. Strip
  // any client-supplied values up front so no downstream handler can ever
  // observe an attacker-controlled tenant header. The tenant-subdomain
  // branch re-sets x-tenant-slug from the validated host; the contractor
  // branch re-sets x-tenant-id from the Supabase session. Per PR #21
  // threat model: docs/security/pr21-subdomain-routing-threat-model.md
  // finding 1.
  const baseHeaders = new Headers(request.headers);
  baseHeaders.delete("x-tenant-slug");
  baseHeaders.delete("x-tenant-id");

  // Subdomain-first routing. If the Host header resolves to a valid tenant
  // slug, rewrite the request to the (tenant) route group by injecting an
  // x-tenant-slug header and skipping the contractor auth pipeline. All
  // subsequent logic (marketing public routes, Supabase session checks)
  // belongs to the main endall.ai surface only.
  const tenantSlug = parseTenantSlug(request.headers.get("host"));
  if (tenantSlug) {
    const tenantHeaders = new Headers(baseHeaders);
    tenantHeaders.set("x-tenant-slug", tenantSlug);

    // Any path that is not a tenant-facing surface gets a neutral 404
    // redirect to /tenant-not-found. Keeps subdomains from leaking any
    // Endall marketing content.
    const isTenantPath = TENANT_PATH_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
    if (!isTenantPath && pathname !== "/" && !pathname.startsWith("/_next")) {
      const notFoundUrl = request.nextUrl.clone();
      notFoundUrl.pathname = "/tenant-not-found";
      return NextResponse.rewrite(notFoundUrl, { request: { headers: tenantHeaders } });
    }

    return NextResponse.next({ request: { headers: tenantHeaders } });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: baseHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild with stripped tenant headers. request.headers now
          // reflects the rotated Supabase cookies; baseHeaders from the
          // initial snapshot does not. Re-strip each time to stay closed.
          const rotatedHeaders = new Headers(request.headers);
          rotatedHeaders.delete("x-tenant-slug");
          rotatedHeaders.delete("x-tenant-id");
          supabaseResponse = NextResponse.next({ request: { headers: rotatedHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublicRoute(pathname)) {
    if (user && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/invoice-review", request.url));
    }
    return supabaseResponse;
  }

  // --- Protected routes below ---

  // Bypass path: admin_key + tenant_id in URL
  const bypassEnabled = process.env.ADMIN_KEY_BYPASS_ENABLED === "true";
  if (bypassEnabled) {
    const adminKey = searchParams.get("admin_key");
    const tenantId = searchParams.get("tenant_id");
    const expectedKey = process.env.ASK_ENDALL_ADMIN_KEY || "";

    if (adminKey && tenantId && expectedKey && adminKey === expectedKey) {
      const headers = new Headers(baseHeaders);
      headers.set("x-tenant-id", tenantId);
      return withTenantCookie(
        NextResponse.next({ request: { headers } }),
        tenantId
      );
    }
  }

  // Session path
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Tenant lookup via user session (RLS ensures own rows only)
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.redirect(new URL("/no-tenant", request.url));
  }

  // Rebuild response with tenant header for downstream routes
  const headers = new Headers(baseHeaders);
  headers.set("x-tenant-id", membership.tenant_id);
  supabaseResponse = NextResponse.next({ request: { headers } });
  withTenantCookie(supabaseResponse, membership.tenant_id);

  // Re-apply Supabase auth cookies on the rebuilt response
  const supabaseRefresh = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabaseRefresh.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xlsx|docx|pptx|pdf)$).*)",
  ],
};
