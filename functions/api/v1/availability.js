/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Get available slots for a date
/*  Route: /api/v1/availability?date=YYYY-MM-DD
/*  Calls the get_available_slots RPC which generates 30-min slots
/*  and excludes those blocked by multi-day bookings with travel buffer.
/* ------------------------------------------------------------------ */

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing date parameter. Use YYYY-MM-DD." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_available_slots`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ p_date: date }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase RPC error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch availability" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Separate available vs blocked for cleaner client consumption
    const available = data.filter((s) => s.available);
    const blocked = data.filter((s) => !s.available);

    return new Response(
      JSON.stringify({
        date,
        operating_hours: { start: "08:00", end: "20:00" },
        slot_duration_min: 30,
        available_slots: available.map((s) => ({
          time: s.slot_time,
          display: formatTime(s.slot_time),
        })),
        blocked_slots: blocked.map((s) => ({
          time: s.slot_time,
          display: formatTime(s.slot_time),
          reason: s.reason,
        })),
        total_slots: data.length,
        available_count: available.length,
        blocked_count: blocked.length,
      }),
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
    console.error("Availability function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function formatTime(timeStr) {
  // Convert "12:30:00" to "12:30 PM" format
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}
