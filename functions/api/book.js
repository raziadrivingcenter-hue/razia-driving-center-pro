/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Submit booking to Supabase
/*  Route: /api/book
/*  Calls the existing submit_booking RPC server-side (anon key only).
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

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Booking service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Map the collected fields to the submit_booking RPC parameters
    const hasPickup = body.pickup === "Yes" || body.pickup === true;

    const rpcParams = {
      p_customer_name: (body.name || "").trim(),
      p_customer_phone: (body.phone || "").trim(),
      p_customer_email: (body.email || "").trim() || null,
      p_preferred_course: body.course || null,
      p_message: (body.notes || "").trim() || null,
      p_source: "ai-chat",
      p_area: (body.area || "").trim() || null,
      p_city: null,
      p_address: hasPickup ? (body.address || "").trim() || null : null,
      p_preferred_date: body.preferred_date || null,
      p_preferred_time: body.time || null,
      p_pickup_location: null,
      p_dropoff_location: null,
      p_distance_km: hasPickup ? Number(body.distance) || null : null,
      p_home_service: hasPickup,
      p_extra: {
        course_fee: body.courseFee || 0,
        pick_drop_charges: body.pickDropCharges || 0,
        total_payable: body.totalPayable || 0,
      },
    };

    // Call the Supabase RPC via REST API
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
      return new Response(
        JSON.stringify({ error: "Booking submission failed" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const bookingId = String(data).slice(0, 8);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        whatsappLink: `https://wa.me/923094461407?text=${encodeURIComponent(
          `Hello Razia Driving Center Team\n\nI have submitted my booking through the AI Assistant.\n\nMy Booking ID # ${bookingId}`
        )}`,
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
    console.error("Booking function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
