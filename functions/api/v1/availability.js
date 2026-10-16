/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Get available slots from SOD's
/*  slot_availability table.
/*  Route: /api/v1/availability?date=YYYY-MM-DD&vehicle_id=#
/*  Reads from public.slot_availability (synced by SOD software).
/*  Falls back to generated schedule for future dates not yet synced.
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
    const vehicleId = url.searchParams.get("vehicle_id");

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

    // Build query for slot_availability table
    let query = `${supabaseUrl}/rest/v1/slot_availability?slot_date=eq.${date}`;
    query += `&select=slot_start,slot_end,status,vehicle_id,vehicle_name,student_name`;

    if (vehicleId) {
      query += `&vehicle_id=eq.${vehicleId}`;
    }

    // Order by vehicle then time
    query += `&order=vehicle_id.asc,slot_start.asc`;

    const response = await fetch(query, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch availability" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Separate available vs booked
    const available = data.filter((s) => s.status === "available");
    const booked = data.filter((s) => s.status === "booked");

    // Group by vehicle — include ALL vehicles (available or booked-only)
    // so grids can place booked slots in the correct column.
    const vehicles = {};
    const ensureVehicle = (vid, vname) => {
      if (!vehicles[vid]) {
        vehicles[vid] = { id: vid, name: vname || `Vehicle ${vid}`, slots: [] };
      }
    };
    for (const slot of available) {
      ensureVehicle(slot.vehicle_id, slot.vehicle_name);
      vehicles[slot.vehicle_id].slots.push({
        time: slot.slot_start,
        end: slot.slot_end,
        display: formatTime(slot.slot_start),
      });
    }
    for (const slot of booked) {
      ensureVehicle(slot.vehicle_id, slot.vehicle_name);
    }

    return new Response(
      JSON.stringify({
        date,
        operating_hours: { start: "08:00", end: "20:00" },
        slot_duration_min: 60,
        available_slots: available.map((s) => ({
          time: s.slot_start,
          end: s.slot_end,
          display: formatTime(s.slot_start),
          vehicle_id: s.vehicle_id,
          vehicle_name: s.vehicle_name,
        })),
        blocked_slots: booked.map((s) => ({
          time: s.slot_start,
          end: s.slot_end,
          display: formatTime(s.slot_start),
          reason: "Booked",
          student_name: s.student_name,
          vehicle_id: s.vehicle_id,
          vehicle_name: s.vehicle_name,
        })),
        vehicles: Object.values(vehicles),
        total_slots: data.length,
        available_count: available.length,
        blocked_count: booked.length,
        synced: data.length > 0,
        note: data.length === 0
          ? "No synced data for this date yet. Slots will appear after sync."
          : undefined,
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
  // "08:00" or "08:00:00" → "8:00 AM"
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}
