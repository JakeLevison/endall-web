import { test, expect, type Cookie } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import fs from "node:fs";
import path from "node:path";

/**
 * Authenticated smoke against the Cornerstone tenant.
 *
 * Mints a single-use Supabase session per spec run via
 * auth.admin.generateLink + verifyOtp, plants the resulting tokens
 * as non-HttpOnly cookies (createBrowserClient must read them via
 * document.cookie, so HttpOnly breaks /contacts/[id] and dashboard
 * widget reads), then drives /dashboard, /contacts, and
 * /contacts/[id] expecting real data to render.
 *
 * Why this test exists: a curl-only smoke returns HTTP 200 on all
 * three routes even when every data layer is broken, because the
 * pages render their shell server-side and fetch on the client.
 * This spec is the floor that catches a silent zeros-everywhere
 * regression.
 *
 * Never runs in CI — the auth path requires SUPABASE_SERVICE_ROLE_KEY
 * and authenticates as a real human user against production Supabase.
 */

// ---------- env loading (no dotenv dep) ----------
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Defaults target the Cornerstone seed used by Jake's working
// environment. Override via env to point at a different tenant or
// seeded contact without touching this file.
const SMOKE_EMAIL = process.env.SMOKE_USER_EMAIL ?? "levison1995@gmail.com";
const SMOKE_TENANT =
  process.env.SMOKE_TENANT_ID ?? "109d88ca-983a-4bfd-9e79-c64061fd0727";
const SMOKE_CONTACT_ID =
  process.env.SMOKE_CONTACT_ID ?? "251ee669-255c-5c7c-a356-6518b413c997";
const SMOKE_CONTACT_FIRST = process.env.SMOKE_CONTACT_FIRST ?? "Kerry";
const SMOKE_CONTACT_LAST = process.env.SMOKE_CONTACT_LAST ?? "Donahue";
const SMOKE_CONTACT_EMAIL =
  process.env.SMOKE_CONTACT_EMAIL ?? "kdonahue@lcps.org";

function projectRefFromUrl(url: string): string {
  // https://<ref>.supabase.co -> <ref>
  return new URL(url).hostname.split(".")[0];
}

test.describe("Cornerstone authed smoke", () => {
  test.skip(
    !SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE,
    "requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (set in .env.local for local runs)",
  );
  test.skip(
    !!process.env.CI,
    "authenticates as a real production user — must not run in CI",
  );
  let authCookies: Cookie[];

  test.beforeAll(async () => {
    // Mobile viewports run a different responsive layout that hides the
    // right-rail "Associated" sections and rearranges filter chips —
    // the smoke would be asserting against the wrong UI. Restrict the
    // whole describe to the desktop chromium project. Running the skip
    // here (not in beforeEach) avoids spinning up webkit/Pixel-5 just
    // to be turned away.
    if (test.info().project.name !== "chromium") {
      test.skip();
    }

    const admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const gen = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: SMOKE_EMAIL,
    });
    if (gen.error) throw new Error(`generateLink failed: ${gen.error.message}`);
    const hashedToken = gen.data?.properties?.hashed_token;
    if (!hashedToken) {
      throw new Error("no hashed_token in generateLink response");
    }

    const anon = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const v = await anon.auth.verifyOtp({
      token_hash: hashedToken,
      type: "magiclink",
    });
    if (v.error) throw new Error(`verifyOtp failed: ${v.error.message}`);
    const sess = v.data?.session;
    if (!sess?.access_token || !sess?.refresh_token) {
      throw new Error("verifyOtp returned no session");
    }

    const cookieKey = `sb-${projectRefFromUrl(SUPABASE_URL!)}-auth-token`;
    const encoded = "base64-" + stringToBase64URL(JSON.stringify(sess));
    const chunks = createChunks(cookieKey, encoded);

    authCookies = chunks.map(({ name, value }) => ({
      name,
      value,
      domain: "localhost",
      path: "/",
      // createBrowserClient reads via document.cookie — HttpOnly hides
      // the session from the client and breaks /contacts/[id] +
      // dashboard widget reads.
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
      expires: sess.expires_at!,
    }));
  });

  test.beforeEach(async ({ context }) => {
    await context.addCookies(authCookies);
  });

  test("/dashboard renders Cornerstone KPIs and widgets", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait until both KPI label and a Recent widget label are present,
    // loading state has cleared, and TOTAL CONTACTS shows a numeric value.
    await page.waitForFunction(
      () => {
        const t = document.body.innerText;
        if (!/Recent Contacts/i.test(t)) return false;
        if (!/Recent Companies/i.test(t)) return false;
        if (/Loading…|Loading\.\.\./i.test(t)) return false;
        const kpi = t.match(
          /TOTAL CONTACTS\s+(\d+)[\s\S]+OPEN DEALS\s+(\d+)[\s\S]+PIPELINE VALUE\s+\$([\d.,KMB]+)/i,
        );
        return Boolean(kpi);
      },
      undefined,
      { timeout: 20_000 },
    );

    const body = await page.evaluate(() => document.body.innerText);

    // KPI grid populated with non-trivial values for a seeded tenant
    const totalMatch = body.match(/TOTAL CONTACTS\s+(\d+)/i);
    const openDealsMatch = body.match(/OPEN DEALS\s+(\d+)/i);
    expect(totalMatch, "TOTAL CONTACTS KPI missing").not.toBeNull();
    expect(openDealsMatch, "OPEN DEALS KPI missing").not.toBeNull();
    expect(Number(totalMatch![1])).toBeGreaterThan(0);
    expect(Number(openDealsMatch![1])).toBeGreaterThan(0);
    expect(body).toMatch(/PIPELINE VALUE\s+\$[\d.,KMB]+/i);

    // Recent widgets populated (not empty-state strings)
    expect(body).not.toMatch(/No contacts yet/i);
    expect(body).not.toMatch(/No companies yet/i);
    expect(body).toContain("Recent Estimates");
    expect(body).toContain("Pipeline");
  });

  test("/contacts renders the unified list", async ({ page }) => {
    await page.goto("/contacts");

    await page.waitForFunction(
      (first) =>
        new RegExp(first, "i").test(document.body.innerText),
      SMOKE_CONTACT_FIRST,
      { timeout: 15_000 },
    );

    const body = await page.evaluate(() => document.body.innerText);

    // Counter is `<n> of <m> contacts` — both numbers should be > 0
    const counter = body.match(/(\d+)\s+of\s+(\d+)\s+contacts?/i);
    expect(counter, "contact counter missing").not.toBeNull();
    expect(Number(counter![1])).toBeGreaterThan(0);
    expect(Number(counter![2])).toBeGreaterThan(0);

    // Seeded contact name renders in the list
    expect(body).toMatch(new RegExp(SMOKE_CONTACT_FIRST, "i"));
    expect(body).toMatch(new RegExp(SMOKE_CONTACT_LAST, "i"));

    // Source filter chips are present in the page text
    for (const tab of ["All", "Voice", "Outreach"]) {
      expect(body).toMatch(new RegExp(`\\b${tab}\\b`));
    }
  });

  test("/contacts/[id] renders the detail page with real data", async ({
    page,
  }) => {
    await page.goto(`/contacts/${SMOKE_CONTACT_ID}`);

    await page.waitForFunction(
      ({ first, last }) => {
        const t = document.body.innerText;
        const name = new RegExp(`${first}\\s+${last}`, "i");
        const notFound = /Contact not found/i.test(t);
        return name.test(t) || notFound;
      },
      { first: SMOKE_CONTACT_FIRST, last: SMOKE_CONTACT_LAST },
      { timeout: 15_000 },
    );

    const body = await page.evaluate(() => document.body.innerText);

    // Detail page should NOT show the not-found state — fail loudly if it does
    expect(body, "detail page rendered not-found state").not.toMatch(
      /Contact not found/i,
    );

    // Header + key fields populated from Supabase via createBrowserClient
    expect(body).toMatch(
      new RegExp(`${SMOKE_CONTACT_FIRST}\\s+${SMOKE_CONTACT_LAST}`, "i"),
    );
    expect(body).toContain(SMOKE_CONTACT_EMAIL);

    // Associated sections present (Companies / Deals / Estimates)
    for (const section of ["Companies", "Deals", "Estimates"]) {
      expect(body).toContain(section);
    }
  });
});
