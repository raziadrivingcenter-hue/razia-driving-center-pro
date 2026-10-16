/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Slot-page registration booking.
/*  Route: /api/v1/slot-booking
/*  Inserts into public.booking_requests (same table as the wizard).
/*  Collects name + phone + course + pick&drop, then reserves the slot.
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

    // Pick & Drop validation (optional — only when enabled)
    const wantsPickDrop = body.home_service === true;
    if (wantsPickDrop) {
      if (!body.address || !String(body.address).trim()) {
        errors.push("Pickup address is required for Pick & Drop");
      }
      const dist = Number(body.distance_km);
      if (!Number.isFinite(dist) || dist <= 0) {
        errors.push("Distance is required for Pick & Drop");
      } else if (dist > 20) {
        errors.push("Pick & Drop is only available up to 20 KM");
      }
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

    // Call the SECURITY DEFINER RPC. anon only needs EXECUTE on this
    // function — it cannot read or write booking_requests directly, so
    // student names/phones stay private.
    const rpcPayload = {
      p_customer_name: String(body.customer_name).trim(),
      p_customer_phone: String(body.customer_phone).trim(),
      p_preferred_date: body.preferred_date,
      p_preferred_time: body.preferred_time,
      // Store the internal course name in the DB; display title separately.
      p_preferred_course: body.course ? String(body.course).trim() : null,
      p_distance_km: wantsPickDrop ? Number(body.distance_km) : 0,
      p_home_service: wantsPickDrop,
      p_address: wantsPickDrop && body.address ? String(body.address).trim() : null,
    };

    // Bound the upstream RPC so a slow/hung Supabase edge can't hold the
    // function past the browser's QUIC idle timeout (~30s). Fail fast → 503.
    const rpcAbort = new AbortController();
    const rpcTimeout = setTimeout(() => rpcAbort.abort(), 15000);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/submit_slot_booking`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(rpcPayload),
        signal: rpcAbort.signal,
      }
    ).finally(() => clearTimeout(rpcTimeout));

    if (!response.ok) {
      const errorText = await response.text();
      // Log a safe diagnostic (no credentials or personal data) for debugging.
      console.error("Slot booking RPC failed:", response.status, errorText);
      const status = response.status === 400 ? 400 : 503;
      const errorBody = { error: "Booking submission failed" };
      if (response.status === 400) {
        errorBody.details = ["Please check your details and try again."];
      }
      return new Response(
        JSON.stringify(errorBody),
        { status, headers: { "Content-Type": "application/json" } }
      );
    }

    // RPC returns the new booking id (UUID). PostgREST serializes a scalar
    // return as the raw value — e.g. "354795d6-7b69-4b45-bcd2-ff7792e37c23".
    // Use the first segment (8 hex chars) as the human-friendly booking ref.
    const rawBody = await response.text().then((t) => t.trim().replace(/^"|"$/g, ""));
    let bookingId = "N/A";
    if (rawBody) {
      const uuidPrefix = rawBody.split("-")[0];
      bookingId = uuidPrefix.length === 8 ? uuidPrefix : rawBody.slice(0, 8);
    }

    const date = body.preferred_date;
    const time = body.preferred_time;
    // Prefer the human-friendly display title (e.g. "PLUS Plan"); fall back to
    // the internal name, then a generic label.
    const course = body.course_title || body.course || "Slot Booking";

    return new Response(
      JSON.stringify({
        success: true,
        bookingId,
        status: "pending",
        message: "Slot reserved! Our team will contact you shortly to confirm.",
        whatsappLink: `https://wa.me/923094461407?text=${encodeURIComponent(
          `Hello Razia Driving Center\n\nI want to book a slot.\nDate: ${date}\nTime: ${time}\nCourse: ${course}\nBooking ID: #${bookingId}`
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
    // An aborted RPC (15s timeout) is a transient upstream issue, not a
    // code fault — surface it as 503 so the frontend can retry.
    if (error.name === "AbortError") {
      console.error("Slot booking RPC timed out");
      return new Response(
        JSON.stringify({ error: "Booking service is slow right now. Please try again." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Slot booking function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
