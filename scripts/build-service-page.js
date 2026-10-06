// Post-build script: generates route-specific initial HTML for the
// /driving-school-gulberg-lahore/ service page at
//   dist/driving-school-gulberg-lahore/index.html
//
// Cloudflare Pages serves static files before applying the _redirects
// fallback, so requests to /driving-school-gulberg-lahore/ will receive
// this file directly — with correct title, meta, canonical, OG, Twitter,
// structured data, and crawlable content in the initial HTML (before JS).
//
// Run automatically after `vite build` via the `postbuild` script.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Content source of truth (shared with the React ServicePage component).
// ---------------------------------------------------------------------------
import {
  SERVICE_META,
  breadcrumbSchema,
  faqSchema,
  staticContent,
} from "../src/data/servicePageContent.js";

// ---------------------------------------------------------------------------
// 1. Read the freshly built dist/index.html (homepage) as the template.
// ---------------------------------------------------------------------------
const indexHtmlPath = resolve(root, "dist/index.html");
let html;
try {
  html = readFileSync(indexHtmlPath, "utf-8");
} catch (err) {
  console.error(
    `[build-service-page] ERROR: Could not read ${indexHtmlPath}. ` +
      `Run \`vite build\` first.`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Replace meta tags with service-page-specific values.
// ---------------------------------------------------------------------------

// <title>
html = html.replace(
  /<title>.*?<\/title>/s,
  `<title>${SERVICE_META.title}</title>`
);

// <meta name="description">
html = html.replace(
  /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
  `<meta name="description" content="${SERVICE_META.description}" />`
);

// <link rel="canonical">
html = html.replace(
  /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
  `<link rel="canonical" href="${SERVICE_META.canonical}" />`
);

// og:title
html = html.replace(
  /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:title" content="${SERVICE_META.title}" />`
);

// og:description
html = html.replace(
  /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:description" content="${SERVICE_META.description}" />`
);

// og:url
html = html.replace(
  /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
  `<meta property="og:url" content="${SERVICE_META.canonical}" />`
);

// twitter:title
html = html.replace(
  /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
  `<meta name="twitter:title" content="${SERVICE_META.title}" />`
);

// twitter:description
html = html.replace(
  /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
  `<meta name="twitter:description" content="${SERVICE_META.description}" />`
);

// ---------------------------------------------------------------------------
// 3. Replace the LocalBusiness schema + its comment with BreadcrumbList +
//    FAQPage. (Service page does not need LocalBusiness — that stays on the
//    homepage only.)
// ---------------------------------------------------------------------------
const structuredDataBlock = [
  `<!-- BreadcrumbList + FAQPage Structured Data (JSON-LD) -->`,
  `<script type="application/ld+json">`,
  JSON.stringify(breadcrumbSchema),
  `</script>`,
  `<script type="application/ld+json">`,
  JSON.stringify(faqSchema),
  `</script>`,
].join("\n  ");

html = html.replace(
  /<!-- LocalBusiness Structured Data \(JSON-LD\) -->\s*<script type="application\/ld\+json">\s*\{[\s\S]*?"@type":\s*"LocalBusiness"[\s\S]*?\}\s*<\/script>/,
  structuredDataBlock
);

// ---------------------------------------------------------------------------
// 4. Replace the static crawlable content inside #root with service content.
// ---------------------------------------------------------------------------
const featuresList = staticContent.features
  .map((f) => `<li>${f}</li>`)
  .join("\n        ");

const coursesList = staticContent.courses
  .map(
    (c) => `<li><strong>${c.name}:</strong> ${c.detail}</li>`
  )
  .join("\n        ");

const phoneClean = staticContent.location.phone.replace(/\s/g, "");

const staticFallback = `
      <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 1rem; color: #111827;">${staticContent.heading}</h1>

      <p style="font-size: 1rem; margin: 0 0 1.5rem; color: #4b5563; line-height: 1.7;">
        ${staticContent.intro}
      </p>

      <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0 0 0.75rem; color: #111827;">Why Choose Razia Driving Center</h2>
      <ul style="margin: 0 0 1.5rem; padding-left: 1.25rem; color: #4b5563; line-height: 1.8;">
        ${featuresList}
      </ul>

      <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0 0 0.75rem; color: #111827;">Driving Courses</h2>
      <ul style="margin: 0 0 1.5rem; padding-left: 1.25rem; color: #4b5563; line-height: 1.8;">
        ${coursesList}
      </ul>

      <h2 style="font-size: 1.125rem; font-weight: 700; margin: 0 0 0.75rem; color: #111827;">Location &amp; Contact</h2>
      <address style="font-style: normal; font-size: 0.95rem; margin: 0 0 0.5rem; color: #4b5563;">
        ${staticContent.location.address}
      </address>
      <p style="font-size: 0.95rem; margin: 0 0 0.5rem; color: #4b5563;">
        Phone: <a href="tel:${phoneClean}" style="color: #FF6201; text-decoration: none;">${staticContent.location.phone}</a>
      </p>
      <p style="font-size: 0.95rem; margin: 0 0 1.5rem; color: #4b5563;">
        Hours: ${staticContent.location.hours}
      </p>

      <p style="font-size: 0.95rem; margin: 0 0 0.5rem;">
        <a href="/" style="color: #FF6201; text-decoration: none; font-weight: 600;">&larr; Back to Homepage</a>
      </p>
      <p style="font-size: 0.95rem; margin: 0;">
        <a href="/#courses" style="color: #FF6201; text-decoration: none; font-weight: 600;">View all course details &rarr;</a>
      </p>
    `;

html = html.replace(
  /<div id="root">\s*<!-- SEO Fallback[\s\S]*?<\/div>/,
  `<div id="root">\n    <!-- SEO Fallback: Static content available before React mounts.\n         Replaced by the React application on initialization. -->\n    <main style="max-width: 720px; margin: 0 auto; padding: 3rem 1.5rem; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.7;">${staticFallback}\n    </main>\n  </div>`
);

// ---------------------------------------------------------------------------
// 5. Write the generated HTML to dist/driving-school-gulberg-lahore/index.html.
// ---------------------------------------------------------------------------
const outputDir = resolve(root, "dist/driving-school-gulberg-lahore");
mkdirSync(outputDir, { recursive: true });
const outputPath = resolve(outputDir, "index.html");
writeFileSync(outputPath, html, "utf-8");

console.log(`[build-service-page] Generated: ${outputPath}`);
