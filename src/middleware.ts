import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/no-tenant"];
const PUBLIC_PREFIXES = [
  "/contact",
  "/demo",
  "/discovery",
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

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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
      return NextResponse.redirect(new URL("/dispatch", request.url));
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
      const headers = new Headers(request.headers);
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
  const headers = new Headers(request.headers);
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
