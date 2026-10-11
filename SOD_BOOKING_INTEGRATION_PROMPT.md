# SOD Driving School Pro — Booking API Integration Prompt

Copy everything below the line into the AI agent working on the SOD project.

---

You are a senior frontend engineer updating the SOD Driving School Pro website (a Vite/React SPA on Cloudflare Pages). Your task is to integrate a booking system with a REST API for slot-based reservations.

## Configuration

The API base URL MUST be configurable via environment variable so this software can be reused across multiple driving schools.

Add to `.env.local`:
```
VITE_BOOKING_API_URL=https://raziadrivingcenter.com
```

In code, read it as:
```js
const API_BASE = import.meta.env.VITE_BOOKING_API_URL || "https://raziadrivingcenter.com";
```

Every API call uses `${API_BASE}/api/v1/...`. Never hardcode the domain.

## API Endpoints (already deployed)

### 1. GET /api/v1/availability?date=YYYY-MM-DD
Returns available booking slots for a given date.

**Request:**
```
GET {API_BASE}/api/v1/availability?date=2026-10-15
```

**Response (200):**
```json
{
  "date": "2026-10-15",
  "slots": [
    {
      "id": 1,
      "slot_date": "2026-10-15",
      "time_start": "08:00:00",
      "time_end": "10:00:00",
      "status": "available",
      "instructor_type": "female"
    }
  ],
  "count": 1
}
```

### 2. POST /api/v1/bookings
Submits a new booking reservation.

**Request body:**
```json
{
  "customer_name": "Ahmed Khan",
  "phone_number": "0300-1234567",
  "pickup_address": "House 123, Street 5, Gulberg III, Lahore",
  "distance_km": 5,
  "total_fee": 17500,
  "slot_id": 1,
  "plan_type": "plus",
  "notes": "Prefer morning lesson"
}
```

**Response (201):**
```json
{
  "success": true,
  "bookingId": "12345",
  "status": "pending",
  "whatsappLink": "https://wa.me/923094461407?text=..."
}
```

**Response (409) — slot already booked:**
```json
{ "error": "This slot is no longer available. Please choose another." }
```

### 3. POST /api/v1/calculate-fee
Calculates total price including pick & drop charges.

**Request body (standard plan):**
```json
{
  "plan_type": "plus",
  "distance_km": 5,
  "has_pick_drop": true
}
```

**Request body (custom pricing):**
```json
{
  "course_fee": 12000,
  "total_days": 8,
  "distance_km": 10,
  "has_pick_drop": true
}
```

**Response (200):**
```json
{
  "plan": "PLUS Plan",
  "planType": "plus",
  "courseFee": 14500,
  "distanceFee": 3000,
  "totalFee": 17500,
  "breakdown": {
    "distanceKm": 5,
    "chargeableKm": 3,
    "freeKm": 2,
    "ratePerKm": 50,
    "days": 10,
    "roundTripMultiplier": 2,
    "distanceFee": 3000,
    "hasPickDrop": true,
    "plusFreeKmApplied": true
  },
  "formula": "(5 km - 2 km free) × 50 × 10 days × 2 = 3000"
}
```

## Pricing Formula
- **Distance Fee** = `chargeable_km × 50 PKR × total_days × 2` (round trip)
- **PLUS Plan**: first 2 km FREE → chargeable_km = max(0, distance - 2)
- **Basic / PRO+**: full distance charged on entire distance
- **Max distance**: 20 km
- **Course Packages:**
  | Plan | plan_type | Days | Fee (PKR) |
  |------|-----------|------|-----------|
  | Basic Plan | `basic` | 7 | 9,999 |
  | PLUS Plan | `plus` | 10 | 14,500 |
  | PRO+ Plan | `pro` | 15 | 21,750 |

## What to Implement

### A. API Client Module — `src/lib/bookingApi.js`

Three functions, all using the configurable `API_BASE`:

1. **`fetchAvailability(date)`** — GET availability. Returns slots array. Throws on error.

2. **`submitBooking(bookingData)`** — POST booking. Returns response. On 409, throw user-friendly error.

3. **`calculateFee({ planType, distanceKm, hasPickDrop, courseFee?, totalDays? })`** — POST calculate-fee. Returns full breakdown.

All functions:
- Use `fetch` with `Content-Type: application/json`
- Throw descriptive errors on non-2xx responses
- Handle network errors gracefully
- Read base URL from `import.meta.env.VITE_BOOKING_API_URL` with fallback to `https://raziadrivingcenter.com`

### B. Booking Wizard — `src/components/Booking/SlotBooking.jsx`

Step-by-step wizard:

**Step 1 — Date & Slot Selection:**
- Date picker (min: today, max: +30 days)
- On date change → call `fetchAvailability(date)`, show loading state
- Display slots as clickable cards (time range + instructor type)
- Error state if no slots available

**Step 2 — Customer Details:**
- Name (required)
- Phone (required, format: 03XX-XXXXXXX)
- Pickup address (required if pick & drop)
- Area/location

**Step 3 — Plan Selection:**
- 3 cards: Basic (Rs. 9,999 / 7 days), PLUS (Rs. 14,500 / 10 days), PRO+ (Rs. 21,750 / 15 days)
- Highlight PLUS as "Most Popular — FREE Pick & Drop up to 2 KM"

**Step 4 — Pick & Drop + Price:**
- Toggle: Yes / No
- If Yes: distance input (km, max 20)
- Live price calculation via `calculateFee()` on input change
- Show breakdown: course fee, distance fee, free km (if PLUS), total payable
- Show the formula used

**Step 5 — Confirm & Submit:**
- Summary of all selections
- Submit → call `submitBooking()`
- Success: show booking ID + WhatsApp link button
- 409: show "Slot no longer available" → back to step 1

### C. Integration Points
- Add "Book a Slot" button in Hero section
- Add "Book a Slot" in Navbar
- If existing BookingWizard exists, add tab/option to switch to slot booking

### D. Style
- Match existing site: orange gradient (#FF3131 → #FF6201), white bg, rounded cards
- Mobile-first responsive
- framer-motion for step transitions
- Clear error + loading states
- Accessible: labels, aria attributes, keyboard nav

## Constraints
- API base URL MUST be configurable via `VITE_BOOKING_API_URL` env var
- Never hardcode the API domain in any component
- Do NOT modify the API endpoints — already deployed
- Do NOT expose service_role keys
- Do NOT change existing course pricing or SEO pages
- Build must pass: `npm run build`

## Deliverables
1. `src/lib/bookingApi.js` — configurable API client
2. `src/components/Booking/SlotBooking.jsx` — booking wizard
3. Updated Hero / Navbar / .env.local
4. Build passes
5. Report what was implemented
