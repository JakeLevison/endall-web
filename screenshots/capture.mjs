import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "redesign");

const BASE = process.env.BASE_URL || "http://localhost:3000";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
];

const pages = [
  { name: "home", path: "/" },
  { name: "demo", path: "/demo" },
  { name: "team", path: "/team" },
  { name: "privacy", path: "/privacy" },
  { name: "terms", path: "/terms" },
];

async function main() {
  const browser = await chromium.launch();

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: "dark",
    });
    // Set session storage to skip logo entrance
    const page = await context.newPage();

    for (const pg of pages) {
      const url = `${BASE}${pg.path}`;
      console.log(`  ${vp.name} / ${pg.name} → ${url}`);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
        // Skip logo entrance
        await page.evaluate(() => sessionStorage.setItem("endall-entrance-seen", "1"));
        if (pg.path === "/") {
          // Reload to skip entrance on home
          await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
        }
        // Scroll through the page to trigger IntersectionObservers
        const height = await page.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y < height; y += 400) {
          await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
          await page.waitForTimeout(100);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(800); // let animations settle
        await page.screenshot({
          path: path.join(outDir, `${pg.name}-${vp.name}.png`),
          fullPage: true,
        });
      } catch (err) {
        console.error(`  ERROR: ${vp.name}/${pg.name}: ${err.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("Done. Screenshots saved to screenshots/redesign/");
}

main().catch(console.error);
