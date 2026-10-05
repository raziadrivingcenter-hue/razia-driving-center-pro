# Razia Driving Center — Full Website Audit Report

**Site:** https://raziadrivingcenter.com
**Date:** 2026-09-15
**Scope:** Technical SEO · On-Page SEO · Local SEO · AI/GEO Readiness · Content · Trust Signals · Performance · Cloudflare + GitHub Deployment
**Method:** Source-level audit of the React/Vite codebase (build output + components + config). No live HTTP probing — findings are from code inspection.

Priority key: **CRITICAL** > **HIGH** > **MEDIUM** > **LOW**

---

## 1. PERFORMANCE ⚡

### CRITICAL — JavaScript bundle far exceeds recommended size
- **Finding:** Built JS bundle `index-B05walWS.js` = **754 KB**. Vite itself warns when a chunk exceeds **500 KB**.
- **Why it matters:** A 754 KB JS bundle must be downloaded, parsed, and executed before the page is interactive. On mid/low-end mobile connections (typical in Pakistan's mobile-heavy market) this directly hurts Largest Contentful Paint (LCP) and Interaction to Next Paint (INP), which are Google ranking factors.
- **Evidence:** `npx vite build` emits the >500K warning for `index`.

### CRITICAL — Unoptimized PNG images (multiple MBs, no modern formats)
- **Finding:** Hero, gallery, and instructor images are full-resolution PNGs with no WebP/AVIF alternative and no lazy loading on the heaviest ones:
  - `gallery1.png / gallery2.png / gallery3.png` — **~2.4 MB each**
  - `hero.png` — **~2.3 MB**
  - `instructor.png` — **~1.6 MB**
  - `og-image.png` — **488 KB**
- **Why it matters:** These 5 images alone total **~9.1 MB**. That is the single largest drain on load time. Modern formats (WebP/AVIF) would cut each by 50–80% with no visible quality loss.
- **Evidence:** `public/` image assets; no `<picture>`/source switching; no `loading="lazy"` on hero/instructor.

### MEDIUM — No lazy loading on above-the-fold heavy images
- **Finding:** `hero.png` and `instructor.png` are loaded eagerly. Only gallery images are lazy (inside a slider/carousel).
- **Why it matters:** Off-screen images should be deferred so the visible page paints first.

### LOW — No resource hints (preconnect/dns-prefetch) for third-party origins
- **Finding:** No `<link rel="preconnect">` for `https://www.googletagmanager.com`, `https://fonts.gstatic.com`, or the Supabase origin.
- **Why it matters:** Saves a round-trip on first load to each third-party domain.

---

## 2. TECHNICAL SEO 🔧

### CRITICAL — No `_redirects` / `_headers` for Cloudflare Pages
- **Finding:** No `public/_redirects` and no `public/_headers` file. On a SPA served by Cloudflare Pages:
  - No SPA fallback (`/*  /index.html  200`) — direct visits to deep links (if any) may 404.
  - No canonical `www → root` (or `root → www`) redirect.
  - No long-lived cache headers for hashed assets (`assets/*`).
  - No security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **Why it matters:** Without a redirect rule, `www.raziadrivingcenter.com` and `raziadrivingcenter.com` may both resolve, splitting link equity. Without cache headers, repeat visits re-download the large JS bundle and images.
- **Evidence:** `public/` contains only `robots.txt`, `sitemap.xml`, images, favicon.

### HIGH — Sitemap `lastmod` is stale
- **Finding:** `sitemap.xml` has `<lastmod>2026-07-17</lastmod>`. The site has had multiple commits since (latest `a59b639`).
- **Why it matters:** Search engines use `lastmod` to prioritize recrawling. A 2-month-old date undercrawls a freshly updated site.
- **Evidence:** `public/sitemap.xml`.

### MEDIUM — No FAQ structured data
- **Finding:** `FAQ.jsx` renders 6 Q&A pairs visually but emits **no `FAQPage` JSON-LD**.
- **Why it matters:** `FAQPage` schema is eligible for rich results (accordion-style Q&A in Google). This is a zero-effort rich-result opportunity being left on the table.
- **Evidence:** `src/components/FAQ.jsx` — HTML only, no `<script type="application/ld+json">`.

### LOW — `robots.txt` is functional but minimal
- **Finding:** `User-agent: * / Allow: / / Sitemap: …` — correct and references the sitemap. No `Disallow` rules, no crawl-delay.
- **Why it matters:** Acceptable for a small static site. Only improvement would be disallowing any future admin/booking endpoints if they're ever added.

---

## 3. ON-PAGE SEO 📄

### HIGH — Stale content references removed courses
- **Finding:** Two components still advertise courses that were **removed from `courses.js`**:
  - `FooterLinks.jsx` lists **"Economy Driving Course"**, **"Pro Driver Course"**, **"Own Vehicle Training"**.
  - `FAQ.jsx` Q1 references **"Pro Driver"** and **"Own Vehicle training packages"**.
- **Why it matters:** Users clicking these see nothing matching the label → dead ends, higher bounce, eroded trust. If these URLs/promises existed in Google's index, they now look like content decay.
- **Evidence:** `src/components/Footer/FooterLinks.jsx`, `src/components/FAQ.jsx`.

### MEDIUM — Footer social links are placeholders
- **Finding:** `FooterBottom.jsx` renders social icons — **all use the generic `MessageCircle` icon** (not Instagram/Facebook/WhatsApp-specific icons) and **2 of the links are `href="#"`** (dead placeholders).
- **Why it matters:** Placeholder links look unfinished and hurt credibility; generic icons miss brand-recognition signals.
- **Evidence:** `src/components/Footer/FooterBottom.jsx` lines ~74, ~110.

### LOW — Single H1 is correct; hierarchy is healthy
- **Finding:** Exactly **one `<h1>`** in `Hero.jsx`. Section headings use `h2`/`h3` appropriately.
- **Verdict:** Good — no action needed.

### LOW — Meta tags are complete
- **Finding:** Title, description, keywords, author, robots, canonical, theme-color, full Open Graph set (including `og:image:width/height/type`, `og:locale=en_PK`), Twitter card (summary_large_image), and `google-site-verification` all present and internally consistent.
- **Verdict:** Good.

### LOW — Images have alt text
- **Finding:** All checked `<img>` tags (Gallery, GoogleReviews, ReviewCard, Hero, Instructor, Navbar logo) carry `alt` attributes.
- **Verdict:** Good.

---

## 4. LOCAL SEO 📍

### HIGH — JSON-LD has no geo coordinates
- **Finding:** `LocalBusiness` schema includes address, phone, hours, priceRange, areaServed — but **no `geo`** object, even though exact coordinates exist in `MapSection.jsx` (`31.5201889, 74.3575145`).
- **Why it matters:** `geo` helps Google place the pin precisely in local pack / Maps results.
- **Evidence:** `index.html` JSON-LD vs `src/components/MapSection.jsx`.

### MEDIUM — Street address is vague
- **Finding:** `streetAddress` = **"Gulberg"** (area only). `Contact.jsx` says "Gulberg, Lahore, Pakistan"; `MapSection.jsx` has the precise "Plot 28/a, S Block, Gulberg II, Lahore, Pakistan".
- **Why it matters:** A full, consistent street address across schema + on-page + Google Business Profile is a local-ranking signal. The precise address exists in code but isn't used in the schema or contact section.
- **Evidence:** `index.html` JSON-LD, `src/components/Contact.jsx`, `src/components/MapSection.jsx`.

### LOW — NAP is consistent (phone/email/hours)
- **Finding:** Phone `+92 309 4461407`, email `raziadrivingcenter@gmail.com`, hours Mon–Sun 8AM–8PM are consistent across Contact, MapSection, and JSON-LD.
- **Verdict:** Good — just needs the address precision fix above.

### LOW — No Google Business Profile / Places integration
- **Finding:** No GBP embed, no "view on Google Maps" rich link beyond the basic directions link.
- **Why it matters:** For a local driving school, GBP is the #1 local-SEO asset. Worth owning even if not in code.

---

## 5. AI / GEO READINESS 🤖

*(GEO = Generative Engine Optimization — how well AI answer engines / LLMs can read and cite the site.)*

### HIGH — No FAQ structured data (repeats from Technical)
- **Why it matters for AI:** AI engines heavily weight Q&A-style structured content. Without `FAQPage` schema, the site is less likely to be cited for "driving school Lahore" questions.
- **Fix:** Add `FAQPage` JSON-LD mirroring the 6 visible Q&As.

### MEDIUM — Service-level detail is thin
- **Finding:** Courses are listed with price/duration/features, but there's no **dedicated "Services" schema** (`Service` type) and no per-service landing content (e.g., "Female-only driving lessons in Gulberg", "Crash course for license test").
- **Why it matters:** AI answers long-tail queries ("female driving instructor near Gulberg", "2-day crash course Lahore"). Richer, targeted content wins citations.

### MEDIUM — Reviews are visible but not structured
- **Finding:** `GoogleReviews/reviewsData.js` stores 6 five-star reviews and they render on-site, but there is **no `AggregateRating` or `Review` schema** in JSON-LD.
- **Why it matters:** `AggregateRating` can produce star-rich results in Google and is a strong trust signal for AI summarization.
- **Constraint note:** User explicitly told me NOT to add aggregateRating/review to the existing LocalBusiness markup. A **separate** `AggregateRating` block (not nested in LocalBusiness) would satisfy both the constraint and the SEO need — flag before implementing.

### LOW — Content is well-structured and factual
- **Finding:** Real stats ("5000+ Students", "20+ Years"), real NAP, clear course descriptions, real review quotes. This is exactly the kind of entity-dense, factual content AI engines prefer over marketing fluff.
- **Verdict:** Strong foundation.

---

## 6. TRUST SIGNALS 🛡️

### MEDIUM — Contact form is non-functional (client-only)
- **Finding:** `Contact.jsx` has a `<form>` with name/email/phone/message inputs but **no `action`, no handler, no submission logic** — the "Send Message" button does nothing.
- **Why it matters:** A dead form is a trust killer. Users type a message and nothing happens → perceived as broken/abandoned.
- **Evidence:** `src/components/Contact.jsx` lines 145–184.

### LOW — Real social-proof stats present
- **Finding:** "5000+ Students", "20+ Years Experience", 6 named 5-star reviews with real-sounding names.
- **Verdict:** Good — consider adding review dates/photos for extra authenticity.

### LOW — No privacy policy / terms links
- **Finding:** Footer has no Privacy Policy or Terms of Service links. The contact form collects personal data (name, email, phone, message) without a privacy notice.
- **Why it matters:** Regulatory best practice (and required if you ever run ads or process EU data). Also a trust signal.

---

## 7. CONTENT 📝

### HIGH — Stale course references (repeats from On-Page)
- **Action:** Update `FooterLinks.jsx` and `FAQ.jsx` to match current 3-course lineup (Basic Plan, Economy/PLUS, Pro/PRO+) and remove "Own Vehicle Training".

### MEDIUM — No blog / resource hub
- **Finding:** Zero editorial content. A driving school blog ("How to pass your Lahore driving test", "5 tips for nervous drivers", "What to expect in your first lesson") is the highest-ROI organic-traffic channel and a rich source for AI citations.
- **Why it matters:** Static sites rely on inbound links and queries. A blog creates indexable, linkable, citable content.

### LOW — Copy is clean and on-brand
- **Finding:** Tone is professional, consistent ("female instructor", "one-to-one", "real Lahore traffic", "Gulberg"). No spelling/grammar issues spotted.
- **Verdict:** Good.

---

## 8. CLOUDFLARE + GITHUB DEPLOYMENT ☁️

### MEDIUM — No `public/_headers` for caching/security
- **Finding:** Hashed Vite assets (`assets/index-*.js`, `*.css`) are served with default (short) cache TTL. No `Cache-Control: max-age=31536000, immutable` for hashed files. No security headers file.
- **Why it matters:** Repeat visitors re-download the 754 KB bundle and images. Missing `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` are minor but easy wins.
- **Fix:** Add `public/_headers` with rules for `assets/*` and global security headers.

### LOW — GitHub → Cloudflare Pages auto-deploy is working
- **Finding:** `main` branch pushes auto-deploy (latest deploy `a59b639`). Build command and output dir correctly configured.
- **Verdict:** Good pipeline.

### LOW — `.env.local` is secure
- **Finding:** `.env.local` (containing Supabase anon key + URL) is in `.gitignore`. Only the **anon** key is used in frontend (`src/lib/supabase.js`). No service_role key anywhere in client code or repo.
- **Verdict:** Compliant with security constraints. Do not change.

---

## PRIORITIZED REMEDIATION ROADMAP

### 🔴 Do first (biggest ranking + UX impact)
1. **Optimize images** — convert hero/gallery/instructor PNGs → WebP (and AVIF where supported); add `<picture>` sources; lazy-load off-screen images. *(Saves ~6–7 MB)*
2. **Reduce JS bundle** — code-split (lazy-load routes/modal/booking wizard), audit heavy deps (framer-motion, lucide). Target < 400 KB initial.
3. **Add `public/_redirects`** — SPA fallback + `www → root` (or chosen canonical) redirect.
4. **Add `public/_headers`** — long cache for hashed assets + security headers.

### 🟠 Do next (rich results + local pack)
5. **Add `FAQPage` JSON-LD** to FAQ.jsx.
6. **Add `geo` coordinates** to LocalBusiness JSON-LD (use `31.5201889, 74.3575145`).
7. **Unify street address** — use full "Plot 28/a, S Block, Gulberg II, Lahore, Pakistan" in Contact, JSON-LD, footer.
8. **Update sitemap `lastmod`** to current date (ideally auto-generated at build).

### 🟡 Do after (content + trust)
9. **Fix stale content** — update FooterLinks.jsx + FAQ.jsx to current course lineup; remove "Own Vehicle Training".
10. **Fix footer social links** — replace placeholder `href="#"` and generic `MessageCircle` icons with real URLs + correct brand icons.
11. **Wire up or remove the contact form** — connect to a handler (Supabase insert, EmailJS, Formspree) or replace with a direct `mailto:` / click-to-call link.
12. **Add Privacy Policy page + footer link** (especially since the form collects PII).

### 🟣 Longer-term growth
13. **Add a blog / resources section** for organic traffic + AI citations.
14. **Consider a separate `AggregateRating` JSON-LD block** (not nested in LocalBusiness, per constraint) for star rich results.
15. **Claim & fully optimize Google Business Profile**; embed/verify on site.
16. **Add per-service landing content** (female instructor, crash course, license-test prep) for long-tail + AI queries.

---

## QUICK STATS

| Area | Status |
|---|---|
| JS bundle | 754 KB ⚠️ |
| Total hero images (PNG) | ~9.1 MB ⚠️ |
| H1 tags | 1 ✅ |
| Meta tags (title/desc/OG/twitter) | Complete ✅ |
| Image alt text | Present ✅ |
| JSON-LD | LocalBusiness present, no geo/FAQ/AggregateRating ⚠️ |
| Sitemap | Present, stale `lastmod` ⚠️ |
| robots.txt | Present ✅ |
| `_redirects` / `_headers` | Missing ⚠️ |
| Stale course refs | FooterLinks + FAQ ⚠️ |
| Social links | Placeholders ⚠️ |
| Contact form | Non-functional ⚠️ |
| Env security | anon key only, gitignored ✅ |
| Deploy pipeline | Working ✅ |

---

*End of audit. No code changes were made — this is a findings-only report.*
