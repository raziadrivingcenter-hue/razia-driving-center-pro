/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Create a booking
/*  Route: /api/v1/bookings
/*  Calls the submit_booking RPC server-side (anon key only).
/* ------------------------------------------------------------------ */

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
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
    if (!body.slot_id) {
      errors.push("slot_id is required");
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
      p_pickup_address: body.pickup_address ? String(body.pickup_address).trim() : null,
      p_distance_km: body.distance_km != null ? Number(body.distance_km) : null,
      p_total_fee: body.total_fee != null ? Number(body.total_fee) : null,
      p_slot_id: body.slot_id,
      p_plan_type: body.plan_type ? String(body.plan_type).trim() : null,
      p_notes: body.notes ? String(body.notes).trim() : null,
      p_source: "api-v1",
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/submit_booking_v2`,
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

      // If the slot is already booked, return a friendly 409
      if (errorText.includes("already booked") || errorText.includes("slot not available")) {
        return new Response(
          JSON.stringify({ error: "This slot is no longer available. Please choose another." }),
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
