import { chromium } from '@playwright/test';
const pages = [
  ['home', 'https://endall.ai/'],
  ['dashboard', 'https://endall.ai/dashboard'],
  ['ask', 'https://endall.ai/ask'],
  ['crm', 'https://endall.ai/crm'],
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: {width:1440,height:900} });
for (const [name,url] of pages) {
  const page = await ctx.newPage();
  const errors = [], failed = [];
  page.on('pageerror', e => errors.push(`JS: ${e.message.slice(0,180)}`));
  page.on('console', m => { if (m.type()==='error') errors.push(`CON: ${m.text().slice(0,180)}`); });
  page.on('requestfailed', r => failed.push(`FAIL ${r.failure()?.errorText} ${r.url().slice(0,100)}`));
  page.on('response', r => { if (r.status()>=400) failed.push(`${r.status()} ${r.url().slice(0,100)}`); });
  try {
    const resp = await page.goto(url, { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(3500);
    const status = resp?.status();
    const shot = `/tmp/audit-${name}.png`;
    await page.screenshot({ path: shot, fullPage: true });
    const bodyLen = (await page.textContent('body').catch(()=>''))?.length ?? 0;
    console.log(`\n=== ${name} ${url} ===`);
    console.log(`HTTP ${status}  bodyTextLen=${bodyLen}  shot=${shot}`);
    if (errors.length) console.log('ERRORS:\n  ' + errors.slice(0,10).join('\n  '));
    if (failed.length) console.log('FAILED:\n  ' + failed.slice(0,12).join('\n  '));
  } catch (e) {
    console.log(`\n=== ${name} ${url} ===\nFAIL: ${e.message.slice(0,200)}`);
  }
  await page.close();
}
await browser.close();
