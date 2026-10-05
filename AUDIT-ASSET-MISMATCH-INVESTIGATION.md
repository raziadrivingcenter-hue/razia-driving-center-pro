# PRODUCTION ASSET MISMATCH — INVESTIGATION REPORT

**Date:** 2026-09-15
**Trigger:** Phase 2 live audit flagged `/assets/gallery2.png`, `/assets/gallery3.png`, `/assets/Safe.svg`, `/assets/Steering.svg` as "broken" (returned SPA HTML instead of images).
**Conclusion below. No files were modified.**

---

# ROOT CAUSE

**There is no deployment mismatch and no broken asset.** The Phase 2 audit's "broken" URLs were a **false positive** caused by testing URLs the application never uses. Two separate, legitimate Vite behaviors explain every flagged file:

1. **Gallery image deduplication** — `gallery2.png` and `gallery3.png` are **byte-identical copies** of `gallery1.png` (same MD5 hash, same 2,475,180 bytes). Vite deduplicates assets by content hash, so all three collapse into a single emitted file `gallery1-Bp6tqiC-.png`. The build references it three times. The gallery shows the same photo three times (a cosmetic/content issue, NOT a broken asset).

2. **SVG inlining** — `Safe.svg` (1,573 bytes) and `Steering.svg` (3,690 bytes) are both under Vite's `assetsInlineLimit` (default 4,096 bytes). Vite inlines them as `data:image/svg+xml;base64,...` data URIs inside the JavaScript bundle instead of emitting separate `.svg` files. This is correct, intended behavior. They render perfectly — they just aren't separate files on disk.

The live production deployment is **in full agreement** with a fresh local build from the current source. Both produce identical asset hashes, identical gallery-dedup arrays, and identical SVG inlining.

---

# EVIDENCE

## A. The three gallery files are byte-identical

| File | Size | MD5 |
|---|---|---|
| `src/assets/gallery/gallery1.png` | 2,475,180 bytes | `055ec2eab99e41cf1e31ead8150f574d` |
| `src/assets/gallery/gallery2.png` | 2,475,180 bytes | `055ec2eab99e41cf1e31ead8150f574d` |
| `src/assets/gallery/gallery3.png` | 2,475,180 bytes | `055ec2eab99e41cf1e31ead8150f574d` |

Same size, same MD5 → identical content. Verified with Windows `certutil -hashfile`.

## B. Fresh build JS contains the deduplicated gallery array

In `dist/assets/index-C_EKo9ve.js`:
```js
var gx=[`/assets/gallery1-Bp6tqiC-.png`,`/assets/gallery1-Bp6tqiC-.png`,`/assets/gallery1-Bp6tqiC-.png`]
```
All three slots point to the same hashed file. This is correct Vite deduplication.

## C. Live production JS is identical in behavior

In the live `assets/index-z3tjznmj.js` (downloaded from https://raziadrivingcenter.com):
```js
var gx=[`/assets/gallery1-Bp6tqiC-.png`,`/assets/gallery1-Bp6tqiC-.png`,`/assets/gallery1-Bp6tqiC-.png`]
```
Same dedup array. 3 references to `gallery1`. Live matches the fresh build exactly.

## D. Safe.svg and Steering.svg are inlined as data URIs

Fresh build JS contains:
```
data:image/svg+xml,%3c?xml%20version='1.0'...
```
This is the inlined SVG (URL-decoded: `<?xml version='1.0'...`). Both files are under 4 KB:
- `Safe.svg` = 1,573 bytes
- `Steering.svg` = 3,690 bytes

Live JS also contains the same `data:image/svg+xml` inlining. Confirmed working in production.

## E. Asset hashes are identical across live and fresh build

| Asset | Live hash | Fresh build hash | Match |
|---|---|---|---|
| gallery1 | `gallery1-Bp6tqiC-.png` | `gallery1-Bp6tqiC-.png` | YES |
| instructor | `instructor-Bkp167sH.png` | `instructor-Bkp167sH.png` | YES |
| logo | `logo-6gh2466G.png` | `logo-6gh2466G.png` | YES |
| logo-white | `logo-white-COM4F3DO.png` | `logo-white-COM4F3DO.png` | YES |
| Car | `Car-BThxzOjV.svg` | `Car-BThxzOjV.svg` | YES |
| google-logo | `google-logo-Dwvx0WTm.png` | `google-logo-Dwvx0WTm.png` | YES |
| PDF guide | `driving-course-guide-Bf6XWTvx.pdf` | `driving-course-guide-Bf6XWTvx.pdf` | YES |

Identical content hashes = the live deployment was built from the same source. No stale deployment.

## F. Physical file-type verification (all valid)

| File | `file` command result |
|---|---|
| gallery1/2/3.png | PNG image data, 1672 x 941, 8-bit/color RGB |
| Safe.svg | SVG XML document |
| Steering.svg | SVG Scalable Vector Graphics image |
| instructor.png | PNG image data, 1254 x 1254 |
| logo.png | PNG image data, 2302 x 253, RGBA |
| hero.png | PNG image data, 1536 x 1024 (valid but UNUSED) |

All source files are valid. No corruption, no format mismatch.

---

# CURRENT SOURCE ASSETS

Located at `src/assets/`:

| File | Size | Type | Used? |
|---|---|---|---|
| `gallery/gallery1.png` | 2,475,180 B | PNG 1672×941 | YES — Gallery.jsx |
| `gallery/gallery2.png` | 2,475,180 B | PNG 1672×941 | YES — Gallery.jsx (but identical to gallery1) |
| `gallery/gallery3.png` | 2,475,180 B | PNG 1672×941 | YES — Gallery.jsx (but identical to gallery1) |
| `Safe.svg` | 1,573 B | SVG | YES — Hero.jsx (inlined, <4KB) |
| `Steering.svg` | 3,690 B | SVG | YES — LoadingScreen.jsx (inlined, <4KB) |
| `instructor/instructor.png` | 1,644,010 B | PNG 1254×1254 | YES — Instructor.jsx |
| `logo.png` | 27,589 B | PNG 2302×253 | YES — Navbar.jsx |
| `logo-white.png` | 155,774 B | PNG 2310×1096 | YES — LoadingScreen.jsx, Footer |
| `Car.svg` | 6,349 B | SVG | YES — (>4KB, emitted as file) |
| `google-logo.png` | 14,422 B | PNG | YES — GoogleReviews |
| `driving-course-guide.pdf` | 3,720,532 B | PDF | YES — Hero.jsx download |
| `hero.png` | valid PNG 1536×1024 | PNG | **NO — dead/unused file** |
| `bronzplate.png` | PNG | PNG | **NO — dead/unused file** |
| `goldplate.png` | PNG | PNG | **NO — dead/unused file** |
| `silverplate.png` | PNG | PNG | **NO — dead/unused file** |

Import locations:
- Gallery.jsx lines 4-6: imports gallery1, gallery2, gallery3
- Hero.jsx line 1: imports Safe.svg
- LoadingScreen.jsx line 1: imports Steering.svg
- hero.png, bronzplate.png, goldplate.png, silverplate.png: **not imported anywhere in src/**

---

# GENERATED DIST ASSETS

`dist/assets/` contents (fresh build, 2026-09-15):

| Emitted file | Source | Why |
|---|---|---|
| `gallery1-Bp6tqiC-.png` | gallery1/2/3.png | Deduplicated (all 3 identical) → 1 file |
| `instructor-Bkp167sH.png` | instructor.png | >4KB, unique → emitted |
| `logo-6gh2466G.png` | logo.png | >4KB, unique → emitted |
| `logo-white-COM4F3DO.png` | logo-white.png | >4KB, unique → emitted |
| `Car-BThxzOjV.svg` | Car.svg | 6,349 B > 4KB → emitted as file |
| `google-logo-Dwvx0WTm.png` | google-logo.png | >4KB, unique → emitted |
| `driving-course-guide-Bf6XWTvx.pdf` | PDF | always emitted |

**NOT emitted (correctly):**
- gallery2.png, gallery3.png → deduplicated into gallery1
- Safe.svg, Steering.svg → inlined as data URIs (under 4KB)
- hero.png, plate images → unused, tree-shaken out

---

# LIVE PRODUCTION ASSETS

Verified via `curl` against https://raziadrivingcenter.com:

| URL | Status | Content-Type | Size | Verdict |
|---|---|---|---|---|
| `/assets/gallery1-Bp6tqiC-.png` | 200 | image/png | 2,475,180 | WORKS |
| `/assets/instructor-Bkp167sH.png` | 200 | image/png | 1,644,010 | WORKS |
| `/assets/logo-6gh2466G.png` | 200 | image/png | 27,589 | WORKS |
| `/assets/logo-white-COM4F3DO.png` | 200 | image/png | 155,774 | WORKS |
| `/assets/Car-BThxzOjV.svg` | 200 | image/svg+xml | 6,349 | WORKS |
| `/assets/google-logo-Dwvx0WTm.png` | 200 | image/png | 14,422 | WORKS |
| `/assets/driving-course-guide-Bf6XWTvx.pdf` | 200 | application/pdf | 3,720,532 | WORKS |
| `/assets/gallery2.png` (raw) | 200 | text/html | 3,997 | SPA fallback — **never used by app** |
| `/assets/gallery3.png` (raw) | 200 | text/html | 3,997 | SPA fallback — **never used by app** |
| `/assets/Safe.svg` (raw) | 200 | text/html | 3,997 | SPA fallback — **inlined in JS, not a separate file** |
| `/assets/Steering.svg` (raw) | 200 | text/html | 3,997 | SPA fallback — **inlined in JS, not a separate file** |

The 4 "broken" URLs are raw/unhashed paths the app never requests. The app uses the content-hashed and inlined versions, all of which work.

---

# SOURCE vs DIST vs LIVE MISMATCH

**There is no mismatch.** All three are consistent:

| Aspect | Source | Dist (fresh) | Live | Consistent? |
|---|---|---|---|---|
| Gallery array | 3 images (identical) | 3 refs to gallery1 hash | 3 refs to gallery1 hash | YES |
| Safe.svg | imported, 1573 B | inlined as data URI | inlined as data URI | YES |
| Steering.svg | imported, 3690 B | inlined as data URI | inlined as data URI | YES |
| Asset hashes | content-based | gallery1-Bp6tqiC-.png etc. | identical hashes | YES |
| hero.png | unused | not emitted | not present | YES |
| plate images | unused | not emitted | not present | YES |

The Phase 2 audit compared against expected hashed filenames for gallery2/gallery3/Safe/Steering that **will never exist** because of dedup + inlining. That was the misinterpretation, not a real mismatch.

---

# MINIMUM FIX

The only real issue is cosmetic: **the gallery shows the same image three times** because gallery2.png and gallery3.png are copies of gallery1.png.

**Minimum change to fix the visible problem:**

1. Replace `src/assets/gallery/gallery2.png` with a genuinely different photo.
2. Replace `src/assets/gallery/gallery3.png` with a genuinely different photo.

Then rebuild + redeploy. Vite will emit three distinct hashed files and the gallery will show three different images.

**No other changes are required:**
- Safe.svg and Steering.svg are NOT broken. Do not "fix" them. Inlining is correct and saves an HTTP request each.
- hero.png and the three plate images are dead files. Optional: delete for cleanliness (no build impact either way).

---

# FILES THAT WOULD CHANGE

To fix the gallery:

| File | Action |
|---|---|
| `src/assets/gallery/gallery2.png` | Replace with a different image |
| `src/assets/gallery/gallery3.png` | Replace with a different image |

Optional cleanup (not required):

| File | Action |
|---|---|
| `src/assets/hero.png` | Delete (unused) |
| `src/assets/bronzplate.png` | Delete (unused) |
| `src/assets/goldplate.png` | Delete (unused) |
| `src/assets/silverplate.png` | Delete (unused) |

---

# WILL A FRESH BUILD + REDEPLOY FIX IT?

**NO — not by itself.**

A fresh build from the current source will produce the **exact same output** the live site already has, because:
- gallery2.png and gallery3.png are still identical to gallery1.png → still deduplicated to one file.
- Safe.svg and Steering.svg are still under 4KB → still inlined.

The live site already reflects the current source perfectly. Rebuilding without changing the source will change nothing visible.

**To actually fix the gallery, the source image files must be replaced first** (gallery2.png, gallery3.png → different photos), THEN rebuild + redeploy.

---

# RISK / SIDE EFFECTS

**If gallery2/gallery3 are replaced with different images:**
- Build will emit 3 distinct hashed PNG files (larger total asset footprint, negligible).
- Gallery shows 3 different photos. No other component affected.
- No risk to Safe.svg, Steering.svg, or any other asset.

**If someone incorrectly "fixes" Safe.svg / Steering.svg by forcing them to be emitted as files** (e.g., raising assetsInlineLimit or importing differently):
- Would add 2 extra HTTP requests for ~1.5KB and ~3.7KB of SVG — worse for performance, not better.
- No visual change (data URI renders identically to file).
- **Do not do this.**

**If dead files (hero.png, plate images) are deleted:**
- Zero build/runtime impact (they are not imported).
- Slightly cleaner source tree. Purely optional.

---

# SUMMARY

| Question | Answer |
|---|---|
| Are production assets broken? | **No** |
| Is there a deployment mismatch? | **No** — live matches fresh build exactly |
| Why did gallery2/3/Safe/Steering "fail" the live audit? | Audit tested raw paths the app never uses; dedup + inlining mean those exact filenames never exist |
| What is the real visible issue? | Gallery shows the same photo 3× because gallery2/3 are copies of gallery1 |
| Root cause? | Duplicate source image files + correct Vite dedup/inlining behavior |
| Will fresh build + redeploy fix it? | **No** — source images must change first |
| Minimum files to change? | 2 files: `gallery2.png`, `gallery3.png` (replace with different photos) |
| Are Safe.svg / Steering.svg broken? | **No** — correctly inlined as data URIs |
