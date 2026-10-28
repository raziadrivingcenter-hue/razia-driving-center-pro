/* ------------------------------------------------------------------ */
/*  Cloudflare Pages Function — Slot-page registration booking.
/*  Route: /api/v1/slot-booking
/*  Inserts into public.booking_requests (same table as the wizard).
/*  Collects name + phone + course + pick&drop, then reserves the slot.
/*
/*  Two booking paths converge here:
/*   1. Anonymous public bookings — no Authorization header. The 8-arg
/*      submit_slot_booking RPC is called; customer_email stays NULL.
/*   2. Authenticated dashboard bookings — a Supabase access token in the
/*      Authorization header. Verified SERVER-SIDE via the Auth user endpoint;
/*      the email is derived from the verified user (never trusted from the
/*      body). Invalid/expired tokens are rejected with 401. The 9-arg RPC
/*      overload persists the verified email.
/* ------------------------------------------------------------------ */

import { validateSlotTime } from "../../lib/slotConfig.js";

// Shared response headers for error replies (CORS + no-store).
function responseHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    } else {
      const timeCheck = validateSlotTime(body.preferred_time);
      if (!timeCheck.ok) {
        errors.push(`Preferred time: ${timeCheck.error}`);
      }
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

    // Visitor-selected town for area-discount display. Optional, trimmed.
    // Never trusted for the discount itself — the RPC derives the discount
    // server-side from slot_availability.
    const area = body.area ? String(body.area).trim() : "";

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Booking service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Identity: verify a dashboard access token server-side ──
    // Anonymous public bookings send NO Authorization header → verifiedEmail
    // stays NULL and the booking goes through the 8-arg RPC overload.
    //
    // If ANY Authorization header is present, the caller intends a dashboard
    // booking. It must be a usable Bearer token that verifies against the Auth
    // server AND belongs to a user with a confirmed email. We NEVER silently
    // fall back to the anonymous path for a supplied token — a malformed,
    // unusable, or unverified token is rejected so a student is never left
    // thinking they booked under a signed-in identity they don't actually have.
    //
    // The email is derived from the verified Auth response (email_confirmed_at
    // is the real Supabase "email verified" signal — a timestap when confirmed,
    // null when not). We never trust an email from the request body.
    let verifiedEmail = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const tokenMatch = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
      if (!tokenMatch) {
        // Header present but malformed (not "Bearer <token>") — reject rather
        // than silently booking as anonymous.
        return new Response(
          JSON.stringify({
            error:
              "Malformed authorization header. Please sign in again to book.",
          }),
          { status: 401, headers: responseHeaders() }
        );
      }
      const token = tokenMatch[1];
      if (!token || token === supabaseAnonKey) {
        // Unusable token (empty, or the anon/service key was passed as a
        // bearer identity) — reject.
        return new Response(
          JSON.stringify({
            error:
              "No valid sign-in provided. Please sign in again to book.",
          }),
          { status: 401, headers: responseHeaders() }
        );
      }
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!userRes.ok) {
        // Invalid / expired / tampered token. Reject — do not fall back to
        // an anonymous booking, as that would let a stale token silently
        // submit without a verified identity.
        return new Response(
          JSON.stringify({
            error:
              "Your sign-in is invalid or expired. Please sign in again to book.",
          }),
          { status: 401, headers: responseHeaders() }
        );
      }
      const user = await userRes.json();
      const email = user?.email || "";
      // Supabase records email confirmation as email_confirmed_at (timestamp,
      // or null when unconfirmed). Require both a present email and the
      // confirmation timestamp before trusting the identity.
      if (!email || !user?.email_confirmed_at) {
        const reason = !email
          ? "Your account has no email on file."
          : "Your email is not confirmed yet.";
        return new Response(
          JSON.stringify({
            error:
              `${reason} Please sign in again or confirm your email to book.`,
          }),
          { status: 403, headers: responseHeaders() }
        );
      }
      verifiedEmail = email;
    }

    // ── Choose the execution path + credentials ──
    // Anonymous public booking (no verified token) → original 8-arg overload,
    // called with the anon key (EXECUTABLE by anon — unchanged behavior).
    //
    // Verified dashboard booking → 9-arg overload. That overload is
    // EXECUTE-restricted to service_role, so it MUST be called with the
    // server-only service-role key. The key never leaves this function. If it
    // is not configured we FAIL CLOSED (503) — we never silently downgrade a
    // verified booking to the anonymous path.
    let rpcKey = supabaseAnonKey;
    const rpcPayload = {
      p_customer_name: String(body.customer_name).trim(),
      p_customer_phone: String(body.customer_phone).trim(),
      p_preferred_date: body.preferred_date,
      p_preferred_time: body.preferred_time,
      // Frontend sends the display title (PLUS Plan) — store it directly.
      // These are REQUIRED in the 9-arg overload, so pass explicit values.
      p_preferred_course: body.course ? String(body.course).trim() : null,
      p_distance_km: wantsPickDrop ? Number(body.distance_km) : 0,
      p_home_service: wantsPickDrop,
      p_address: wantsPickDrop && body.address ? String(body.address).trim() : null,
      // Visitor-selected town. The RPC uses it ONLY to match against the
      // slot's promo_area server-side — it never trusts the client's own
      // promo percent.
      p_area: area || null,
    };
    if (verifiedEmail) {
      if (!serviceRoleKey) {
        console.error("Dashboard booking rejected: SUPABASE_SERVICE_ROLE_KEY not configured");
        return new Response(
          JSON.stringify({
            error: "Booking service is not fully configured. Please try again later.",
          }),
          { status: 503, headers: responseHeaders() }
        );
      }
      rpcPayload.p_customer_email = verifiedEmail;
      rpcKey = serviceRoleKey;
    }

    // ── Pre-check: is the slot still 'available'? ──
    // Defense in depth. The RPC performs the same check (and is the authority
    // since it is directly callable with the anon key), but failing here lets
    // us return a clear, friendly message instead of a generic RPC failure —
    // and avoids an RPC round-trip that we know will reject.
    //
    // Normalize preferred_time to 'HH:MM' (24h) so it matches slot_start
    // whether the column stores 'HH:MM' or 'HH:MM:SS'.
    const normalizedTime = (() => {
      const m = String(body.preferred_time || "").match(/(\d{1,2}):(\d{2})/);
      if (!m) return "";
      return `${m[1].padStart(2, "0")}:${m[2]}`;
    })();
    const slotCheckQuery =
      `${supabaseUrl}/rest/v1/slot_availability` +
      `?slot_date=eq.${encodeURIComponent(body.preferred_date)}` +
      `&select=slot_start,status`;
    const slotCheckRes = await fetch(slotCheckQuery, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (slotCheckRes.ok) {
      const slotRows = await slotCheckRes.json();
      const stillAvailable = slotRows.some((s) => {
        const start = String(s.slot_start || "").slice(0, 5);
        return s.status === "available" && start === normalizedTime;
      });
      if (!stillAvailable) {
        return new Response(
          JSON.stringify({
            error:
              "This slot is no longer available. Please go back and pick another time.",
          }),
          { status: 409, headers: responseHeaders() }
        );
      }
    }
    // If the lookup itself failed (network/Supabase error), do NOT block the
    // booking — the RPC is the real gate and will catch a bad slot. Log and proceed.
    else {
      console.warn("Slot pre-check lookup failed:", slotCheckRes.status);
    }

    // Call the SECURITY DEFINER RPC. The chosen role (anon or service_role)
    // only needs EXECUTE on its overload — it cannot read or write
    // booking_requests directly, so student names/phones stay private.
    //
    // Single function with DEFAULT NULL on the optional params. Anonymous
    // public bookings omit p_customer_email → customer_email stays NULL;
    // verified dashboard bookings (service_role key) set it.
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
          apikey: rpcKey,
          Authorization: `Bearer ${rpcKey}`,
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
    const course = body.course || "Slot Booking";

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
