import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { courses } from "../lib/enrollment";
import { useRouter } from "../router";
import { getSession } from "../lib/auth";

/**
 * Dashboard enrollment gateway — shown when the authenticated Google account
 * doesn't resolve to a student record (or resolves to one with no course).
 *
 * The student picks a course here, then continues to the LIVE public slot-
 * availability flow (/slot-availability/) where they choose a date + time and
 * complete the existing BookingForm. The booking lands in the same
 * public.booking_requests table the school's SoD desktop already polls — so
 * there is no second pending queue and no separate admin workflow.
 *
 * Identity hand-off:
 *  - The verified Google profile name and the Supabase session access token are
 *    stashed in sessionStorage (NOT the URL) and carried into the booking. The
 *    token proves identity SERVER-SIDE: the endpoint validates it against the
 *    Auth server and derives the email from the verified user. The email is
 *    NEVER sent from the browser, so it can't be spoofed.
 *
 * This component no longer submits to the legacy enrollment_requests table.
 * Existing enrollment_requests data and RPC are left untouched.
 *
 * @param {{ user: object }} props - the Supabase auth user (for identity + course context).
 */
export default function EnrollNow({ user }) {
  const { navigate } = useRouter();
  const [title, setTitle] = useState(null);
  // Set when the signed-in session can't be confirmed. Blocks the hand-off so a
  // dashboard booking is never submitted without a verifiable identity (which
  // would otherwise fall through to an anonymous booking with no email).
  const [sessionError, setSessionError] = useState(false);

  const handleContinue = async () => {
    if (!title) return;
    setSessionError(false);

    // Prove the active session up-front. A dashboard booking must carry a
    // verifiable identity, so we do NOT fall back to an anonymous hand-off if
    // the session/token can't be confirmed — we stop and ask to sign in again.
    let accessToken;
    try {
      const session = await getSession();
      accessToken = session?.access_token || "";
    } catch {
      accessToken = "";
    }
    if (!accessToken) {
      setSessionError(true);
      return;
    }

    try {
      sessionStorage.setItem(
        "rdc_dashboard_prefill",
        JSON.stringify({
          name: user?.user_metadata?.full_name || "",
          accessToken,
        })
      );
    } catch {
      /* sessionStorage unavailable — block rather than submit unverified */
      setSessionError(true);
      return;
    }
    navigate(`/slot-availability/?course=${encodeURIComponent(title)}`);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
      <h3 className="text-lg font-extrabold text-gray-900">Enroll Now</h3>
      <p className="mt-1 text-sm text-gray-500">
        Choose a course to start. You&apos;ll pick a date and time next, and your
        booking goes straight to the school to set up your student record and
        first lessons.
      </p>

      {/* Read-only, authoritative Google email — proof of verified identity */}
      <div className="mt-5">
        <label className="block text-xs font-semibold text-gray-500">
          Signed in with (read-only)
        </label>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          <span className="truncate">{user?.email}</span>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400">
          Your verified sign-in links this booking to your account — you won&apos;t need
          to type your email.
        </p>
      </div>

      {/* Course selector */}
      <div className="mt-5">
        <span className="block text-xs font-semibold text-gray-500">Select a course</span>
        <div className="mt-2 grid gap-2">
          {courses.map((c) => {
            const active = title === c.title;
            return (
              <button
                type="button"
                key={c.title}
                onClick={() => setTitle(c.title)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{c.title}</p>
                  <p className={`mt-0.5 text-xs ${active ? "text-gray-300" : "text-gray-500"}`}>
                    {c.duration}
                  </p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="block text-sm font-bold">{c.price}</span>
                  {c.oldPrice && (
                    <span
                      className={`text-[11px] line-through ${
                        active ? "text-gray-400" : "text-gray-400"
                      }`}
                    >
                      {c.oldPrice}
                    </span>
                  )}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Block the hand-off if the verified session can't be confirmed */}
      {sessionError && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            We couldn&apos;t confirm your sign-in. Please{" "}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-semibold underline"
            >
              sign in again
            </button>{" "}
            before booking — your booking needs a verified account so the school can
            contact you.
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!title}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-700 disabled:opacity-60"
      >
        Continue to booking
      </button>
      <p className="mt-3 text-[11px] text-gray-400">
        No payment or course activation happens yet — the school confirms every booking.
      </p>
    </div>
  );
}
