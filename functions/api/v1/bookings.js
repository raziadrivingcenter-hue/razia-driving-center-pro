/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Create booking request (website inquiry)
/*  Route: /api/v1/bookings
/*  Inserts into public.booking_requests (same table as SOD embed form).
/*  Staff accepts in SOD software → creates lessons → syncs slot_availability.
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

    // Map plan_type slug to course name for booking_requests
    const courseNameMap = {
      basic: "Basic Plan",
      plus: "PLUS Plan",
      pro: "PRO+ Plan",
    };

    const planType = body.plan_type.toLowerCase();
    const courseName = courseNameMap[planType] || body.plan_type;

    // Build notes from extra details
    const notesParts = [];
    if (body.slot_time) notesParts.push(`Preferred time: ${body.slot_time}`);
    if (body.course_start_date) notesParts.push(`Start date: ${body.course_start_date}`);
    if (body.duration_days) notesParts.push(`Duration: ${body.duration_days} days`);
    if (body.distance_km) notesParts.push(`Distance: ${body.distance_km} km`);
    if (body.pickup_address) notesParts.push(`Address: ${body.pickup_address}`);
    if (body.notes) notesParts.push(body.notes);

    // Insert into booking_requests (same table SOD reads)
    const bookingRecord = {
      customer_name: String(body.customer_name).trim(),
      customer_phone: String(body.phone_number).trim(),
      customer_email: body.email ? String(body.email).trim() : null,
      preferred_course: courseName,
      status: "pending",
      source: body.source || "website",
      area: body.area ? String(body.area).trim() : null,
      preferred_date: body.course_start_date || null,
      preferred_time: body.slot_time || null,
      distance_km: body.distance_km != null ? Number(body.distance_km) : null,
      home_service: body.distance_km > 0,
      message: notesParts.join(" | ") || null,
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

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: bookingId ? String(bookingId).slice(0, 8) : "N/A",
        status: "pending",
        message: "Booking request submitted. Our team will contact you shortly.",
        whatsappLink: `https://wa.me/923094461407?text=${encodeURIComponent(
          `Hello Razia Driving Center\n\nMy booking request has been submitted.\nBooking ID: #${bookingId}\nCourse: ${courseName}`
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
