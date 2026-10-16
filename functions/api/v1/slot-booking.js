/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Lightweight slot-only booking.
/*  Route: /api/v1/slot-booking
/*  Inserts into public.booking_requests (same table as the wizard).
/*  Unlike /api/v1/bookings, this does NOT require a plan_type —
/*  the visitor just wants to claim a specific slot (name + phone).
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
      errors.push("Name is required");
    }
    if (!body.customer_phone || !String(body.customer_phone).trim()) {
      errors.push("Phone number is required");
    }
    if (!body.preferred_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.preferred_date)) {
      errors.push("Valid date is required (YYYY-MM-DD)");
    }
    if (!body.preferred_time) {
      errors.push("Preferred time is required");
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

    const bookingRecord = {
      customer_name: String(body.customer_name).trim(),
      customer_phone: String(body.customer_phone).trim(),
      preferred_course: "Slot Booking",
      status: "pending",
      source: "slot-page",
      preferred_date: body.preferred_date,
      preferred_time: body.preferred_time,
      message: `Slot booking via website: ${body.preferred_date} at ${body.preferred_time}`,
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/booking_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(bookingRecord),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase insert error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Booking submission failed" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const bookingId = Array.isArray(data) ? data[0]?.id : data?.id;
    const id = bookingId ? String(bookingId).slice(0, 8) : "N/A";

    const date = body.preferred_date;
    const time = body.preferred_time;

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: id,
        status: "pending",
        message: "Slot reserved! Our team will contact you shortly to confirm.",
        whatsappLink: `https://wa.me/923094461407?text=${encodeURIComponent(
          `Hello Razia Driving Center\n\nI want to book a slot.\nDate: ${date}\nTime: ${time}\nBooking ID: #${id}`
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
    console.error("Slot booking function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
