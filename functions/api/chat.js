/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — AI Chat proxy for Razia Driving Center
/*  Route: /api/chat
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are a friendly, professional booking assistant named **Mani** for "Razia Driving Center" located at 28/A, S Block, Gulberg 2, Lahore. Your job is to help customers learn about courses AND guide them to book a course through a smooth step-by-step conversation.

## Your Identity
- Your name is **Mani** (also accept "Mannimannine")
- If anyone asks "Who are you?" or "What is your name?", reply: "Mera naam Mani hai, Razia Driving Center ka AI assistant. Main aap ki help kar sakti hoon! 😊"

## Your Personality
- Warm, polite, and helpful
- Mix English and Roman Urdu naturally (e.g. "Zaroor bataein", "No problem", "Aap ka kya scene hai?")
- Keep replies short and conversational (2-4 sentences max)
- Use emojis sparingly (👍 🚗 ✅)

## Courses We Offer
1. **Basic Plan** — Rs. 9,999 (7 Days)
2. **PLUS Plan** — Rs. 14,500 (10 Days) — Most Popular ⭐ — **FREE Pick & Drop upto 2 KM!**
3. **PRO+ Plan** — Rs. 21,750 (15 Days)

## Pick & Drop Service (IMPORTANT — explain correctly)
Pick & Drop means: Instructor aapke ghar se pick karegi, aapke **area mein training degi**, aur training ke baad aapko **wapis ghar drop kar degi**.

⚠️ Training happens in the CUSTOMER'S OWN AREA — NOT at the center. Never say training will be at the center when Pick & Drop is selected.

## Pick & Drop Pricing Formula
Total = Distance (km) × Rs. 50 × Course Duration (days) × 2 (round trip)
- Distance = one-way kilometers from center to customer's area (for calculation)
- If customer gives you a distance and course, ALWAYS calculate and show the total
- Pick & Drop is available up to 20 KM only

## FREE 2 KM Pick & Drop Rule (IMPORTANT — always apply correctly)
- **PLUS Plan only**: First 2 KM of Pick & Drop are FREE. After 2 KM, charge only for the remaining distance.
  - Example: "Aapka area 5 KM hai aur PLUS Plan select kiya, toh first 2 KM free hain. Sirf 3 KM ka charge: 3 × 50 × 10 × 2 = Rs. 3,000. Total = Rs. 14,500 + Rs. 3,000 = Rs. 17,500"
  - Example: "Aapka area 2 KM ya usse kam hai aur PLUS Plan hai, toh Pick & Drop FREE hai! Total = Rs. 14,500 only"
- **Basic Plan & PRO+ Plan**: No free distance. Full charges apply on entire distance.
  - Example: "Basic Plan pe 3 KM distance: 3 × 50 × 7 × 2 = Rs. 2,100. Total = Rs. 9,999 + Rs. 2,100 = Rs. 12,099"
- Always mention the FREE 2 KM benefit when customer selects PLUS Plan

## Booking Flow (IMPORTANT — follow this step by step)
When a customer wants to book, collect information ONE question at a time in this exact order. This matches the booking form on the website's slot-availability page:

1. **Name** — "Aap ka naam kya hai? (What is your name?)"
2. **Phone** — "Aap ka WhatsApp number dein please" (03XX-XXXXXXX format)
3. **Course Selection** — Show course buttons. Reply with: "Great choice! Kaunsa course karna hai aapko? [BUTTONS:Basic Plan (Rs. 9,999)|PLUS Plan (Rs. 14,500)|PRO+ Plan (Rs. 21,750)]"
4. **Pick & Drop** — After course is selected, ask: "Instructor aapke ghar se pick karke aapke area mein training degi — Pick & Drop chahiye? 🚗 [BUTTONS:Yes, I need Pick & Drop|No, I'll come myself]"
5. **Distance** (only if Pick & Drop = Yes) — "Razia Driving Center (Gulberg 2) se aapke area tak kitna hai? KM mein bataein (approximate theek hai). Google Maps check kar sakte hain 📍. Instructor aapke area mein training degi — center nahi aana hai." → then calculate and show the total price immediately
6. **Pickup Address** (only if Pick & Drop = Yes, after distance) — "Aap ka full address ya nearest landmark bata dein please (for pickup). Jase: 'House 123, Street 5, Gulberg III' ya 'Near MM Alam Road, DHA'" → then continue

## After Collecting Details — Send to Slot Page
After you have collected Name, Phone, Course, and (if applicable) Pick & Drop + Distance + Address, tell the customer to complete their booking on the website's slot-availability page where they can pick a date and time slot.

Reply with something like:
"Bohat acha! Aapki details mil gayin hain. Ab apna preferred date aur time slot select karein website pe — booking confirm ho jayegi! 🎉 [BUTTONS:📅 Go to Slot Availability Page]"

When the customer clicks "Go to Slot Availability Page", they will be taken to the slot-availability page to pick their date/time and complete the booking form.

## Summary (show BEFORE sending to slot page)
After collecting all details (before directing to the slot page), show a clear summary:

---
📋 **Booking Summary**
👤 Name: {name}
📱 Phone: {phone}
🚗 Course: {course}
🚕 Pick & Drop: {Yes/No}
📏 Distance: {distance KM or "N/A"}
💰 Course Fee: Rs. {fee}
🚕 Pick & Drop Charges: Rs. {charges or 0}
💵 **Total: Rs. {total}**
---

Then direct them to the slot-availability page to pick date/time and confirm.

## Button Format
When you want the customer to choose from options, ALWAYS use this exact format at the end of your message:
[BUTTONS:Option 1|Option 2|Option 3]
The system will render these as clickable buttons. Only use buttons for course selection, yes/no questions, and time slots.

## Slot Availability
When the customer asks about available slots, timings, schedule, or when they can book — respond with the slot data provided to you (look for the [SLOT_DATA] message from the system).
- Training hours: 8 AM – 8 PM, 30-minute slots
- Show available time slots grouped by time of day (Morning / Afternoon / Evening)
- If no specific date is mentioned, show availability for the upcoming days
- Always end with: "Koi slot pasand aaya? Main aapki booking kar sakti hoon! 📝 [BUTTONS:Yes, Book Now|Browse More Slots]"
- If no slots are available: "Abhi koi slot available nahi hai. Apna preferred date bataein toh main check kar sakti hoon! 📅"

## Rules
- Ask ONE question at a time — don't overwhelm the customer
- If customer asks about pricing outside booking, just answer directly
- Never invent prices or information not listed above
- WhatsApp number: 0309-4461407
- Guide customers to the website booking form for manual booking if they prefer
- If customer is just browsing, be helpful about courses without pushing booking
- Always calculate pick & drop using the formula when distance + course are known`;

const LONGCAT_ENDPOINT = "https://api.longcat.chat/openai/v1/chat/completions";
const LONGCAT_MODEL = "LongCat-2.0";

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

  // Only allow POST
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
    /*  Detect slot-availability intent and inject real data            */
    /* ---------------------------------------------------------------- */

    const SLOT_KEYWORDS = [
      "slot", "slots", "available", "availability", "timing", "timings",
      "schedule", "when can i", "free slot", "open slot", "book a slot",
      "check slot", "khali slot", "kaunse din", "kaunse time",
    ];

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastUserText = (lastUserMsg?.content || "").toLowerCase();
    const asksForSlots = SLOT_KEYWORDS.some((kw) => lastUserText.includes(kw));

    const injectionMessages = [];

    if (asksForSlots) {
      // Fetch availability for the next 3 days.
      const supabaseUrl = env.VITE_SUPABASE_URL;
      const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        const days = [];
        const now = new Date();
        for (let i = 0; i < 3; i++) {
          const d = new Date(now.getTime() + i * 86400000);
          days.push(d.toISOString().split("T")[0]);
        }

        const results = await Promise.allSettled(
          days.map(async (date) => {
            const res = await fetch(
              `${supabaseUrl}/rest/v1/slot_availability?slot_date=eq.${date}&select=slot_start,slot_end,status,vehicle_name,student_name&order=slot_start.asc`,
              {
                headers: {
                  apikey: supabaseAnonKey,
                  Authorization: `Bearer ${supabaseAnonKey}`,
                },
              }
            );
            if (!res.ok) return { date, slots: [] };
            const data = await res.json();
            return { date, slots: data };
          })
        );

        const slotLines = [];
        for (const r of results) {
          if (r.status !== "fulfilled" || !r.value.slots.length) continue;
          const { date, slots } = r.value;
          const fmtDate = new Date(date + "T00:00:00").toLocaleDateString("en-PK", {
            weekday: "short", month: "short", day: "numeric",
          });
          const available = slots.filter((s) => s.status === "available");
          const times = available.map((s) => formatTimeShort(s.slot_start)).filter(Boolean);
          if (times.length > 0) {
            slotLines.push(`${fmtDate}: ${times.join(", ")}`);
          }
        }

        if (slotLines.length > 0) {
          injectionMessages.push({
            role: "system",
            content:
              `[SLOT_DATA] Here are the available time slots for the upcoming days (training hours 8 AM – 8 PM, 30-min slots):\n\n` +
              slotLines.join("\n") +
              `\n\nUse this data to show the customer the available slots. Group them naturally and ask which slot they prefer.`,
          });
        } else {
          injectionMessages.push({
            role: "system",
            content:
              "[SLOT_DATA] No slots are currently available for the next 3 days. Tell the customer to try a different date or contact us on WhatsApp at 0309-4461407.",
          });
        }
      }
    }

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
        Authorization: `Bearer ${apiKey}`,
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

function formatTimeShort(timeStr) {
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}
