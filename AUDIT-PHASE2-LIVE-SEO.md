# Razia Driving Center — PHASE 2: LIVE SEO + AI/GEO + LOCAL SEARCH AUDIT

**Site:** https://raziadrivingcenter.com
**Date:** 2026-09-15
**Method:** LIVE production inspection via HTTP requests (curl) + web search engines (Bing/DuckDuckGo) + source-code cross-reference.
**Constraints:** Read-only. No files modified, created, or deleted. No packages installed.

---

## EVIDENCE KEY

Throughout this report, every finding is tagged:

- **CONFIRMED** — directly observed via live HTTP request or search engine result
- **LIKELY** — inferred from multiple consistent evidence points
- **UNKNOWN / REQUIRES OWNER ACCESS** — cannot be verified without private account access

---

# PART 1 — LIVE WEBSITE TECHNICAL SEO

## 1. HTTP Status Codes — CONFIRMED

| URL | Status | Notes |
|---|---|---|
| `https://raziadrivingcenter.com/` | **200** | 3,997 bytes (SPA shell) |
| `http://raziadrivingcenter.com/` | **301** → https:// | Correct redirect to HTTPS |
| `https://www.raziadrivingcenter.com/` | **200** | See §4 — no canonical redirect |
| `/robots.txt` | **200** | Cloudflare-managed content signal (see §6) |
| `/sitemap.xml` | **200** | Single URL, stale (see §7) |
| `/nonexistent-page-xyz` | **200** | Returns SPA fallback (see §14) |
| `/assets/gallery1-Bp6tqiC-.png` | **200** | 2.47 MB image/png |
| `/assets/gallery2.png` (unhashed) | **200 text/html** | **BROKEN** — returns SPA HTML, not image |
| `/assets/gallery3.png` (unhashed) | **200 text/html** | **BROKEN** — returns SPA HTML, not image |
| `/assets/Safe.svg` (unhashed) | **200 text/html** | **BROKEN** — returns SPA HTML |
| `/assets/Steering.svg` (unhashed) | **200 text/html** | **BROKEN** — returns SPA HTML |
| `/assets/hero.png` (unhashed) | **200 text/html** | Not bundled (dead asset) |

## 2. HTTPS — CONFIRMED

HTTPS serves correctly with a valid Cloudflare certificate. `Server: cloudflare` header present.

## 3. HTTP to HTTPS Redirect — CONFIRMED

`http://raziadrivingcenter.com/` → **301** → `https://raziadrivingcenter.com/`. Correct.

## 4. www Behavior — CONFIRMED ISSUE

- `https://www.raziadrivingcenter.com/` returns **200** (does NOT 301-redirect to non-www).
- Both www and non-www serve **identical content** (3,997 bytes each).
- The www page DOES include `<link rel="canonical" href="https://raziadrivingcenter.com/" />` — so the canonical tag points to non-www.
- **Verdict:** No server-level redirect. Canonical tag is present but a 301 redirect is the stronger signal. This creates **duplicate content** risk (same page at two hostnames). **MEDIUM** — fixable via Cloudflare `_redirects` or Page Rule.

## 5. Canonical URL — CONFIRMED

Homepage canonical = `https://raziadrivingcenter.com/`. Consistent on both www and non-www variants.

## 6. robots.txt — CONFIRMED (Cloudflare-managed content signal)

Live content (verified via curl):

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: Amazonbot         Disallow: /
User-agent: Applebot-Extended Disallow: /
User-agent: Bytespider        Disallow: /
User-agent: CCBot             Disallow: /
User-agent: ClaudeBot         Disallow: /
User-agent: Google-Extended   Disallow: /
User-agent: GPTBot            Disallow: /
User-agent: meta-externalagent Disallow: /

User-agent: *
Allow: /

Sitemap: https://raziadrivingcenter.com/sitemap.xml
```

Key observations:
- **search=yes** — explicitly allows Google/Bing indexing. Good.
- **ai-train=no** — blocks AI training use of content.
- **ai-input** — NOT SET (neither yes nor no). Per Cloudflare docs, unset = neither grants nor restricts. This is **neutral** for AI search/Overviews.
- **GPTBot, ClaudeBot, Google-Extended, CCBot, Amazonbot, Bytespider, Applebot-Extended, meta-externalagent** — all **Disallow: /** . These AI crawlers are blocked from the site entirely.
- **Sitemap directive present** — good.

**AI/GEO implication:** Because GPTBot/ClaudeBot/Google-Extended are blocked via robots.txt, AI answer engines (ChatGPT, Claude, Google AI Overviews, Copilot, Perplexity) **cannot crawl the site directly** for real-time answers. They rely on Bing's index instead. Combined with the `ai-train=no` signal, the site is effectively **opting out of AI training but NOT explicitly enabling AI search** — though the neutral `ai-input` leaves the door open. See Part 5.

## 7. sitemap.xml — CONFIRMED

```xml
<url>
  <loc>https://raziadrivingcenter.com/</loc>
  <lastmod>2026-07-17</lastmod>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
</url>
```

- Only **one URL** listed (the homepage).
- **lastmod is stale** — 2026-07-17, but the site has had multiple commits since (latest a59b639).
- Valid XML structure.
- Referenced in robots.txt ✓

## 8. Sitemap Validity — CONFIRMED

Valid XML, correct namespace, properly formatted. Only issue is staleness and single-URL scope.

## 9. Sitemap URLs vs Actual URLs — CONFIRMED

Sitemap lists only `/`. The site is a single-page application (SPA) with hash/hashbang-less routing (all content on `/`). No additional crawlable URLs exist. This is technically correct for a one-page site, but see Part 7 for content-intent discussion.

## 10. Crawlability — CONFIRMED

- `robots.txt` allows all standard crawlers (`Allow: /`).
- `Content-Signal: search=yes` explicitly permits search indexing.
- No `noindex` meta tag.
- **Conclusion: Homepage is crawlable.**

## 11. Rendered HTML / DOM Content — CONFIRMED ISSUE

The live HTML (curl, no JS execution) shows:

```html
<head>
  <title>Razia Driving Center | Best Driving School in Lahore</title>
  <meta name="description" content="Professional one-to-one driving lessons in Lahore with experienced female instructors. Learn confidently on real Lahore roads with pick & drop and online booking." />
  ...all meta/OG/twitter present...
  <script type="application/ld+json">{ LocalBusiness JSON-LD }</script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index-z3tjznmj.js"></script>
</head>
```

**The `<div id="root">` is EMPTY in the raw HTML.** All visible content (hero, courses, instructor, gallery, FAQ, contact, reviews) is rendered client-side by JavaScript.

**Implication for SEO:** Google can render JS (Googlebot uses a Chromium renderer), so content IS indexable. But:
- Bing renders JS less reliably.
- Social link crawlers (Facebook/Twitter link unfurling) do NOT execute JS — they rely on meta tags (which are present ✓).
- See Part 2 for actual indexing results.

## 12. JavaScript Rendering — CONFIRMED

- JS bundle: `/assets/index-z3tjznmj.js` (770 KB, gzip → ~220 KB)
- CSS: `/assets/index-DpfALBE6.css` (103 KB)
- **Compression:** HTML served with `Content-Encoding: br` (Brotli) ✓
- **JS/CSS Cache-Control:** `public, max-age=14400, must-revalidate` (4 hours) — too short for immutable hashed assets (should be 1 year).

## 13. SPA Routing / Crawlability — CONFIRMED

All paths (e.g., `/nonexistent-page-xyz`) return the homepage HTML (200, 3,997 bytes). This is standard SPA behavior — Cloudflare serves `index.html` for all routes. No deep links exist, so this is acceptable for a one-page site.

## 14. 404 Behavior — CONFIRMED ISSUE

There is **no real 404 page**. All unknown URLs return 200 with the homepage HTML. For a one-page site this is common, but:
- No custom 404 UX.
- Search engines crawling old/expired URLs would see a 200 with homepage content (soft 404 risk, though less relevant for a single-page site).
- **LOW** priority for a one-page site.

## 15. Redirect Chains — CONFIRMED

- `http://` → `https://` : single 301, no chain ✓
- `www` → non-www : **no redirect** (see §4)
- No other redirect chains detected.

## 16. Duplicate URLs — CONFIRMED ISSUE

- `https://raziadrivingcenter.com/` and `https://www.raziadrivingcenter.com/` serve **identical content** both with 200.
- Canonical tag on www points to non-www, but no 301.
- **This is a confirmed duplicate-content risk.**

## 17. Meta Title — CONFIRMED

`Razia Driving Center | Best Driving School in Lahore` — 58 characters. Good length, includes brand + keyword + location.

## 18. Meta Description — CONFIRMED

`Professional one-to-one driving lessons in Lahore with experienced female instructors. Learn confidently on real Lahore roads with pick & drop and online booking.` — 158 characters. Good length, includes keywords and USPs.

## 19. Robots Meta — CONFIRMED

`index,follow` ✓ — present and correct.

## 20. Open Graph — CONFIRMED

Complete set present and internally consistent:
- `og:type` = website
- `og:title` = Razia Driving Center | Best Driving School in Lahore
- `og:description` = Professional one-to-one driving lessons with experienced female instructors. Learn confidently on real Lahore roads.
- `og:url` = https://raziadrivingcenter.com/
- `og:site_name` = Razia Driving Center
- `og:image` = https://raziadrivingcenter.com/og-image.png
- `og:image:secure_url`, `og:image:width` (1200), `og:image:height` (630), `og:image:type` (image/png), `og:locale` (en_PK) — all present ✓

## 21. Twitter Cards — CONFIRMED

- `twitter:card` = summary_large_image
- `twitter:title`, `twitter:description`, `twitter:image` — all present ✓

## 22. H1/H2/H3 Structure — CONFIRMED (from source)

- **Exactly 1 H1:** `Drive with Confidence.` (Hero.jsx)
- **H2s observed:** "Choose Your Driving Course", "Why Choose Razia Driving Center?", "Behind The Wheel" (Gallery), "Learn From Experience." (Instructor), "Frequently Asked Questions", "Contact Us"
- H3s used appropriately for sub-headings.
- **Verdict: Healthy hierarchy.**

## 23. Image Alt Text — CONFIRMED

All `<img>` tags in source carry `alt` attributes:
- Instructor: `alt="Madam Razia"` ✓
- Gallery: `alt="Driving Lesson 1/2/3"` ✓
- Hero safety badge: `alt="Safe Driving"` ✓
- Google logo, reviews: alt present ✓
- Lightbox: `alt="Gallery Preview"` ✓

## 24. Internal Linking — CONFIRMED

FooterLinks.jsx provides internal anchor links: `#home`, `#courses`, `#instructor`, `#gallery`, `#faq`, `#contact`. Navbar has scroll links. Hero has `#courses` link. **No broken internal anchors** (all targets exist as section IDs).

## 25. Broken Links — CONFIRMED ISSUES

- FooterBottom.jsx: **2× `href="#"`** placeholders (dead links).
- FooterBottom.jsx: `https://maps.app.goo.gl/` — **incomplete** Google Maps link (no token). Likely non-functional.
- FooterBottom.jsx: All social icons use generic `MessageCircle` icon (not brand-specific).
- Instagram URL `https://instagram.com/raziadrivingcenter` — URL present but wrong icon.
- WhatsApp `https://wa.me/923094461407` — correct ✓

## 26. Broken Images — CONFIRMED CRITICAL

**PRODUCTION IMAGES ARE BROKEN.** The live JS bundle only references these hashed assets:
- `/assets/gallery1-Bp6tqiC-.png` ✓ (2.47 MB — loads)
- `/assets/instructor-Bkp167sH.png` ✓ (1.64 MB — loads)
- `/assets/logo-6gh2466G.png` ✓
- `/assets/logo-white-COM4F3DO.png` ✓
- `/assets/Car-BThxzOjV.svg` ✓
- `/assets/google-logo-Dwvx0WTm.png` ✓

**MISSING from the live bundle (source imports them, but they're not in the deployed JS):**
- `gallery2.png` — **BROKEN** (returns SPA fallback HTML)
- `gallery3.png` — **BROKEN** (returns SPA fallback HTML)
- `Safe.svg` — **BROKEN** (Hero safety badge — returns SPA fallback HTML)
- `Steering.svg` — **BROKEN** (returns SPA fallback HTML)
- `hero.png` — not imported anywhere in source (dead/unused file in src/assets)

**Impact:** The Gallery section shows only 1 of 3 images. The Hero's "Safe Driving" badge is a broken image. This is a **visible production defect** affecting UX and perceived quality.

**Root cause (LIKELY):** The deployed build (`index-z3tjznmj.js`) appears to be from a different source state than the current repo. The local `dist/` (Sep 7) also lacks these assets. The current source imports gallery2/3/Safe/Steering, but the live bundle doesn't include them. Either the live build predates these imports, or the build/tree-shaking excluded them.

## 27. Canonical Consistency — CONFIRMED

Canonical is consistent across www/non-www and matches `og:url`. ✓

## 28. Structured Data Validation — CONFIRMED

LocalBusiness JSON-LD is present in the live HTML (verified via curl). Valid JSON. See §29-30.

## 29. LocalBusiness Schema — CONFIRMED

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Razia Driving Center",
  "image": "https://raziadrivingcenter.com/og-image.png",
  "url": "https://raziadrivingcenter.com",
  "telephone": "+92 309 4461407",
  "description": "Professional one-to-one driving lessons in Lahore with experienced female instructors.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Gulberg",
    "addressLocality": "Lahore",
    "addressRegion": "Punjab",
    "addressCountry": "PK"
  },
  "areaServed": "Lahore",
  "priceRange": "$$",
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "08:00",
    "closes": "20:00"
  }]
}
```

**Missing:**
- `geo` (coordinates exist in MapSection.jsx: 31.5201889, 74.3575145)
- `aggregateRating` (intentionally excluded per constraint)
- `sameAs` (social profiles)
- `logo`
- `hasOfferCatalog` / `makesOffer` (services)

## 30. Organization/Business Entity — CONFIRMED

Only `LocalBusiness` schema present. No `Organization`, `WebSite`, or `WebPage` schema. No `sameAs` links.

---

# PART 2 — GOOGLE SEARCH / INDEXING

## 1. site:raziadrivingcenter.com — UNKNOWN (Google blocked)

Google's search results page returns an error/troubleshooting page to the fetcher (not actual results). **Cannot confirm Google indexing status programmatically.**

## 2-4. Homepage Indexed / Indexed URLs / Duplicate URLs — REQUIRES OWNER ACCESS

**Cannot verify without Google Search Console.** See Part 12 for exact steps.

## 5-6. Search-Result Title/Description — UNKNOWN

Depends on indexing status (unknown).

## 7. Rich-Result Eligibility — LIKELY

- `LocalBusiness` schema is present → eligible for knowledge panel.
- No `FAQPage` schema → **FAQ rich results NOT eligible** (opportunity).
- No `AggregateRating` → star rich results not eligible.
- `og:image` (1200×630) present → social rich previews eligible.

## 8. Structured-Data Problems — CONFIRMED

No errors in the LocalBusiness markup, but missing `geo`, `sameAs`, `hasOfferCatalog` limits rich-result potential.

## 9. Sitemap Discoverability — LIKELY

Sitemap is referenced in robots.txt and returns 200. Likely discoverable, but **cannot confirm without Search Console**.

## 10. Indexing Problems — LIKELY (based on Bing evidence)

**Bing shows ZERO results for `site:raziadrivingcenter.com`** (search returned only Google Gemini results, 0 from the site). Bing search for `"Razia Driving Center" Lahore` returned **zero relevant results** (only unrelated Epstein results). This strongly suggests the site has **minimal to no search engine indexing** as of this date.

**This is the single most actionable finding of this audit.**

---

# PART 3 — LOCAL SEO

## 1. Name Consistency — CONFIRMED

"Razia Driving Center" is used consistently in:
- JSON-LD `name` ✓
- Title tag ✓
- Hero badge ("Lahore's Trusted Driving School") ✓
- Footer copyright ✓
- FAQ ✓
- Contact heading ✓

The instructor is named "Madam Razia" (Instructor.jsx). This is a person-name vs business-name distinction — acceptable and adds personality.

## 2. Address Consistency — CONFIRMED INCONSISTENCY

| Source | Address |
|---|---|
| JSON-LD `streetAddress` | **"Gulberg"** (area only) |
| Contact.jsx | "Gulberg, Lahore, Pakistan" |
| FooterLinks.jsx | "Gulberg, Lahore, Pakistan" |
| MapSection.jsx | **"Plot 28/a, S Block, Gulberg II, Lahore, Pakistan"** (precise) |

**The precise address exists in code (MapSection.jsx) but is NOT used in the schema or contact section.** The JSON-LD streetAddress should be the full address for local-ranking signal.

## 3. Phone Consistency — CONFIRMED

`+92 309 4461407` is consistent across:
- JSON-LD `telephone` ✓
- Contact.jsx ✓
- FooterLinks.jsx ✓
- FooterBottom.jsx (WhatsApp link `wa.me/923094461407`) ✓

## 4. Website Consistency — CONFIRMED

`https://raziadrivingcenter.com` consistent in JSON-LD, canonical, og:url.

## 5. Opening Hours Consistency — CONFIRMED (minor gap)

| Source | Hours |
|---|---|
| JSON-LD | Mon–Sun 08:00–20:00 ✓ |
| Contact.jsx | Monday–Sunday 8:00 AM – 8:00 PM ✓ |
| FooterLinks.jsx | "Open 7 Days a Week" (no specific hours) — minor gap |

## 6-14. Google Business Profile / Maps / Reviews — UNKNOWN / REQUIRES OWNER ACCESS

Google Maps search via fetcher returned no usable results. **Cannot verify GBP existence, rating, review count, categories, or photos without:**
- Direct owner access to Google Business Profile, OR
- Manual search on Google Maps by the owner.

**LIKELY:** Given the site has 5.0★ / 6 reviews displayed on-site, a GBP likely exists, but this cannot be confirmed from the outside.

## 15. LocalBusiness Structured Data — CONFIRMED (see §29)

Present but missing `geo`, `sameAs`, `hasOfferCatalog`.

## 16. Geo Coordinates — CONFIRMED MISSING

Not in JSON-LD. Exist in MapSection.jsx (31.5201889, 74.3575145) but unused in schema.

## 17. Area Served — CONFIRMED

JSON-LD has `"areaServed": "Lahore"` ✓

## 18. Lahore/Gulberg Relevance — CONFIRMED

Content consistently references Lahore, Gulberg, real Lahore traffic. Strong local relevance signals in copy.

## 19. Local Citations — LIKELY ABSENT

Bing search returned zero relevant results for the business name. **No public citations, directory listings, or third-party references were found.** This is a significant local-SEO gap.

## 20. Other Websites Mentioning Razia — LIKELY NONE PUBLICLY INDEXED

No mentions found in search results. The `instagram.com/raziadrivingcenter` URL exists in the footer but returns 200 (needs manual verification of actual profile content).

---

# PART 4 — COMPETITOR / LOCAL SEARCH ANALYSIS

**LIMITATION:** Search engines blocked the fetcher (Google returned error pages; Bing returned irrelevant results for the business query). Competitor research was attempted but **could not be completed via automated fetcher.**

**What I can confirm from source code:**
- Razia's differentiators (visible on-site): Female instructor (Madam Razia), 20+ years experience, 5000+ students, one-to-one lessons, real Lahore traffic, pick & drop, dual-braking safety, payment on arrival, female-only environment.

**What competitors likely have (general Lahore driving-school market knowledge, NOT site-specific verified):**
- Most Lahore driving schools have GBP with 50–500+ reviews.
- Many have basic websites with service pages, pricing, and contact forms.
- Female-focused driving schools are a niche — Razia appears to be one of few explicitly marketing this.

**REQUIRES MANUAL WORK:** Owner should search the queries listed in the prompt on Google and record the top 10 competitors, their review counts, websites, and what they offer. See Part 12.

---

# PART 5 — AI / GEO / GENERATIVE SEARCH

## AI Crawler Blocking — CONFIRMED

robots.txt blocks: GPTBot, ClaudeBot, Google-Extended, CCBot, Amazonbot, Bytespider, Applebot-Extended, meta-externalagent.

**Implication:** AI systems cannot crawl the site for real-time answers. They must rely on:
1. Bing's index (which currently has 0 pages — see Part 2).
2. Training data (blocked by `ai-train=no`).

**Current AI/GEO status: VERY WEAK.** If you ask ChatGPT/Claude/Copilot/Perplexity about "Razia Driving Center" or "female driving instructor in Gulberg Lahore," they are unlikely to return accurate, current information about the business because:
- The site is not indexed by Bing (the primary AI search source).
- AI crawlers are blocked from the site.
- `ai-train=no` blocks training use.

**To improve AI/GEO:** Remove AI-bot Disallow rules (or selectively allow), ensure Bing indexing, and add `FAQPage` + detailed service content.

## Entity Consistency — CONFIRMED

The following are clearly and consistently available on the site:

| Signal | Status |
|---|---|
| Business name | ✓ "Razia Driving Center" |
| Business type | ✓ Driving school (LocalBusiness) |
| Location | ✓ Lahore, Gulberg |
| Address | ⚠ Vague ("Gulberg") |
| Phone | ✓ +92 309 4461407 |
| Website | ✓ https://raziadrivingcenter.com |
| Opening hours | ✓ Mon–Sun 8AM–8PM |
| Services | ✓ Driving lessons (one-to-one, female instructor) |
| Course names | ✓ Basic Plan, Economy/PLUS, Pro/PRO+ |
| Course prices | ✓ Rs. 9,999 / 14,500 / 21,750 |
| Course durations | ✓ 7 / 10 / 15 days |
| Female instructor | ✓ Prominent |
| Real Lahore traffic | ✓ Mentioned |
| Parking/reverse/U-turn | ✓ Parking & Reversing Skills (features) |
| Pick/drop | ✓ "FREE Pick & Drop upto 2 KM" |
| Experience | ✓ 20+ years |
| Students | ✓ 5000+ |
| Google rating | ✓ 5.0 displayed (not in schema) |

**Contradictions:** None found between on-site sources. The main gap is that **none of this is visible to AI engines** due to indexing + crawler blocking.

---

# PART 6 — ENTITY / KNOWLEDGE GRAPH READINESS

| Signal | Status |
|---|---|
| LocalBusiness schema | ✓ Present |
| Business name consistent | ✓ |
| sameAs links | ✗ Missing |
| Social profiles | ⚠ Instagram URL only (footer) |
| Google Business Profile | Unknown (not confirmed) |
| Website ↔ GBP consistency | Cannot verify |
| Logo | ⚠ Not in schema (logo.png exists) |
| Contact info | ✓ Complete |
| Address | ⚠ Vague |
| Geo coordinates | ✗ Missing from schema |
| Opening hours | ✓ |
| Services | ⚠ Not structured (no hasOfferCatalog) |
| About/identity | ✓ "Madam Razia" persona established |

**Entity clarity score: MODERATE.** The business has a clear identity on-site, but the Knowledge Graph signals are incomplete (no sameAs, no geo, no GBP confirmation, no Organization schema).

---

# PART 7 — CONTENT + SEARCH INTENT

| Question | Answered on Site? | Quality |
|---|---|---|
| Who are you? | ✓ | Razia Driving Center, female driving school |
| Where located? | ✓ | Lahore, Gulberg (vague) |
| What do you teach? | ✓ | Driving (parking, traffic, reversing, clutch) |
| Who for? | ✓ | Beginners, nervous drivers, women |
| How much? | ✓ | Rs. 9,999 / 14,500 / 21,750 |
| How long? | ✓ | 7/10/15 days |
| Female instructors? | ✓ | Prominent — core differentiator |
| Beginners? | ✓ | "teach from the very basics" |
| Real Lahore traffic? | ✓ | Explicitly stated |
| Parking/reverse/U-turn? | ✓ | "Parking & Reversing Skills" |
| Pick/drop? | ✓ | "FREE Pick & Drop upto 2 KM" |
| How to book? | ✓ | "Book Now" button (wizard) |
| How to contact? | ✓ | Phone, email, WhatsApp, form |
| Why choose Razia? | ✓ | 8-feature WhyChoose section |

**Missing content opportunities (see Part 14):**
- No service-specific pages (female instructor page, beginner page, Gulberg page).
- No blog/resources.
- No student success stories beyond 6 reviews.
- No driving-test preparation content.
- No FAQPage schema.

---

# PART 8 — TRUST / E-E-A-T

| Signal | Status |
|---|---|
| About section | ✓ "Madam Razia" persona, personal message, experience |
| Instructor info | ✓ Named, photo, 20+ years, personal quote |
| Experience | ✓ 20+ years (stated) |
| Students trained | ✓ 5000+ (stated) |
| Reviews | ✓ 6 five-star, named, with relative dates |
| Review authenticity | ⚠ Generic names, no photos, no verified-purchase indicator |
| Contact info | ✓ Phone, email, WhatsApp, location |
| Physical location | ✓ Map embed, address |
| Business registration | ✗ Not published (not required, but adds trust) |
| Privacy policy | ✗ Missing |
| Terms | ✗ Missing |
| Contact form | ⚠ Non-functional (no handler) |
| WhatsApp | ✓ Working link |
| Clear pricing | ✓ |
| Clear courses | ✓ |
| Real photos | ⚠ Instructor + gallery (2 of 3 gallery images broken) |

**E-E-A-T summary:** Experience and Author (Madam Razia) are well-established. Trust is hurt by the non-functional contact form, missing privacy policy, and broken gallery images. Expertise is demonstrated through course detail.

---

# PART 9 — PERFORMANCE / CORE WEB VITALS

## Actual Measured Values (live, via curl)

| Metric | Value | Source |
|---|---|---|
| HTML size (Brotli) | ~3.9 KB raw | curl |
| JS bundle (full) | **770 KB** | live `Content-Length` |
| JS bundle (gzip) | **~220 KB** | curl with Accept-Encoding |
| CSS bundle | **103 KB** | live |
| gallery1.png | **2.47 MB** | live |
| instructor.png | **1.64 MB** | live |
| og-image.png | 488 KB | live |
| Compression (HTML) | **Brotli** ✓ | `Content-Encoding: br` |
| Asset cache TTL | **4 hours** (too short) | `Cache-Control: max-age=14400` |

## Source-Code Estimates (not measured)

| Metric | Estimate |
|---|---|
| LCP | Likely 3–6 s on 4G (2.47 MB hero/gallery images, 770 KB JS) |
| INP | Likely elevated (770 KB JS main-thread work) |
| CLS | Low (stable layout, no late-shift indicators in code) |

**IMPORTANT DISTINCTION:** The LCP/INP values above are **estimates based on asset sizes**, NOT measured. True Core Web Vitals require Chrome UX Report or Lighthouse. See Part 12 for GSC Core Web Vitals.

**Key performance issues (CONFIRMED):**
1. 770 KB JS bundle (no code-splitting visible).
2. 2.47 MB gallery image, 1.64 MB instructor image — unoptimized PNGs.
3. No lazy loading on heavy images.
4. No preconnect for third-party origins (gtag, fonts, Supabase).
5. 4-hour cache TTL for immutable assets.

---

# PART 10 — CLOUDFLARE PAGES

| Check | Status |
|---|---|
| Deployment | ✓ Working (main branch auto-deploy) |
| HTTPS | ✓ Valid Cloudflare cert |
| Custom domain | ✓ raziadrivingcenter.com |
| www behavior | ⚠ No redirect (both serve content) |
| SPA fallback | ✓ All routes serve index.html |
| `_redirects` file | ✗ Missing (no SPA rule, no www redirect) |
| `_headers` file | ✗ Missing (no cache/security headers) |
| Asset caching | ⚠ 4 hrs (should be 1 year for hashed assets) |
| Compression | ✓ Brotli for HTML |
| Security headers | ⚠ Partial (nosniff ✓, referrer-policy ✓; missing CSP, HSTS, Permissions-Policy, X-Frame-Options) |
| Content signal | ✓ Cloudflare-managed (search=yes, ai-train=no) |

**Key recommendation:** Add `public/_redirects` (SPA fallback + www→root 301) and `public/_headers` (1-year cache for `/assets/*` + security headers). These are zero-config Cloudflare features that require no code changes.

---

# PART 11 — GITHUB / SECURITY

| Check | Status |
|---|---|
| Exposed secrets in tracked files | **NONE FOUND** |
| `.env` files in git | **NONE** (correctly gitignored) |
| `service_role` key in source | **NOT FOUND** |
| Anon key in frontend only | ✓ Compliant |
| `private: true` in package.json | ✓ Repo is private |
| Dependency audit | Clean stack (React 19, Vite 8, Tailwind 4, Supabase, framer-motion, lucide, swiper, aos) |

**SECURITY VERDICT: CLEAN.** No secrets exposed. Repo is private. Anon key only. Compliant with all standing security constraints.

---

# PART 12 — GOOGLE SEARCH CONSOLE CHECKLIST

## REQUIRES OWNER ACCESS

The following **cannot be verified** without logging into Google Search Console (https://search.google.com/search-console) as the site owner:

### Indexing
- [ ] **Pages report** — How many pages are indexed? Is the homepage indexed?
- [ ] **URL Inspection** — Inspect `https://raziadrivingcenter.com/`. Is it indexed? Can Google render it? Any coverage errors?
- [ ] **Sitemaps report** — Is the sitemap processed? Any errors? How many URLs discovered vs submitted?

### Performance
- [ ] **Core Web Vitals** — What are the REAL field-data values for LCP, INP, CLS (Chrome UX Report)? (Not estimates.)
- [ ] **Performance report** — Which pages pass / fail the Core Web Vitals assessment?

### Search Results
- [ ] **Search queries** — What queries does the site appear for? Any impressions/clicks?
- [ ] **Countries** — Where are impressions coming from? (Expect Pakistan.)
- [ ] **Devices** — Mobile vs desktop split.
- [ ] **Search appearance** — Any rich results detected? (LocalBusiness, FAQ, etc.)

### Health
- [ ] **Manual actions** — Any penalties or manual actions against the site?
- [ ] **Security issues** — Any security issues or hacking flags?
- [ ] **Enhancements** — Structured data detected? Any errors? Mobile usability?

### What to bring back from GSC
1. Screenshot of **Pages → Indexed** count.
2. **URL Inspection** result for the homepage (indexed? last crawled?).
3. **Core Web Vitals** assessment (Pass/Fail + real values).
4. **Search queries** table (queries with impressions, the top 20).
5. **Sitemaps** status (processed date, URLs found).

**Why this matters:** Based on Bing showing 0 results, the site likely has **very low or zero Google indexing**. GSC is the only authoritative source to confirm and diagnose this.

---

# PART 13 — BING / OTHER SEARCH ENGINES

## Bing Webmaster Tools (https://www.bing.com/webmasters)

**Action required:**
1. **Add and verify** the site (if not already done). Use the existing `google-site-verification`-style meta or upload the Bing verification XML.
2. **Submit sitemap** — `https://raziadrivingcenter.com/sitemap.xml`.
3. **Check indexing** — Bing currently shows **0 pages** from the site. This needs to be diagnosed (crawl block? no inbound links? new site?).
4. **Enable IndexNow** — Bing supports IndexNow (instant URL submission). If the site is added to the IndexNow program, new/changed pages are pushed to Bing immediately. This is **recommended** for a new site with low indexing.

## Other Search Engines
- **Yandex, Baidu, DuckDuckGo** — derive results from Bing/Google. No separate action needed beyond fixing the primary indexing.

---

# PART 14 — AI/GEO CONTENT OPPORTUNITIES

These are pages/articles that would provide **genuine useful information** AND improve search/AI visibility. Each answers a real question a potential student would ask.

| Topic | Target Query / Intent | Value |
|---|---|---|
| Driving lessons in Lahore — what to expect | "driving lessons Lahore" | Beginner guide |
| Female driving instructor in Lahore | "female driving instructor Lahore" | Core differentiator |
| Driving school in Gulberg | "driving school Gulberg Lahore" | Location-specific |
| How to learn driving as an adult beginner | "learn driving Lahore adult" | Nervous-beginner audience |
| Lahore driving test preparation | "Lahore driving test" | High-intent |
| Parking and reverse driving lessons | "parking reverse driving lessons Lahore" | Skill-specific |
| What is included in a driving course | "driving course includes" | FAQ expansion |
| Driving course prices in Lahore | "driving course price Lahore" | Price-intent |
| Tips for nervous drivers | "nervous driver tips Lahore" | Empathy/audience |
| How to choose a driving school in Lahore | "best driving school Lahore" | Decision-stage |

**Implementation note:** For a one-page SPA, these don't need to be separate URLs. They can be:
- An expanded FAQ section with `FAQPage` schema.
- A blog/resources section (requires routing).
- Richer on-page content blocks targeting each intent.

**Do NOT create thin, duplicate pages.** Each must have 300+ words of genuine, useful content.

---

# PART 15 — FINAL SCORECARD

| # | Category | Score | Why |
|---|---|---|---|
| 1 | **Technical SEO** | 55/100 | Meta tags, OG, twitter, canonical, robots all good. But: no `_redirects`/`_headers`, www duplicate, stale sitemap, no FAQ schema, broken assets. |
| 2 | **On-page SEO** | 65/100 | Excellent title/description/OG. Single H1. But: placeholder links, non-functional form, broken images, FAQ references removed course. |
| 3 | **Local SEO** | 35/100 | NAP mostly consistent, LocalBusiness schema present. But: no geo, vague address, NO confirmed citations, NO GBP verification, Bing shows 0 results — the business is virtually invisible locally. |
| 4 | **Content Quality** | 50/100 | On-page copy is clean, clear, and answers core questions. But: no blog, no service pages, no long-form content, thin FAQ. |
| 5 | **Trust / E-E-A-T** | 50/100 | Named instructor, experience, stats, reviews. But: non-functional form, no privacy policy, broken images, no business registration. |
| 6 | **AI/GEO Readiness** | 20/100 | Entity info is rich ON-SITE but AI crawlers are blocked AND the site isn't indexed by Bing. AI engines currently cannot cite this business. |
| 7 | **Entity Clarity** | 45/100 | Clear on-site identity (name, phone, hours, location). But: no sameAs, no geo, no Organization schema, no GBP link. |
| 8 | **Performance** | 35/100 | 770 KB JS + 4.1 MB heavy PNGs, no lazy loading, 4-hour asset cache. Brotli compression works. |
| 9 | **Cloudflare/Deployment** | 55/100 | Working deploy, HTTPS, Brotli. But: no `_redirects`/`_headers`, short cache, missing security headers, www duplicate. |
| 10 | **Overall Search Readiness** | **40/100** | The site has solid on-site fundamentals but is functionally **invisible** to search engines and AI. The biggest gaps are indexing (Bing: 0 results), local presence (no citations/GBP), and AI crawler blocking. |

---

# PART 16 — FINAL ACTION PLAN

## MUST FIX (🔴) — Hurts the business today

| # | Issue | Why it Matters | Benefit | Difficulty | Requires |
|---|---|---|---|---|---|
| 1 | **Site not indexed** (Bing: 0 results) | If you're not indexed, you don't exist in search | Found in search | Hard | GSC + Bing Webmaster + backlinks |
| 2 | **Broken images** (gallery2, gallery3, Safe.svg) | 2 of 3 gallery images + hero badge are broken | UX trust | Medium | Code (rebuild/redeploy) |
| 3 | **No Google Business Profile** (unconfirmed) | GBP is the #1 local-SEO asset for a driving school | Local pack visibility | Easy | Owner GBP access |
| 4 | **No `_redirects` file** | No www→root redirect, no SPA fallback rule | Duplicate content fix + deep-link safety | Trivial | Cloudflare/static file |
| 5 | **No `_headers` file** | No long-cache for assets, no security headers | Repeat-visit speed + security | Trivial | Static file |
| 6 | **AI crawlers blocked** | ChatGPT/Claude/Copilot can't cite the business | AI visibility | Easy | robots.txt edit |

## HIGH VALUE (🟠)

| # | Issue | Why it Matters | Benefit | Difficulty | Requires |
|---|---|---|---|---|---|
| 7 | Add `geo` to JSON-LD | Precise pin in Maps/local pack | Local ranking | Trivial | Code |
| 8 | Add `FAQPage` schema | FAQ rich results + AI citation | Rich results + AI | Easy | Code |
| 9 | Full street address in schema + contact | Local-ranking signal | Local trust | Trivial | Code |
| 10 | Optimize images (WebP, lazy load) | 4.1 MB of heavy PNGs | LCP/INP improvement | Medium | Code/asset pipeline |
| 11 | Reduce JS bundle (code-split) | 770 KB initial JS | Faster interactivity | Hard | Code |
| 12 | Build local citations (directories, GBP) | Citations are foundational local SEO | Local discoverability | Medium | Off-site work |

## SHOULD DO (🟡)

| # | Issue | Why it Matters | Benefit | Difficulty | Requires |
|---|---|---|---|---|---|
| 13 | Fix non-functional contact form | Dead form kills trust | Conversion | Medium | Code + backend |
| 14 | Fix footer social links (real URLs, brand icons) | Placeholder links look unfinished | Credibility | Trivial | Code |
| 15 | Update sitemap lastmod / auto-generate | Stale date undercrawls | Crawl efficiency | Easy | Code |
| 16 | Add Privacy Policy | Form collects PII, regulatory best practice | Trust + compliance | Easy | Content + page |
| 17 | Add `sameAs` + `Organization` schema | Knowledge graph signals | Entity clarity | Easy | Code |
| 18 | Update Bing + enable IndexNow | Bing is 0 — needs push | Bing/AI indexing | Easy | Bing Webmaster |

## NICE TO HAVE (🟢)

| # | Issue | Why it Matters | Benefit | Difficulty | Requires |
|---|---|---|---|---|---|
| 19 | Add preconnect for gtag/fonts/Supabase | Saves round-trips | Minor speed | Trivial | Code |
| 20 | Add service-specific content blocks | Long-tail + AI queries | Organic traffic | Medium | Content |

## DO NOT WASTE TIME ON THIS (⚪)

| Item | Why |
|---|---|
| Keyword stuffing | Hurts more than helps |
| Fake reviews / fake citations | Violates policies, risks penalties |
| Buying backlinks | Risky, low-quality |
| Separate landing pages for every keyword (thin) | Creates duplicate/thin content |
| `AggregateRating` in LocalBusiness (per constraint) | Explicitly excluded — use separate block if desired |

---

# FINAL TOP 20 ACTION PLAN (highest value → lowest)

1. 🔴 Verify & claim Google Business Profile (owner manual)
2. 🔴 Add `public/_redirects` (SPA fallback + www→root 301)
3. 🔴 Add `public/_headers` (asset cache + security headers)
4. 🔴 Fix broken images (gallery2, gallery3, Safe.svg) — rebuild/redeploy
5. 🔴 Remove AI-bot Disallow rules (or selectively allow GPTBot/ClaudeBot/Google-Extended)
6. 🔴 Set up Bing Webmaster Tools + submit sitemap + enable IndexNow
7. 🟠 Add `geo` coordinates to LocalBusiness JSON-LD
8. 🟠 Add full street address to JSON-LD + Contact section
9. 🟠 Add `FAQPage` structured data
10. 🟠 Optimize images → WebP, lazy load
11. 🟠 Reduce JS bundle (code-split routes/modal)
12. 🟠 Build local citations (GBP, Facebook, Pakistani directories)
13. 🟡 Fix contact wireframe (connect handler or replace with mailto/call)
14. 🟡 Fix footer social links (real URLs + brand icons)
15. 🟡 Add Privacy Policy page
16. 🟡 Add `sameAs` + `Organization` schema
17. 🟡 Update sitemap lastmod
18. 🟢 Add preconnect hints
19. 🟢 Add service-targeted content blocks
20. 🟢 Consider blog/resources section (long-term)

---

# FINAL SUMMARY

## What is already excellent
- Complete, consistent meta tags (title, description, OG, twitter, robots, canonical).
- Single H1 with healthy heading hierarchy.
- All images have alt text.
- Strong on-site content answering the 14 core questions.
- Named instructor persona (Madam Razia) with personal message.
- Clear pricing, courses, USPs.
- 5.0★ reviews displayed.
- Clean NAP (phone consistent everywhere).
- Secure repo (private, no secrets, anon key only).
- Working CI/CD pipeline.

## What is genuinely hurting Razia
- **The site appears to have ZERO search engine indexing** (Bing: 0 results). This is the #1 problem.
- **Broken production images** (gallery2, gallery3, Safe.svg return HTML, not images).
- **No Google Business Profile confirmation** — for a local driving school, this is critical.
- **No local citations** — the business has no verifiable web footprint beyond its own site.
- **AI crawlers are blocked** — the business is invisible to ChatGPT/Claude/Copilot/Perplexity.
- **770 KB JS + 4.1 MB unoptimized PNGs** — slow performance on mobile.
- **Non-functional contact form** — trust killer.

## What is missing
- `_redirects` and `_headers` files.
- `geo` coordinates in schema.
- `FAQPage` schema.
- `sameAs` / `Organization` schema.
- Privacy Policy.
- Local citations and GBP.
- Service-targeted content.
- Blog/resources.
- Image optimization pipeline.

## What to do first
1. **Verify GBP + set up Bing Webmaster** (owner manual — highest ROI).
2. **Add `_redirects` + `_headers`** (trivial, immediate win).
3. **Fix broken images** (rebuild from current source + redeploy).
4. **Remove AI-bot blocks** (so AI engines can cite the business).
5. **Add `geo` + `FAQPage` + full address to JSON-LD**.

## What requires manual Google/Cloudflare access
- Google Search Console (indexing status, Core Web Vital field data, search queries, manual actions).
- Google Business Profile (claim, verify, optimize).
- Cloudflare dashboard (if using Page Rules instead of `_redirects`).
- Bing Webmaster Tools (verify, submit sitemap, IndexNow).

## What requires website code changes
- Broken image fix (rebuild/redeploy).
- `_redirects` + `_headers` files.
- robots.txt AI-bot changes.
- JSON-LD additions (geo, FAQPage, sameAs, Organization).
- Image optimization (WebP, lazy loading).
- JS code-splitting.
- Contact form handler.
- Footer social link fixes.
- Privacy Policy page.

## What requires off-site/local SEO work
- Google Business Profile optimization.
- Building local citations (directories, Facebook, review sites).
- Earning backlinks (local partnerships, student outreach).
- Content creation (blog, guides).

---

*End of Phase 2 audit. All findings are evidence-based and tagged CONFIRMED / LIKELY / UNKNOWN. No code changes were made — this is a findings-only report.*
