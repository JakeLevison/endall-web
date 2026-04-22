import { chromium } from 'playwright';
import fs from 'node:fs';

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const p = await c.newPage();

const dir = '/tmp/xlsx-render';
const outDir = '/tmp/xlsx-shots';
fs.mkdirSync(outDir, { recursive: true });

for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.html')).sort()) {
  const url = `file://${dir}/${f}`;
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(200);
  const box = await p.evaluate(() => {
    const r = document.body.getBoundingClientRect();
    return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
  });
  if (box.w > 1600 || box.h > 1000) {
    await p.setViewportSize({
      width: Math.min(3000, Math.max(1200, box.w + 20)),
      height: Math.min(3200, Math.max(800, box.h + 20)),
    });
    await p.waitForTimeout(100);
  }
  const outPng = `${outDir}/${f.replace('.html', '.png')}`;
  await p.screenshot({ path: outPng, clip: { x: 0, y: 0, width: box.w, height: box.h } });
}

await c.close();
await b.close();
console.log('done');
