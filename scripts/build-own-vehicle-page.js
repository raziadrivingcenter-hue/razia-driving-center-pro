// Post-build script: generates route-specific initial HTML for the
// /learn-on-your-own-vehicle/ page at
//   dist/learn-on-your-own-vehicle/index.html
//
// Cloudflare Pages serves static files before applying the _redirects
// fallback, so requests to /learn-on-your-own-vehicle/ receive this file
// directly — with the correct title, meta, canonical, Open Graph and Twitter
// tags, plus crawlable page content in the initial HTML (before JS).
//
// The homepage's LocalBusiness JSON-LD and its static fallback copy are
// removed here: this route must not present the homepage's content.
//
// All meta values come from src/data/ownVehicleSeo.js, the same module the
// React page passes to useMeta, so the static and runtime tags cannot drift.
//
// Run automatically after `vite build` via the `postbuild` script.

/* global process */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OWN_VEHICLE_META } from "../src/data/ownVehicleSeo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1. Read the freshly built dist/index.html (homepage) as the template.
// ---------------------------------------------------------------------------
const indexHtmlPath = resolve(root, "dist/index.html");
let html;
try {
  html = readFileSync(indexHtmlPath, "utf-8");
} catch {
  console.error(
    `[build-own-vehicle-page] ERROR: Could not read ${indexHtmlPath}. ` +
      `Run \`vite build\` first.`
  );
  process.exit(1);
}

const { title, description, canonical, image } = OWN_VEHICLE_META;

// ---------------------------------------------------------------------------
// 2. Swap the homepage meta for this route's meta.
//
//    replaceOnce() fails the build loudly if Vite ever changes the HTML
//    shape, instead of silently shipping a page with the homepage's tags.
// ---------------------------------------------------------------------------
function replaceOnce(pattern, replacement, label) {
  const before = html;
  html = html.replace(pattern, replacement);
  if (html === before) {
    console.error(
      `[build-own-vehicle-page] ERROR: could not replace ${label}. ` +
        `The built index.html does not match the expected markup.`
    );
    process.exit(1);
  }
}

// <title>
replaceOnce(/<title>.*?<\/title>/s, `<title>${title}</title>`, "<title>");

// <meta name="description">
replaceOnce(
  /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
  `<meta name="description" content="${description}" />`,
  'meta name="description"'
);

// <link rel="canonical">
replaceOnce(
  /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
  `<link rel="canonical" href="${canonical}" />`,
  'link rel="canonical"'
);

// Open Graph
replaceOnce(
  /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:title" content="${title}" />`,
  "og:title"
);
replaceOnce(
  /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:description" content="${description}" />`,
  "og:description"
);
replaceOnce(
  /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:url" content="${canonical}" />`,
  "og:url"
);
replaceOnce(
  /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:image" content="${image.url}" />`,
  "og:image"
);
replaceOnce(
  /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:image:secure_url" content="${image.url}" />`,
  "og:image:secure_url"
);
replaceOnce(
  /<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:image:type" content="${image.type}" />`,
  "og:image:type"
);
replaceOnce(
  /<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:image:width" content="${image.width}" />`,
  "og:image:width"
);
replaceOnce(
  /<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:image:height" content="${image.height}" />`,
  "og:image:height"
);
replaceOnce(
  /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:image:alt" content="${image.alt}" />`,
  "og:image:alt"
);

// Twitter
replaceOnce(
  /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
  `<meta name="twitter:title" content="${title}" />`,
  "twitter:title"
);
replaceOnce(
  /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
  `<meta name="twitter:description" content="${description}" />`,
  "twitter:description"
);
replaceOnce(
  /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
  `<meta name="twitter:image" content="${image.url}" />`,
  "twitter:image"
);
replaceOnce(
  /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/>/,
  `<meta name="twitter:card" content="${image.card}" />`,
  "twitter:card"
);

// ---------------------------------------------------------------------------
// 3. Drop the homepage's LocalBusiness JSON-LD — this route must not carry
//    the homepage's structured data.
// ---------------------------------------------------------------------------
html = html.replace(
  /<!-- LocalBusiness Structured Data \(JSON-LD\) -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  ""
);

// ---------------------------------------------------------------------------
// 4. Replace the homepage's static fallback with this page's own content.
// ---------------------------------------------------------------------------
const staticFallback = `
      <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 1rem; color: #111827;">Learn On Your Own Vehicle</h1>

      <p style="font-size: 1rem; margin: 0 0 1rem; color: #4b5563; line-height: 1.7;">
        Build a driving course around your own car — choose 7 to 30 days and 30 to 60 minute daily lessons, and watch the price update live as you adjust the course length and lesson time.
      </p>

      <p style="font-size: 1rem; margin: 0 0 1.5rem; color: #4b5563; line-height: 1.7;">
        Add pick &amp; drop at your doorstep, choose a date and time, and request your booking online.
      </p>

      <p style="font-size: 0.95rem; margin: 0;">
        <a href="/" style="color: #FF6201; text-decoration: none; font-weight: 600;">&larr; Back to Homepage</a>
      </p>
    `;

html = html.replace(
  /<div id="root">\s*<!-- SEO Fallback[\s\S]*?<\/div>/,
  `<div id="root">\n    <!-- SEO Fallback: Static content available before React mounts.\n         Replaced by the React application on initialization. -->\n    <main style="max-width: 720px; margin: 0 auto; padding: 3rem 1.5rem; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.7;">${staticFallback}\n    </main>\n  </div>`
);

// ---------------------------------------------------------------------------
// 5. Write dist/learn-on-your-own-vehicle/index.html.
// ---------------------------------------------------------------------------
const outputDir = resolve(root, "dist/learn-on-your-own-vehicle");
mkdirSync(outputDir, { recursive: true });
const outputPath = resolve(outputDir, "index.html");
writeFileSync(outputPath, html, "utf-8");

console.log(`[build-own-vehicle-page] Generated: ${outputPath}`);
