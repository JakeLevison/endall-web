// Generates the full link-preview / icon asset set from the Endall brand
// language: white "e" mark on near-black (#0a0a0a), Geist SemiBold wordmark,
// amber (#f59e0b) accent. Run with: node scripts/generate-brand-assets.mjs
//
// Outputs (committed):
//   public/og.png                 1200x630  Open Graph + twitter:image
//   public/apple-touch-icon.png   180x180   iOS home screen
//   public/icon-192.png           192x192   web manifest (any/maskable)
//   public/icon-512.png           512x512   web manifest (any/maskable)
//   public/favicon-32x32.png      32x32
//   public/favicon-16x16.png      16x16
//   public/icon.svg               scalable browser icon
//   src/app/favicon.ico           16/32/48 multi-res .ico
//
// The Geist TTFs ship with the `geist` package; we inline them as base64 so
// the SVG rasterizes with the genuine brand typeface regardless of the host's
// installed system fonts.

import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pub = join(root, "public");

const BG = "#0a0a0a";
const FG = "#ffffff";
const AMBER = "#f59e0b";
const MUTED = "#9ca3af";

const fontDir = join(root, "node_modules/geist/dist/fonts/geist-sans");
const geistSemiBold = readFileSync(join(fontDir, "Geist-SemiBold.ttf")).toString("base64");
const geistRegular = readFileSync(join(fontDir, "Geist-Regular.ttf")).toString("base64");

const fontFaces = `
  @font-face { font-family: 'Geist'; font-weight: 600; font-style: normal;
    src: url(data:font/ttf;base64,${geistSemiBold}) format('truetype'); }
  @font-face { font-family: 'Geist'; font-weight: 400; font-style: normal;
    src: url(data:font/ttf;base64,${geistRegular}) format('truetype'); }
`;

const svgToPng = (svg, out) =>
  sharp(Buffer.from(svg)).png().toFile(join(pub, out)).then(() => console.log("✓", out));

// --- square "e" mark -------------------------------------------------------
// rounded: corner radius as fraction of size (ignored when bleed=true).
// pad:     fraction of size kept empty around the glyph (the maskable safe zone).
// bleed:   when true, the BG fills the entire canvas edge-to-edge and only the
//          glyph is inset by `pad`. Required for "maskable" icons so the OS mask
//          (circle/squircle) never reveals transparent corners. When false, the
//          rounded BG card itself is inset by `pad`.
function markSvg(size, { rounded = 0.22, pad = 0, bleed = false } = {}) {
  const inner = size * (1 - pad * 2);
  const off = size * pad;
  const fontSize = inner * 0.6;
  // "e" is an x-height glyph (no ascender/descender), so its visual center sits
  // ~0.25em above the baseline. Place the baseline so the glyph body centers
  // within the canvas (bleed) or within the inset card (non-bleed).
  const centerY = bleed ? size * 0.5 : off + inner * 0.5;
  const baseline = centerY + fontSize * 0.25;
  const bg = bleed
    ? `<rect width="${size}" height="${size}" fill="${BG}"/>`
    : `<rect x="${off}" y="${off}" width="${inner}" height="${inner}" rx="${inner * rounded}" fill="${BG}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><style>${fontFaces}</style></defs>
  ${bg}
  <text x="${size / 2}" y="${baseline}" text-anchor="middle" font-family="Geist" font-weight="600" font-size="${fontSize}" fill="${FG}">e</text>
</svg>`;
}

// --- Open Graph / twitter card (1200x630) ----------------------------------
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>${fontFaces}</style>
    <radialGradient id="glow" cx="50%" cy="26%" r="60%">
      <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${AMBER}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(540,150)">
    <rect width="120" height="120" rx="28" fill="#111111" stroke="#262626" stroke-width="1.5"/>
    <text x="60" y="90" text-anchor="middle" font-family="Geist" font-weight="600" font-size="82" fill="${FG}">e</text>
  </g>
  <text x="600" y="400" text-anchor="middle" font-family="Geist" font-weight="600" font-size="104" letter-spacing="-3" fill="${FG}">endall</text>
  <text x="600" y="468" text-anchor="middle" font-family="Geist" font-weight="400" font-size="33" letter-spacing="0.4" fill="${MUTED}">AI Ops Team for MEP Contractors</text>
  <!-- Subtitle copy mirrors the positioning in src/app/layout.tsx (TITLE). Keep in sync. -->
  <rect x="556" y="510" width="88" height="4" rx="2" fill="${AMBER}"/>
</svg>`;

// --- scalable browser icon (system fonts available in-browser) -------------
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${BG}"/>
  <text x="16" y="22.5" text-anchor="middle" font-family="Geist, system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="${FG}">e</text>
</svg>
`;

// --- minimal .ico encoder (PNG-embedded entries) ---------------------------
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((e, i) => {
    const b = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 0);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 1);
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // planes
    dir.writeUInt16LE(32, b + 6); // bpp
    dir.writeUInt32LE(e.data.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
    offset += e.data.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

async function main() {
  // OG + social
  await svgToPng(og, "og.png");

  // Apple touch icon: full-bleed (iOS applies its own corner mask), no padding.
  await svgToPng(markSvg(180, { rounded: 0, pad: 0 }), "apple-touch-icon.png");

  // Manifest icons: full-bleed dark so the OS mask never reveals transparent
  // corners, with the glyph inside the maskable safe zone.
  await svgToPng(markSvg(512, { bleed: true, pad: 0.16 }), "icon-512.png");
  await svgToPng(markSvg(192, { bleed: true, pad: 0.16 }), "icon-192.png");

  // Favicons (rounded mark).
  await svgToPng(markSvg(32, { rounded: 0.22 }), "favicon-32x32.png");
  await svgToPng(markSvg(16, { rounded: 0.22 }), "favicon-16x16.png");

  // Scalable icon.
  writeFileSync(join(pub, "icon.svg"), iconSvg);
  console.log("✓ icon.svg");

  // favicon.ico (16/32/48)
  const icoSizes = [16, 32, 48];
  const icoEntries = await Promise.all(
    icoSizes.map(async (size) => ({
      size,
      data: await sharp(Buffer.from(markSvg(size, { rounded: 0.22 }))).png().toBuffer(),
    })),
  );
  writeFileSync(join(root, "src/app/favicon.ico"), buildIco(icoEntries));
  console.log("✓ src/app/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
