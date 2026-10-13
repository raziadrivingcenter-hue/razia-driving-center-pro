// =============================================================================
// Generate favicon PNGs and ICO from the CorelDRAW SVG
// Uses @resvg/resvg-js for reliable rendering (handles inches, viewBox, CSS)
// =============================================================================

import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svgPath = join(publicDir, "favicon.svg");
const svgString = readFileSync(svgPath, "utf8");

const targets = [
  { name: "favicon-48.png", size: 48 },
  { name: "favicon-32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon.png", size: 512 },
];

console.log("Rendering favicons from CorelDRAW SVG...\n");

for (const target of targets) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: target.size },
    font: { loadSystemFonts: false },
    shapeRendering: 2, // geometricPrecision
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const outPath = join(publicDir, target.name);
  writeFileSync(outPath, pngBuffer);

  const kb = (pngBuffer.length / 1024).toFixed(1);
  console.log(`  ✓ ${target.name} (${target.size}×${target.size}) — ${kb} KB`);
}

// Build a real ICO file containing the 48×48 PNG
// ICO format: header (6) + directory entry (16) + PNG data
function createIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = ICO
  header.writeUInt16LE(1, 4); // image count

  const dir = Buffer.alloc(16);
  dir.writeUInt8(48, 0);  // width
  dir.writeUInt8(48, 1);  // height
  dir.writeUInt8(0, 2);   // color palette
  dir.writeUInt8(0, 3);   // reserved
  dir.writeUInt16LE(1, 4); // color planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(pngBuffer.length, 8); // size of image data
  dir.writeUInt32LE(6 + 16, 12); // offset to image data

  return Buffer.concat([header, dir, pngBuffer]);
}

// Generate ICO from the 48×48 render
const resvg48 = new Resvg(svgString, {
  fitTo: { mode: "width", value: 48 },
  font: { loadSystemFonts: false },
  shapeRendering: 2,
});
const icoBuffer = createIco(resvg48.render().asPng());
const icoPath = join(publicDir, "favicon.ico");
writeFileSync(icoPath, icoBuffer);
console.log(`  ✓ favicon.ico (48×48 inside) — ${(icoBuffer.length / 1024).toFixed(1)} KB`);

console.log("\nDone! All favicons generated.");
