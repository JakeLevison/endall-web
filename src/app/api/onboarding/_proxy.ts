import { NextResponse, type NextRequest } from "next/server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

type Method = "POST" | "PATCH";

type Options = {
  method: Method;
  // pathTemplate must contain the literal "{tenant_id}" sentinel; the
  // proxy substitutes it with the value pulled out of the request body.
  pathTemplate: string;
  // Identifier used in error logs only.
  step: string;
};

// Forward an onboarding-step request to the chief-of-staff bridge.
//
// Contract:
//   - Bearer token is read from the incoming Authorization header and
//     forwarded verbatim. The bridge owns invite-token validation
//     (deploy/ask-endall-bridge/onboarding/auth.py).
//   - tenantId is read from the request body, stripped, and substituted
//     into the bridge URL path. The remaining body is forwarded as-is.
//   - 2xx and 4xx responses pass through unchanged so the wizard can
//     surface validator messages and tenant-scope failures verbatim.
//   - 5xx and network errors collapse to 502 with a clear payload, so
//     the wizard never silently treats a bridge outage as success.
export async function proxyOnboardingStep(
  req: NextRequest,
  opts: Options,
): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (!auth || !/^bearer\s+/i.test(auth)) {
    return NextResponse.json(
      { error: "missing bearer token" },
      { status: 401 },
    );
  }

  const rawBody = await req.text();
  let parsed: Record<string, unknown> = {};
  if (rawBody.length > 0) {
    try {
      const value = JSON.parse(rawBody);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        parsed = value as Record<string, unknown>;
      } else {
        return NextResponse.json(
          { error: "request body must be a JSON object" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "invalid json" },
        { status: 400 },
      );
    }
  }

  const tenantId =
    typeof parsed.tenantId === "string" && parsed.tenantId.length > 0
      ? parsed.tenantId
      : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId required in body" },
      { status: 400 },
    );
  }

  const { tenantId: _drop, ...forwardBody } = parsed;
  void _drop;

  const url = new URL(BRIDGE_URL);
  url.pathname = opts.pathTemplate.replace(
    "{tenant_id}",
    encodeURIComponent(tenantId),
  );

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: opts.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify(forwardBody),
      cache: "no-store",
    });
  } catch (err) {
    console.error(
      `onboarding ${opts.step} proxy bridge unreachable:`,
      err,
    );
    return NextResponse.json(
      { error: "bridge unavailable" },
      { status: 502 },
    );
  }

  if (resp.status >= 500) {
    const detail = await resp.text().catch(() => "");
    console.error(
      `onboarding ${opts.step} proxy bridge ${resp.status}:`,
      detail,
    );
    return NextResponse.json(
      {
        error: "bridge error",
        status: resp.status,
        detail: detail || null,
      },
      { status: 502 },
    );
  }

  const responseText = await resp.text();
  return new NextResponse(responseText, {
    status: resp.status,
    headers: {
      "Content-Type":
        resp.headers.get("content-type") || "application/json",
    },
  });
}
