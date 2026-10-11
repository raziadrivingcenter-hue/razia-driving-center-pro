/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Create a booking (multi-day slot system)
/*  Route: /api/v1/bookings
/*  Calls the submit_booking RPC server-side (anon key only).
/* ------------------------------------------------------------------ */

export async function onRequest(context) {
  const { request, env } = context;

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

    // Validate required fields
    const errors = [];
    if (!body.customer_name || !String(body.customer_name).trim()) {
      errors.push("customer_name is required");
    }
    if (!body.phone_number || !String(body.phone_number).trim()) {
      errors.push("phone_number is required");
    }
    if (!body.slot_time || !/^\d{2}:\d{2}/.test(body.slot_time)) {
      errors.push("slot_time is required (HH:MM format)");
    }
    if (!body.course_start_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.course_start_date)) {
      errors.push("course_start_date is required (YYYY-MM-DD format)");
    }
    if (!body.duration_days || Number(body.duration_days) < 1) {
      errors.push("duration_days is required (minimum 1)");
    }
    if (!body.plan_type || !["basic", "plus", "pro"].includes(body.plan_type.toLowerCase())) {
      errors.push("plan_type must be: basic, plus, or pro");
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Booking service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const rpcParams = {
      p_customer_name: String(body.customer_name).trim(),
      p_phone_number: String(body.phone_number).trim(),
      p_slot_time: body.slot_time,
      p_course_start_date: body.course_start_date,
      p_duration_days: Number(body.duration_days),
      p_plan_type: body.plan_type.toLowerCase(),
      p_distance_km: body.distance_km != null ? Number(body.distance_km) : 0,
      p_pickup_address: body.pickup_address ? String(body.pickup_address).trim() : null,
      p_area: body.area ? String(body.area).trim() : null,
      p_course_fee: body.course_fee != null ? Number(body.course_fee) : 0,
      p_distance_fee: body.distance_fee != null ? Number(body.distance_fee) : 0,
      p_total_fee: body.total_fee != null ? Number(body.total_fee) : 0,
      p_notes: body.notes ? String(body.notes).trim() : null,
      p_source: body.source || "api-v1",
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/submit_booking`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(rpcParams),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase RPC error:", response.status, errorText);

      if (errorText.includes("Slot conflict")) {
        return new Response(
          JSON.stringify({
            error: "Slot conflict: This time slot is already booked for one or more days of the selected course range. Please choose a different time.",
            code: "SLOT_CONFLICT",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Booking submission failed" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const bookingId = typeof data === "string" ? data.slice(0, 8) : String(data);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        status: "pending",
        travel_time_min: Math.max(0, Number(body.distance_km || 0) * 5),
        whatsappLink: `https://wa.me/923094461407?text=${encodeURIComponent(
          `Hello Razia Driving Center\n\nMy booking has been submitted.\nBooking ID: #${bookingId}`
        )}`,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Booking function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
