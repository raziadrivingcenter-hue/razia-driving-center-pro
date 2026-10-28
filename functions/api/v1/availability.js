/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Get available slots from SOD's
/*  slot_availability table.
/*  Route: /api/v1/availability?date=YYYY-MM-DD&vehicle_id=#
/*  Reads from public.slot_availability (synced by SOD software).
/*  Falls back to generated schedule for future dates not yet synced.
/* ------------------------------------------------------------------ */

import { OPERATING_HOURS, SLOT_DURATION_MIN } from "../../lib/slotConfig.js";

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

    // Build query for slot_availability table.
    // student_name is intentionally NOT selected: the contract guarantees it is
    // always NULL and it must never leave this function (client must never see
    // any personal data). We add block_reason, area, promo_percent, promo_area
    // so the UI can render travel tiles and area-discount badges.
    let query = `${supabaseUrl}/rest/v1/slot_availability?slot_date=eq.${date}`;
    query += `&select=slot_start,slot_end,status,vehicle_id,vehicle_name,block_reason,area,promo_percent,promo_area`;

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

    // Bucket rows by status. 'blocked' rows are no longer dropped: travel
    // blocks (travel_going / travel_returning) go to `travel_slots`, other
    // blocked rows keep the legacy "booked" look via `blocked_slots`.
    const available = data.filter((s) => s.status === "available");
    const booked = data.filter((s) => s.status === "booked");
    const travel = data.filter(
      (s) =>
        s.status === "blocked" &&
        (s.block_reason === "travel_going" || s.block_reason === "travel_returning")
    );
    const otherBlocked = data.filter((s) => s.status === "blocked" && !s.block_reason);

    // Group by vehicle — include ALL vehicles (available, booked, travel, or
    // other-blocked) so the grid can place every tile in the right column.
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
    for (const slot of [...booked, ...travel, ...otherBlocked]) {
      ensureVehicle(slot.vehicle_id, slot.vehicle_name);
    }

    // Tiles that look "booked" to the visitor: real bookings + non-travel blocks.
    // Neither carries student_name (it is never selected and never exposed).
    const bookedDisplay = [...booked, ...otherBlocked];

    return new Response(
      JSON.stringify({
        date,
        operating_hours: OPERATING_HOURS,
        slot_duration_min: SLOT_DURATION_MIN,
        available_slots: available.map((s) => ({
          time: s.slot_start,
          end: s.slot_end,
          display: formatTime(s.slot_start),
          vehicle_id: s.vehicle_id,
          vehicle_name: s.vehicle_name,
          promo_percent: s.promo_percent ?? null,
          promo_area: s.promo_area ?? null,
        })),
        blocked_slots: bookedDisplay.map((s) => ({
          time: s.slot_start,
          end: s.slot_end,
          display: formatTime(s.slot_start),
          reason: "Booked",
          vehicle_id: s.vehicle_id,
          vehicle_name: s.vehicle_name,
        })),
        travel_slots: travel.map((s) => ({
          time: s.slot_start,
          end: s.slot_end,
          display: formatTime(s.slot_start),
          block_reason: s.block_reason,
          area: s.area,
          vehicle_id: s.vehicle_id,
          vehicle_name: s.vehicle_name,
        })),
        vehicles: Object.values(vehicles),
        total_slots: data.length,
        available_count: available.length,
        blocked_count: bookedDisplay.length,
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
  // "07:00" or "07:00:00" → "7:00 AM"
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}
