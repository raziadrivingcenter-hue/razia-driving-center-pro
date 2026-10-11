# SOD Driving School Pro — Booking API Integration Prompt

Copy everything below the line into the AI agent working on the SOD project.

---

You are a senior frontend engineer updating the SOD Driving School Pro website (a Vite/React SPA on Cloudflare Pages). Your task is to integrate a booking system with a REST API for multi-day slot-based reservations with travel buffer support.

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

## Slot System Rules (MUST UNDERSTAND)

- **30-minute training slots**, operating hours **8:00 AM – 8:00 PM** (24 slots/day)
- **Travel buffer**: `distance_km × 5` minutes each way
- A booking blocks the window from `(slot_time − travel_time)` to `(slot_time + 30 min)`
- That same time slot is blocked for **ALL days** from `course_start_date` to `course_end_date`
- **Example**: 12:30 slot, 3km distance → 15 min travel → blocks 12:15–13:00 for every day of the course
- If a 10-day course is booked, that time slot is blocked for 10 consecutive days

## API Endpoints (already deployed)

### 1. GET /api/v1/availability?date=YYYY-MM-DD
Returns all 30-min slots for a date, marking each as available or blocked. Blocked slots are those occupied by multi-day bookings whose date range includes the requested date.

**Request:**
```
GET {API_BASE}/api/v1/availability?date=2026-10-15
```

**Response (200):**
```json
{
  "date": "2026-10-15",
  "operating_hours": { "start": "08:00", "end": "20:00" },
  "slot_duration_min": 30,
  "available_slots": [
    { "time": "08:00:00", "display": "8:00 AM" },
    { "time": "08:30:00", "display": "8:30 AM" },
    { "time": "12:30:00", "display": "12:30 PM" }
  ],
  "blocked_slots": [
    { "time": "10:00:00", "display": "10:00 AM", "reason": "Booked" }
  ],
  "total_slots": 24,
  "available_count": 23,
  "blocked_count": 1
}
```

**Key difference from old API**: There is no `slot_id`. Each slot is identified by its `time` (HH:MM:SS). The client must send `slot_time` in HH:MM format when booking.

### 2. POST /api/v1/bookings
Submits a new multi-day booking. The API calculates travel time, end date, and checks for conflicts across the full course duration.

**Request body:**
```json
{
  "customer_name": "Ahmed Khan",
  "phone_number": "0300-1234567",
  "slot_time": "12:30",
  "course_start_date": "2026-10-20",
  "duration_days": 10,
  "plan_type": "plus",
  "distance_km": 5,
  "pickup_address": "House 123, Street 5, Gulberg III, Lahore",
  "area": "Gulberg",
  "course_fee": 14500,
  "distance_fee": 3000,
  "total_fee": 17500,
  "notes": "Prefer morning lesson"
}
```

**Required fields:**
| Field | Type | Description |
|-------|------|-------------|
| `customer_name` | string | Full name |
| `phone_number` | string | Contact number |
| `slot_time` | string | Preferred time in HH:MM format |
| `course_start_date` | string | First lesson date (YYYY-MM-DD) |
| `duration_days` | integer | Number of course days (7, 10, or 15) |
| `plan_type` | string | `basic`, `plus`, or `pro` |

**Optional fields:** `distance_km`, `pickup_address`, `area`, `course_fee`, `distance_fee`, `total_fee`, `notes`, `source`

**Response (201):**
```json
{
  "success": true,
  "bookingId": "1",
  "status": "pending",
  "travel_time_min": 25,
  "whatsappLink": "https://wa.me/923094461407?text=..."
}
```

**Response (409) — slot conflict across one or more course days:**
```json
{
  "error": "Slot conflict: This time slot is already booked for one or more days of the selected course range. Please choose a different time.",
  "code": "SLOT_CONFLICT"
}
```

**Response (400) — validation error:**
```json
{
  "error": "Validation failed",
  "details": ["slot_time is required (HH:MM format)", "plan_type must be: basic, plus, or pro"]
}
```

### 3. POST /api/v1/calculate-fee
Calculates total price including pick & drop charges. Pure computation — no database access.

**Request body (standard plan):**
```json
{
  "plan_type": "plus",
  "distance_km": 5,
  "total_days": 10
}
```

**Request body (custom pricing):**
```json
{
  "course_fee": 12000,
  "total_days": 8,
  "distance_km": 10
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
- **Travel time** = `distance_km × 5` minutes (used for slot blocking, not charged separately)

## Course Packages
| Plan | plan_type | Days | Fee (PKR) |
|------|-----------|------|-----------|
| Basic Plan | `basic` | 7 | 9,999 |
| PLUS Plan | `plus` | 10 | 14,500 |
| PRO+ Plan | `pro` | 15 | 21,750 |

## What to Implement

### A. API Client Module — `src/lib/bookingApi.js`

Four functions, all using the configurable `API_BASE`:

1. **`fetchAvailability(date)`** — GET availability. Returns `{ availableSlots, blockedSlots, totalSlots, availableCount, blockedCount }`. Throws on error.

2. **`submitBooking(bookingData)`** — POST booking. Returns `{ success, bookingId, status, travelTimeMin, whatsappLink }`. On 409, throw user-friendly error with code `SLOT_CONFLICT`.

3. **`calculateFee({ planType, distanceKm, totalDays, courseFee?, totalDays? })`** — POST calculate-fee. Returns full breakdown including formula string.

4. **`getSlotSystemInfo()`** — Return static info: `{ slotDurationMin: 30, operatingHours: { start: "08:00", end: "20:00" }, travelTimePerKm: 5 }`

All functions:
- Use `fetch` with `Content-Type: application/json`
- Throw descriptive errors on non-2xx responses
- Handle network errors gracefully
- Read base URL from `import.meta.env.VITE_BOOKING_API_URL` with fallback to `https://raziadrivingcenter.com`

### B. Booking Wizard — `src/components/Booking/SlotBooking.jsx`

Step-by-step wizard:

**Step 1 — Plan Selection:**
- 3 cards: Basic (Rs. 9,999 / 7 days), PLUS (Rs. 14,500 / 10 days), PRO+ (Rs. 21,750 / 15 days)
- Highlight PLUS as "Most Popular — FREE Pick & Drop up to 2 KM"
- Show duration_days for each plan (this determines how many days the slot is blocked)

**Step 2 — Date & Slot Selection:**
- Date picker (min: today, max: +30 days)
- On date change → call `fetchAvailability(date)`, show loading state
- Display only `available_slots` as clickable time cards (use `display` field for label)
- Show blocked count: "X slots unavailable on this date"
- Error state if no slots available
- Show note: "Your selected time will be blocked for all {durationDays} days of your course"

**Step 3 — Customer Details:**
- Name (required)
- Phone (required, format: 03XX-XXXXXXX)
- Pickup address (required if pick & drop)
- Area/location
- Distance in km (max 20) — needed for travel buffer calculation

**Step 4 — Price Preview:**
- Live price calculation via `calculateFee()` on any input change
- Show breakdown: course fee, distance fee, free km (if PLUS), total payable
- Show the formula string from API response
- Show travel time estimate: "Instructor will arrive {X} min before your slot"

**Step 5 — Confirm & Submit:**
- Summary: plan, start date, slot time, duration, customer info, total price
- Submit → call `submitBooking()` with all fields
- Success: show booking ID + WhatsApp link button
- 409 SLOT_CONFLICT: show "This time slot was just booked by someone else. Please choose another date or time." → back to step 2

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

## Important UX Notes

1. **Multi-day blocking awareness**: When a user picks a slot, clearly inform them that this same time will be reserved every day for their full course duration (e.g., "12:30 PM every day for 10 days").

2. **Travel buffer display**: Show the user when the instructor will arrive. Example: "Your slot is 12:30 PM. Instructor will arrive at 12:15 PM (15 min travel from 3 km away)."

3. **Conflict handling**: If the user gets a 409, don't lose their form data. Let them pick a different date or time without re-entering everything.

4. **No slot_id**: The old API used `slot_id`. The new API uses `slot_time` (HH:MM). Do NOT send `slot_id` — it will be ignored.

## Constraints
- API base URL MUST be configurable via `VITE_BOOKING_API_URL` env var
- Never hardcode the API domain in any component
- Do NOT modify the API endpoints — already deployed
- Do NOT expose service_role keys
- Do NOT change existing course pricing or SEO pages
- Build must pass: `npm run build`

## Deliverables
1. `src/lib/bookingApi.js` — configurable API client (4 functions)
2. `src/components/Booking/SlotBooking.jsx` — multi-step booking wizard
3. Updated Hero / Navbar / .env.local
4. Build passes
5. Report what was implemented
