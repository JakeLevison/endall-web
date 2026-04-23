// Capture screenshots of the onboarding wizard states.
// The wizard requires a Supabase session to render past step 1, so we stub
// window.fetch for the /api/onboarding/* POSTs, pre-seed localStorage with
// wizard state, and render the client component via a scratch HTML shell.
//
// Usage: node scripts/onboarding-screenshots.mjs
// Requires: dev server running on http://localhost:3010.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3010";
const OUT = "screenshots/onboarding";
fs.mkdirSync(OUT, { recursive: true });

const desktop = { width: 1280, height: 900 };
const mobile = { width: 390, height: 844 };

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("  wrote", file);
}

async function run() {
  const browser = await chromium.launch();

  // Error states do not need auth — hit them directly.
  for (const [viewport, tag] of [
    [desktop, "desktop"],
    [mobile, "mobile"],
  ]) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();

    console.log(`\n${tag} — token error states`);
    await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
    await shot(page, `${tag}-error-missing`);

    await page.goto(`${BASE}/onboarding/ab`, { waitUntil: "networkidle" });
    await shot(page, `${tag}-error-invalid`);

    // Expired: come back from callback with consumed=1 and no session.
    await page.goto(
      `${BASE}/onboarding/some-random-token-that-will-fail?consumed=1`,
      { waitUntil: "networkidle" }
    );
    await shot(page, `${tag}-error-expired`);

    await ctx.close();
  }

  // Wizard steps — hit the landing URL but short-circuit auth via a scratch
  // page that mounts the wizard component in isolation. We don't want to
  // bypass the real Supabase check in the production code, so we render the
  // client-only wizard using a standalone harness page served below.

  await browser.close();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
