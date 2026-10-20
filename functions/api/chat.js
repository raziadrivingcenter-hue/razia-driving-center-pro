/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — AI Chat proxy for Razia Driving Center
/*  Route: /api/chat
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = [
  'You are a friendly, professional booking assistant named **RDC AI** for "Razia Driving Center" located at 28/A, S Block, Gulberg 2, Lahore. Your job is to help customers learn about courses AND guide them to book a course through a smooth step-by-step conversation.',
  "",
  "## Your Identity",
  "- Your name is **RDC AI**",
  '- If anyone asks "Who are you?" or "What is your name?", reply: "Mera naam RDC AI hai, Razia Driving Center ka AI assistant. Main aap ki help kar sakti hoon!"',
  "",
  "## Your Personality",
  "- Warm, polite, and helpful",
  "- Mix English and Roman Urdu naturally",
  "- Keep replies short and conversational (2-4 sentences max)",
  "- Use emojis sparingly",
  "",
  "## Courses We Offer",
  "1. **Basic Plan** — Rs. 9,999 (7 Days)",
  "2. **PLUS Plan** — Rs. 14,500 (10 Days) — Most Popular — **FREE Pick & Drop upto 2 KM!**",
  "3. **PRO+ Plan** — Rs. 21,750 (15 Days)",
  "",
  "## Pick & Drop Service",
  "Pick & Drop means: Instructor picks up from your home, trains in YOUR AREA, then drops you back home.",
  "Training happens in the CUSTOMER'S OWN AREA, NOT at the center.",
  "",
  "## Pick & Drop Pricing Formula",
  "Total = Distance (km) x Rs. 50 x Course Duration (days) x 2 (round trip)",
  "- Distance = one-way kilometers from center to customer's area",
  "- Pick & Drop available up to 20 KM only",
  "",
  "## FREE 2 KM Pick & Drop Rule",
  "- PLUS Plan only: First 2 KM FREE. After 2 KM, charge only remaining distance.",
  "- Basic Plan & PRO+ Plan: No free distance. Full charges apply.",
  "",
  "## Booking Flow",
  "Collect info ONE question at a time:",
  "1. Name",
  "2. Phone (WhatsApp)",
  "3. Course Selection",
  "4. Pick & Drop (yes/no)",
  "5. Distance (if Pick & Drop = Yes)",
  "6. Pickup Address (if Pick & Drop = Yes)",
  "7. Time Preference (Morning/Afternoon/Evening)",
  "",
  "## Slot Selection",
  "When customer picks a time period, show [SLOT_DATA] slots as buttons.",
  "If no slots, apologize and offer other periods.",
  "",
  "## Booking Confirmation",
  "When customer picks a slot, booking is auto-submitted.",
  'Reply: "Booking confirm! Aapki booking successful hai. Hum jaldi call karenge. Shukriya!"',
  "",
  "## Button Format",
  "Use [BUTTONS:Option 1|Option 2|Option 3] for choices.",
  "",
  "## Rules",
  "- Ask ONE question at a time",
  "- Never invent prices",
  "- WhatsApp: 0309-4461407",
  "- Calculate pick & drop when distance + course known",
].join("\n");

const LONGCAT_ENDPOINT = "https://api.longcat.chat/openai/v1/chat/completions";
const LONGCAT_MODEL = "LongCat-2.0";

/* ------------------------------------------------------------------ */
/*  Course pricing config                                              */
/* ------------------------------------------------------------------ */

const COURSE_PRICING = {
  "Basic Plan": { fee: 9999, days: 7 },
  "PLUS Plan": { fee: 14500, days: 10 },
  "PRO+ Plan": { fee: 21750, days: 15 },
};

/* ------------------------------------------------------------------ */
/*  Calculate pick & drop charges                                      */
/* ------------------------------------------------------------------ */

function calculatePickDropCharges(distanceKm, courseName) {
  const course = COURSE_PRICING[courseName];
  if (!course || !distanceKm) return 0;
  const rawDist = Math.min(parseFloat(distanceKm) || 0, 20);
  const chargeableDist = courseName === "PLUS Plan" ? Math.max(rawDist - 2, 0) : rawDist;
  return Math.round(chargeableDist * 50 * course.days * 2);
}

/* ------------------------------------------------------------------ */
/*  Extract booking data from conversation                             */
/* ------------------------------------------------------------------ */

function extractBookingData(messages) {
  const data = {
    name: "",
    phone: "",
    course: "",
    pickup: "",
    distance: "",
    address: "",
    preferred_date: "",
    preferred_time: "",
  };

  const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content.trim());

  for (const text of userTexts) {
    const lower = text.toLowerCase();

    // Course selection
    for (const [courseName] of Object.entries(COURSE_PRICING)) {
      if (lower.includes(courseName.toLowerCase())) {
        data.course = courseName;
        break;
      }
    }

    // Pick & Drop
    if (text === "Yes, I need Pick & Drop" || (lower.includes("yes") && lower.includes("pick"))) {
      data.pickup = "Yes";
    }
    if (text === "No, I'll come myself" || text === "No" || lower === "no") {
      data.pickup = "No";
    }

    // Distance
    const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|KM|kms|kilometer)/);
    const standaloneNum = text.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
    if (kmMatch) data.distance = kmMatch[1];
    else if (standaloneNum && data.pickup === "Yes") data.distance = standaloneNum[1];

    // Address (longer text after pick&drop yes)
    if (data.pickup === "Yes" && !data.address && text.split(/\s+/).length >= 3 && !kmMatch && !/^\d+$/.test(text)) {
      if (lower.includes("house") || lower.includes("street") || lower.includes("block") || lower.includes("road") || lower.includes("near") || lower.includes("landmark") || lower.includes("gulberg") || lower.includes("lahore") || lower.includes("scheme") || lower.includes("phase") || text.split(/\s+/).length >= 4) {
        data.address = text;
      }
    }

    // Phone
    if (!data.phone) {
      const phoneMatch = text.match(/((?:\+92|0)?\d{10,13})/);
      if (phoneMatch) {
        const phone = phoneMatch[1];
        if (phone.length >= 10 && phone.length <= 13) {
          data.phone = phone.startsWith("0") ? phone : phone.replace("+92", "0");
        }
      }
    }

    // Name (first short text, no numbers, no @)
    if (!data.name && !text.includes("@") && !/\d/.test(text) && text.split(/\s+/).length >= 2 && text.split(/\s+/).length <= 4) {
      if (!lower.includes("skip") && !lower.includes("confirm") && !lower.includes("edit") && !lower.includes("book") && !lower.includes("course") && !lower.includes("price") && !lower.includes("yes") && !lower.includes("no") && !lower.includes("morning") && !lower.includes("afternoon") && !lower.includes("evening") && !lower.includes("pick") && !lower.includes("drop")) {
        data.name = text;
      }
    }
  }

  return data;
}

/* ------------------------------------------------------------------ */
/*  Format time helper                                                 */
/* ------------------------------------------------------------------ */

function formatTimeShort(timeStr) {
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return displayH + ":" + m + " " + ampm;
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                       */
/* ------------------------------------------------------------------ */

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const messages = body.messages;

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = env.LONGCAT_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    /* ---------------------------------------------------------------- */
    /*  Analyze conversation state                                       */
    /* ---------------------------------------------------------------- */

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastUserText = (lastUserMsg?.content || "").toLowerCase();

    // Detect time-of-day preference
    const TIME_PERIODS = {
      morning: { keywords: ["morning", "subah", "7 am - 12 pm", "7am-12pm"], start: 7 * 60, end: 12 * 60 },
      afternoon: { keywords: ["afternoon", "dopahar", "12 pm - 4 pm", "12pm-4pm"], start: 12 * 60, end: 16 * 60 },
      evening: { keywords: ["evening", "shaam", "4 pm - 7 pm", "4pm-7pm"], start: 16 * 60, end: 19 * 60 },
    };

    let selectedPeriod = null;
    for (const [period, config] of Object.entries(TIME_PERIODS)) {
      if (config.keywords.some((kw) => lastUserText.includes(kw))) {
        selectedPeriod = period;
        break;
      }
    }

    // Check if user selected a specific slot (e.g., "Mon 9:00 AM" or "9:00 AM")
    const slotPattern = /(mon|tue|wed|thu|fri|sat|sun)?\s*(\d{1,2}):(\d{2})\s*(am|pm)/i;
    const isSlotSelection = slotPattern.test(lastUserMsg?.content || "");

    // General slot inquiry (not in booking flow)
    const SLOT_KEYWORDS = [
      "slot", "slots", "available", "availability", "timing", "timings",
      "schedule", "when can i", "free slot", "open slot", "book a slot",
      "check slot", "khali slot", "kaunse din", "kaunse time",
    ];
    const asksForSlots = SLOT_KEYWORDS.some((kw) => lastUserText.includes(kw));

    /* ---------------------------------------------------------------- */
    /*  Fetch availability data                                          */
    /* ---------------------------------------------------------------- */

    const injectionMessages = [];
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

    const fetchAvailability = async () => {
      if (!supabaseUrl || !supabaseAnonKey) return null;

      const days = [];
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getTime() + i * 86400000);
        days.push(d.toISOString().split("T")[0]);
      }

      const results = await Promise.allSettled(
        days.map(async (date) => {
          const res = await fetch(
            supabaseUrl + "/rest/v1/slot_availability?slot_date=eq." + date + "&select=slot_start,slot_end,status,vehicle_name,student_name&order=slot_start.asc",
            {
              headers: {
                apikey: supabaseAnonKey,
                Authorization: "Bearer " + supabaseAnonKey,
              },
            }
          );
          if (!res.ok) return { date, slots: [] };
          const data = await res.json();
          return { date, slots: data };
        })
      );

      const allSlots = [];
      for (const r of results) {
        if (r.status !== "fulfilled" || !r.value.slots.length) continue;
        const { date, slots } = r.value;
        const available = slots.filter((s) => s.status === "available");
        for (const slot of available) {
          const parts = slot.slot_start.split(":");
          const startMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          allSlots.push({
            date,
            time: slot.slot_start,
            display: formatTimeShort(slot.slot_start),
            dayName: new Date(date + "T00:00:00").toLocaleDateString("en-PK", { weekday: "short" }),
            startMin,
          });
        }
      }
      return allSlots;
    };

    // Handle slot selection → submit booking
    if (isSlotSelection && supabaseUrl && supabaseAnonKey) {
      const bookingData = extractBookingData(messages);
      const match = (lastUserMsg?.content || "").match(slotPattern);

      if (match && bookingData.name && bookingData.phone && bookingData.course) {
        // Extract date and time from selection
        const meridiem = match[4].toUpperCase();
        const timeStr = match[2] + ":" + match[3] + " " + meridiem;

        // Find the matching slot from recent days
        const allSlots = await fetchAvailability();
        if (allSlots && allSlots.length > 0) {
          // Try to match the selected slot
          const selectedHour = parseInt(match[2], 10);
          const isPM = match[4].toLowerCase() === "pm" && selectedHour !== 12;
          const hour24 = isPM ? selectedHour + 12 : selectedHour;
          const min = parseInt(match[3], 10);
          const targetMin = hour24 * 60 + min;

          const matchedSlot = allSlots.find(
            (s) => Math.abs(s.startMin - targetMin) < 30
          ) || allSlots[0];

          if (matchedSlot) {
            // Submit booking
            const courseInfo = COURSE_PRICING[bookingData.course] || {};
            const wantsPickDrop = bookingData.pickup === "Yes";
            const pickDropCharges = wantsPickDrop ? calculatePickDropCharges(bookingData.distance, bookingData.course) : 0;
            const courseFee = courseInfo.fee || 0;

            const rpcPayload = {
              p_customer_name: bookingData.name,
              p_customer_phone: bookingData.phone,
              p_preferred_date: matchedSlot.date,
              p_preferred_time: matchedSlot.dayName + " " + matchedSlot.display,
              p_preferred_course: bookingData.course,
              p_distance_km: wantsPickDrop ? Number(bookingData.distance) || 0 : 0,
              p_home_service: wantsPickDrop,
              p_address: wantsPickDrop && bookingData.address ? bookingData.address : null,
            };

            try {
              const rpcAbort = new AbortController();
              const rpcTimeout = setTimeout(() => rpcAbort.abort(), 15000);

              const response = await fetch(
                supabaseUrl + "/rest/v1/rpc/submit_slot_booking",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseAnonKey,
                    Authorization: "Bearer " + supabaseAnonKey,
                    Prefer: "return=representation",
                  },
                  body: JSON.stringify(rpcPayload),
                  signal: rpcAbort.signal,
                }
              ).finally(() => clearTimeout(rpcTimeout));

              if (response.ok) {
                const rawBody = await response.text().then((t) => t.trim().replace(/^"|"$/g, ""));
                let bookingId = "N/A";
                if (rawBody) {
                  const uuidPrefix = rawBody.split("-")[0];
                  bookingId = uuidPrefix.length === 8 ? uuidPrefix : rawBody.slice(0, 8);
                }

                return new Response(
                  JSON.stringify({
                    reply: "🎉 Booking confirm! Aapki booking successful hai.\n\n📅 " + matchedSlot.dayName + " " + matchedSlot.display + "\n🚗 " + bookingData.course + "\n🆔 Booking ID: #" + bookingId + "\n\nHum jaldi call karenge confirm karne ke liye. Shukriya! 🙏",
                    booking: { success: true, bookingId },
                  }),
                  { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
                );
              }
            } catch (err) {
              console.error("Booking submission error:", err);
            }
          }
        }
      }
    }

    // Handle time-of-day slot request
    if (selectedPeriod || asksForSlots) {
      const allSlots = await fetchAvailability();

      if (allSlots && allSlots.length > 0) {
        // Filter by period if selected
        let filteredSlots = allSlots;
        let periodLabel = "";

        if (selectedPeriod) {
          const config = TIME_PERIODS[selectedPeriod];
          filteredSlots = allSlots.filter(
            (s) => s.startMin >= config.start && s.startMin < config.end
          );
          periodLabel = selectedPeriod === "morning" ? "Morning (7 AM - 12 PM)" : selectedPeriod === "afternoon" ? "Afternoon (12 PM - 4 PM)" : "Evening (4 PM - 7 PM)";
        }

        if (filteredSlots.length > 0) {
          // Group by day
          const byDay = {};
          for (const slot of filteredSlots) {
            if (!byDay[slot.date]) byDay[slot.date] = [];
            byDay[slot.date].push(slot);
          }

          const slotLines = [];
          const slotButtons = [];
          for (const [date, slots] of Object.entries(byDay)) {
            const dayName = slots[0].dayName;
            const times = slots.map((s) => s.display);
            const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-PK", { month: "short", day: "numeric" });
            slotLines.push(dayName + " (" + dateLabel + "): " + times.join(", "));
            for (const s of slots) {
              slotButtons.push(s.dayName + " " + s.display);
            }
          }

          injectionMessages.push({
            role: "system",
            content:
              "[SLOT_DATA] Available " + (periodLabel || "") + " slots for the upcoming days:\n\n" +
              slotLines.join("\n") +
              selectedPeriod
                ? "\n\nThe customer chose " + periodLabel + ". Show these slots as clickable buttons so they can pick one. Format: [BUTTONS:" + slotButtons.slice(0, 8).join("|") + "]"
                : "\n\nGroup these by Morning / Afternoon / Evening and show as buttons.",
          });
        } else {
          // No slots for selected period
          const otherPeriods = Object.keys(TIME_PERIODS).filter((p) => p !== selectedPeriod);
          injectionMessages.push({
            role: "system",
            content:
              "[SLOT_DATA] No slots available for " + (periodLabel || "the selected period") + ".\n\nApologize and offer to show slots for other time periods: " + otherPeriods.join(", ") + ". Suggest the customer try another time.",
          });
        }
      } else {
        injectionMessages.push({
          role: "system",
          content:
            "[SLOT_DATA] No slots are currently available for the next 3 days. Tell the customer to try a different date or contact us on WhatsApp at 0309-4461407.",
        });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Call AI                                                          */
    /* ---------------------------------------------------------------- */

    const payload = {
      model: LONGCAT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...injectionMessages,
        ...messages,
      ],
      temperature: 0.7,
    };

    const upstream = await fetch(LONGCAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error("LongCat API error:", upstream.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return new Response(
        JSON.stringify({ error: "No reply from AI" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
