# GBP vs WEBSITE — ALIGNMENT AUDIT

**Date:** 2026-09-16 | **Read-only** — no files modified.
**Source:** Full Google Business Profile data provided by owner (2026-09-16).

---

## KEY DISCREPANCY SUMMARY

| Field | Google Business Profile | Current Website | Action |
|---|---|---|---|
| **Opening hours** | **07:00–00:00** (7 AM–midnight) daily | 8:00 AM – 8:00 PM | ⚠️ VERIFY + FIX — 5-hour difference |
| **Phone (primary)** | `0305 4139635` (outdated on GBP) | `+92 309 4461407` | Website correct; GBP needs update |
| **Website URL** | `http://raziadrivingcenter.com/` (HTTP, no HTTPS) | `https://raziadrivingcenter.com` | GBP needs HTTPS update |
| **Address** | `28/a, S block, Gulberg 2, Lahore, 54660` | `Plot 28/a, S Block, Gulberg II, Lahore, Pakistan` | Minor format diff; JSON-LD incomplete |
| **Established** | December 2016 | Not mentioned | Add as trust signal |
| **Service area** | Lahore City, Gulberg 2, Gulberg III, Lahore Cantt. | "Lahore" / "Gulberg" only | Add specific areas |
| **Online classes** | Offered | Not mentioned | Add to content |
| **Appointment** | Not required | Not mentioned | Add as trust signal |

---

## 1. OPENING HOURS — CRITICAL DISCREPANCY

**GBP:** Monday–Sunday **07:00–00:00** (opens 7 AM, closes midnight)
**Website:** Monday–Sunday **8:00 AM – 8:00 PM**
**JSON-LD:** `08:00`–`20:00`

This is the single largest NAP conflict. The website shows closing at 8 PM; GBP says midnight. A customer arriving at 9 PM would find the website says "closed" but Google says "open."

**Files affected:**
- `src/components/Contact.jsx:123` — `8:00 AM – 8:00 PM`
- `src/components/MapSection.jsx:137` — `8:00 AM – 8:00 PM`
- `index.html:169-170` — `"opens": "08:00", "closes": "20:00"`

**⚠️ Owner must verify:** Is the business actually open until midnight (00:00), or is the GBP wrong and 8 PM is correct? Do NOT change until confirmed. If midnight is correct, update all three locations to 07:00–00:00.

---

## 2. PHONE — WEBSITE IS CORRECT

**GBP primary:** `0305 4139635` (old/outdated)
**GBP WhatsApp:** `https://wa.me/923094461407`
**Website:** `+92 309 4461407` everywhere (7 locations) ✅

The website uses the verified number. The GBP primary phone is the stale one. **Action is on the GBP side** (update GBP primary to `+92 309 4461407`), not the website. No website change needed.

---

## 3. WEBSITE URL IN GBP

**GBP shows:** `http://raziadrivingcenter.com/` (HTTP, not HTTPS)
**Should be:** `https://raziadrivingcenter.com/`

This is a GBP-side fix. Google may treat HTTP as less secure. Owner should update GBP website field to HTTPS.

---

## 4. ADDRESS

| Source | Value |
|---|---|
| **GBP** | `28/a, S block, Gulberg 2, Lahore, 54660` |
| **MapSection.jsx** | `Plot 28/a, S Block, Gulberg II, Lahore, Pakistan` |
| **Contact.jsx** | `Gulberg, Lahore, Pakistan` |
| **FooterLinks.jsx** | `Gulberg, Lahore, Pakistan` |
| **JSON-LD** | `streetAddress: "Gulberg"` (incomplete) |

**Issues:**
- JSON-LD streetAddress is just `"Gulberg"` — should be the full `28/a, S block, Gulberg 2`.
- JSON-LD missing `postalCode: "54660"`.
- JSON-LD missing `geo` coordinates (`31.5201889, 74.3575145` exist in MapSection but not schema).
- MapSection uses "Plot 28/a" / "Gulberg II" while GBP uses "28/a" / "Gulberg 2" — minor phrasing difference, same location.

**Files affected:** `index.html` (JSON-LD), `src/components/Contact.jsx`, `src/components/Footer/FooterLinks.jsx`.

---

## 5. MISSING GBP SIGNALS NOT ON WEBSITE

These are trust/SEO signals present in GBP that the website does NOT currently use:

| GBP Signal | Website Status | Recommendation |
|---|---|---|
| **Established December 2016** | ❌ Not mentioned | Add to About/footer. "Since 2016" or "Est. 2016" — strong E-E-A-T signal. |
| **Online classes offered** | ❌ Not mentioned | Add mention. GBP confirms it; website doesn't. |
| **Appointment not required** | ❌ Not mentioned | Add as trust signal ("Walk-ins welcome / No appointment needed"). |
| **Wheelchair-accessible entrance, car park, seating** | ❌ Not mentioned | Optional: add accessibility note. |
| **Service area: Gulberg 2, Gulberg III, Lahore Cantt.** | ⚠️ Partial | Website only says "Lahore" and "Gulberg". Add specific neighborhoods for local SEO. |
| **Cash only** | ⚠️ Implied | Website says "Payment on arrival / No card" — aligns. Could be clearer. |

---

## 6. SERVICE AREA EXPANSION

**GBP service areas:**
- Lahore City, Pakistan
- Gulberg 2, Pakistan
- Gulberg III, Pakistan
- Lahore Cantt., Pakistan

**Website currently mentions:** "Lahore", "Gulberg", "surrounding Lahore areas" (FAQ.jsx:33).

**Opportunity:** Add "Gulberg III" and "Lahore Cantt." to service area mentions for local SEO coverage. Currently missing entirely.

**Files affected:** `src/components/FAQ.jsx:33`, `src/components/Footer/FooterLinks.jsx`, `index.html` (areaServed — currently just "Lahore").

---

## 7. GBP DESCRIPTION vs WEBSITE COPY

**GBP description keywords/phrases not prominent on website:**
- "defensive driving techniques" — Hero.jsx mentions "defensive driving" ✅
- "traffic rules" — not explicitly named on website
- "busy and real-road conditions" — similar to "real Lahore traffic" ✅
- "flexible packages with and without pick & drop" — website mentions pick & drop but not "packages without"
- "friendly learning environment" — not explicitly stated
- "drive safely and independently" — similar messaging exists ✅

**Opportunity:** Weave "traffic rules," "friendly learning environment," and "packages with or without pick & drop" into on-page copy.

---

## 8. GBP SETTINGS TO REVIEW (GBP-side, not website)

| Setting | Current | Note |
|---|---|---|
| Women-owned | "Doesn't identify as women-owned" | Website is built entirely around "female instructor." Owner may want to review this GBP setting — it's inconsistent with the brand. |
| Website URL | HTTP | Should be HTTPS. |
| Primary phone | `0305 4139635` | Should be `+92 309 4461407`. |
| Opening hours | 07:00–00:00 | Verify accuracy (see §1). |
| Parking | "No on-site parking" / "Free of charge street parking" | Accurate to publish. |
| Payments | Cash only | Website aligns. |

---

## PRIORITY ACTIONS

### 🔴 Must verify with owner
1. **Opening hours** — Is it 07:00–00:00 or 08:00–20:00? Confirm before changing anything.
2. **GBP phone update** — Owner should change GBP primary from `0305 4139635` to `+92 309 4461407`.
3. **Women-owned setting** — Review whether to enable on GBP given the female-instructor brand.

### 🟠 High-value website changes
4. **JSON-LD address** — `streetAddress: "Gulberg"` → `"28/a, S block, Gulberg 2"`; add `postalCode: "54660"`.
5. **JSON-LD geo** — Add `{"@type":"GeoCoordinates","latitude":31.5201889,"longitude":74.3575145}`.
6. **Established date** — Add "Est. 2016" or "Since 2016" to About/footer (trust signal).
7. **Service areas** — Add "Gulberg III" and "Lahore Cantt." to website.

### 🟡 Should do
8. **Online classes** — Add mention (GBP confirms offered).
9. **Appointment not required** — Add as trust signal.
10. **Opening hours fix** — Once verified, update Contact.jsx, MapSection.jsx, index.html consistently.
11. **Copy alignment** — Add "traffic rules," "friendly environment," "with or without pick & drop."

---

## FILES THAT WOULD NEED CHANGES

| File | Changes |
|---|---|
| `index.html` | JSON-LD address → full street; add postalCode, geo, areaServed expansion, established |
| `src/components/Contact.jsx` | Hours (after verification), full address |
| `src/components/MapSection.jsx` | Hours (after verification) |
| `src/components/Footer/FooterLinks.jsx` | Full address, service areas |
| `src/components/FAQ.jsx` | Service areas (Gulberg III, Cantt.), online classes |
| `src/components/Footer/FooterBrand.jsx` | Address alignment (optional) |
| About / Hero components | Established 2016, expanded service copy |
