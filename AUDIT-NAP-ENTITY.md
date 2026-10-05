# NAP / LOCAL SEO ENTITY AUDIT — Razia Driving Center

**Date:** 2026-09-16 | **Read-only** — no files modified.

Authoritative source: GBP address `S block, 28/a, 2 Gulberg Rd, Block S Gulberg 2, Lahore, 54660`; verified phone `+92 309 4461407`.

---

## A. VERIFIED CONSISTENCIES

| Field | Value | Where | Status |
|---|---|---|---|
| **Phone** | `+92 309 4461407` | Contact.jsx, MapSection.jsx, FooterLinks.jsx, JSON-LD, WhatsApp links (×3), BookingModal, BookingStep3 | ✅ Consistent everywhere. Old GBP number `0305 4139635` is NOT in codebase. |
| **Email** | `raziadrivingcenter@gmail.com` | Contact.jsx, FooterLinks.jsx, MapSection.jsx | ✅ Consistent. |
| **Website URL** | `https://raziadrivingcenter.com` | JSON-LD `url`, canonical, og:url | ✅ Consistent. |
| **Business name** | `Razia Driving Center` | JSON-LD, title, footer, Hero badge | ✅ Consistent. |
| **Opening hours (range)** | `8:00 AM – 8:00 PM` / `08:00–20:00` | Contact.jsx, MapSection.jsx, JSON-LD | ✅ Consistent across on-site + schema. |
| **Days** | Mon–Sun / 7 days | Contact.jsx, JSON-LD, FooterLinks.jsx | ✅ Consistent. |
| **Geo coordinates** | `31.5201889, 74.3575145` | MapSection.jsx (directions + embed) | ✅ Present and matching. |
| **areaServed** | `Lahore` | JSON-LD | ✅ Present. |

---

## B. MISMATCHES

### 1. Address — streetAddress in JSON-LD is incomplete (HIGH)

| Location | Current value |
|---|---|
| **JSON-LD** (`index.html:158`) | `"streetAddress": "Gulberg"` |
| GBP (authoritative) | `S block, 28/a, 2 Gulberg Rd, Block S Gulberg 2, Lahore, 54660` |

The schema drops the full street address. This weakens the local entity signal and creates a NAP mismatch with GBP.

### 2. Address — on-site text addresses are incomplete (MEDIUM)

| File | Current value |
|---|---|
| `Contact.jsx:100` | `Gulberg, Lahore, Pakistan` |
| `FooterLinks.jsx:154` | `Gulberg, Lahore, Pakistan` |
| `FooterBrand.jsx:70` | `Gulberg, Lahore` |

None include the plot/block/street detail. Only `MapSection.jsx:57-61` has the fuller `Plot 28/a, S Block, Gulberg II, Lahore, Pakistan`.

### 3. Address — on-site format differs from GBP format (LOW)

MapSection renders `Plot 28/a, S Block, Gulberg II` while GBP uses `S block, 28/a, 2 Gulberg Rd, Block S Gulberg 2`. Same location, different phrasing — minor but worth aligning.

### 4. JSON-LD missing `geo` (MEDIUM)

Coordinates exist in MapSection (`31.5201889, 74.3575145`) but the LocalBusiness schema has no `"geo": {"@type":"GeoCoordinates","latitude":...,"longitude":...}`.

### 5. JSON-LD missing `postalCode` (LOW)

GBP has `54660`; schema has no postal code.

### 6. Footer social links — placeholder + wrong icons (MEDIUM)

`FooterBottom.jsx`:
- Line 74, 110: `href="#"` (dead placeholders).
- Instagram (`instagram.com/raziadrivingcenter`) uses generic `MessageCircle` icon, not Instagram.
- JSON-LD has no `sameAs` to point to the Instagram profile.

---

## C. MISSING LOCAL SEO SIGNALS

| Signal | Status |
|---|---|
| `sameAs` (social profiles) in JSON-LD | ❌ Missing |
| `logo` in JSON-LD | ❌ Missing (`logo.png` exists in assets) |
| `geo` in JSON-LD | ❌ Missing |
| `postalCode` in JSON-LD | ❌ Missing (`54660`) |
| `hasOfferCatalog` / `makesOffer` (services) | ❌ Missing |
| Full street address in JSON-LD | ❌ Missing |
| Full street address in Contact/Footer text | ❌ Missing |

---

## D. PRIORITY FIXES

### HIGH
1. **JSON-LD streetAddress** — change `"Gulberg"` → full GBP street address.
2. **Add `geo` to JSON-LD** — `31.5201889, 74.3575145`.

### MEDIUM
3. **On-site text addresses** (Contact.jsx, FooterLinks.jsx) → add full plot/block/street.
4. **Add `sameAs`** to JSON-LD → Instagram URL.
5. **Fix footer social** — replace `href="#"` placeholders with real URLs; use correct brand icons.
6. **Add `logo`** to JSON-LD → `https://raziadrivingcenter.com/logo.png`.

### LOW
7. **Add `postalCode`: `54660`** to JSON-LD address.
8. Align on-site address phrasing with GBP format.
9. Add `hasOfferCatalog` / service listings to schema.

---

## E. FILES THAT WOULD NEED CHANGES

| File | Change |
|---|---|
| `index.html` | JSON-LD: streetAddress → full address; add `geo`, `postalCode`, `sameAs`, `logo` |
| `src/components/Contact.jsx` | Address text → full address |
| `src/components/Footer/FooterLinks.jsx` | Address text → full address |
| `src/components/Footer/FooterBottom.jsx` | Fix `href="#"` placeholders; fix social icons; add real URLs |
| `src/components/Footer/FooterBrand.jsx` | (optional) align address text |

---

## F. ITEMS REQUIRING OWNER VERIFICATION

| Item | Why |
|---|---|
| **Opening hours start time** | User reports Google shows 7 AM; JSON-LD says 08:00. Verify actual opening time before changing. Do NOT assume. |
| **Exact street address format** | GBP says `S block, 28/a, 2 Gulberg Rd, Block S Gulberg 2`. MapSection says `Plot 28/a, S Block, Gulberg II`. Confirm which phrasing the owner wants on the site. |
| **Postal code** | GBP has `54660`. Confirm it's correct before adding to schema. |
| **Instagram URL** | Footer has `instagram.com/raziadrivingcenter`. Confirm this is the correct/handled profile before adding to `sameAs`. |
| **Social profiles for `sameAs`** | Only Instagram URL found. Confirm if Facebook/other profiles exist and should be linked. |
