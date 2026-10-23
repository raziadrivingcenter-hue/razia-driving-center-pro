import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LogOut,
  User,
  LayoutDashboard,
  Clock,
  Route,
  TrendingUp,
  GraduationCap,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useMeta } from "../useMeta";
import { useRouter } from "../router";
import { getSession, signOut, onAuthStateChange } from "../lib/auth";
import {
  getMyLink,
  fetchMyProgress,
  resolvePortalStudent,
  fetchPortalProgress,
} from "../lib/progress";
import EnrollNow from "./EnrollNow";
import Navbar from "./Navbar";
import ScrollProgress from "./ScrollProgress";
import WhatsAppButton from "./WhatsAppButton";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const DASHBOARD_META = {
  title: "My Dashboard | Razia Driving Center",
  description:
    "Track your driving lessons, driven kilometres, time on the road and overall progress with Razia Driving Center.",
  canonical: "https://raziadrivingcenter.com/dashboard/",
};

export default function Dashboard() {
  const { navigate } = useRouter();
  const [user, setUser] = useState(null);
  // loading        → spinner
  // signed-out     → redirecting home (renders null)
  // ready          → resolved to one student with lessons → show progress
  // enroll         → no student matched, or matched but no course → Enroll Now form
  // contact        → multiple students matched → ask them to contact the school
  const [status, setStatus] = useState("loading");
  const [progress, setProgress] = useState([]);
  const [fetchError, setFetchError] = useState("");

  useMeta(DASHBOARD_META);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    (async () => {
      const session = await getSession();
      if (cancelled) return;

      if (!session?.user) {
        // No session ← not signed in. Send home where they can sign in.
        setStatus("signed-out");
        navigate("/");
        return;
      }

      setUser(session.user);

      // Keep the user in sync (covers token refresh + sign-out while here).
      unsubscribe = onAuthStateChange((u) => {
        if (cancelled) return;
        if (!u) {
          setStatus("signed-out");
          navigate("/");
        } else {
          setUser(u);
        }
      });

      try {
        // Primary path: resolve the verified Google email to a student record
        // via the private student_portal_registry (server-side only).
        const identity = await resolvePortalStudent();
        if (cancelled) return;

        if (identity?.status === "linked") {
          // Exactly one student matched and has lessons → show their progress.
          const rows = await fetchPortalProgress();
          if (cancelled) return;
          setProgress(rows);
          setStatus("ready");
          return;
        }

        if (identity?.status === "multiple") {
          // Ambiguous: don't guess, don't expose data. Ask them to contact school.
          setStatus("contact");
          return;
        }

        // status "no_match" or "no_course".
        // Backwards-compat: if the legacy student_link mapping exists and yields
        // lessons, honour it. Registry always wins when it has a match, so this
        // path is only reached when the registry has nothing for this email.
        const link = await getMyLink();
        if (cancelled) return;
        if (link) {
          const rows = await fetchMyProgress();
          if (cancelled) return;
          if (rows.length > 0) {
            setProgress(rows);
            setStatus("ready");
            return;
          }
        }

        // No student matched, or matched without a course/lessons → Enroll Now.
        setStatus("enroll");
      } catch {
        if (!cancelled)
          setFetchError("Couldn't load your dashboard. Please try again shortly.");
        if (!cancelled) setStatus("enroll");
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
    // navigate is stable from the router context; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      /* ignore — navigate regardless */
    }
    navigate("/");
  };

  // ── Derived metrics (only meaningful in "ready") ──
  const metrics = (() => {
    const totalLessons = progress.length;
    const totalKm = progress.reduce(
      (sum, r) => sum + (Number(r.distance_km) || 0),
      0
    );
    const totalMinutes = progress.reduce((sum, r) => {
      const fromLesson = r.duration_minutes || 0;
      const fromTrack = Math.round((r.duration_seconds || 0) / 60);
      return sum + fromLesson + fromTrack;
    }, 0);
    const tracked = progress.filter((r) => r.duration_seconds > 0).length;

    const timeLabel =
      totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        : `${totalMinutes} min`;

    return [
      { icon: GraduationCap, label: "Lessons", value: String(totalLessons), sub: "completed" },
      { icon: Route, label: "Driven", value: `${totalKm.toFixed(1)} km`, sub: "total distance" },
      { icon: Clock, label: "Time on road", value: timeLabel, sub: "total practice" },
      { icon: TrendingUp, label: "Sessions tracked", value: String(tracked), sub: "with GPS data" },
    ];
  })();

  const givenName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";

  // ── Signed-out: already redirecting home ──
  if (status === "signed-out") {
    return null;
  }

  // ── Loading ──
  if (status === "loading" || !user) {
    return (
      <>
        <ScrollProgress />
        <Navbar onBookNow={() => navigate("/slot-availability/")} />
        <div className="min-h-screen bg-white pt-24">
          <div className="mx-auto max-w-6xl px-6 md:px-8">
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
              <Loader2 size={32} className="animate-spin text-[#FF6201]" />
              <p className="text-sm font-medium text-gray-500">Loading your dashboard…</p>
            </div>
          </div>
        </div>
        <WhatsAppButton hidden />
      </>
    );
  }

  return (
    <>
      <ScrollProgress />
      <Navbar onBookNow={() => navigate("/slot-availability/")} />

      <div className="min-h-screen bg-white pt-24">
        {/* ── Hero header — same feel as the homepage hero ── */}
        <section className="font-raleway relative overflow-hidden bg-white pb-10 pt-12 md:pt-16">
          <div className="relative mx-auto max-w-6xl px-6 md:px-8">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
              {/* ── Left column ── */}
              <div className="max-w-[720px]">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#FF3131] to-[#FF6201]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Gulberg 2, Lahore
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
                  className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-950 md:text-5xl lg:text-6xl"
                >
                  Welcome back,
                  <br />
                  <span className="text-[#FF6201]">{givenName}</span>
                </motion.h1>

                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
                  className="mt-5 max-w-[540px] space-y-4"
                >
                  <p className="text-[12px] font-bold leading-[0.88] text-gray-700 md:text-[14px]">
                    Track your driving progress — lessons, kilometres and time on the road.
                  </p>
                  <p className="text-[12px] leading-[0.88] text-gray-500 md:text-[14px]">
                    One-to-one training with Madam Razia. Your progress is updated after every lesson.
                  </p>
                </motion.div>

                {/* Stat labels — mirrors the homepage hero benefit row */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}
                  className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2"
                  aria-label="Your stats"
                >
                  {metrics.map((m) => (
                    <span
                      key={m.label}
                      className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
                      {m.value} {m.label.toLowerCase()}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* ── Right column — account card ── */}
              <div className="mt-2 flex justify-start lg:mt-16 lg:justify-end">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
                  className="w-full max-w-[320px]"
                >
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white">
                        <User size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {user.user_metadata?.full_name || givenName}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {user.email || "Signed in"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      <LayoutDashboard size={14} className="text-[#FF6201]" />
                      Razia Driving Center
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Progress section ── */}
        <section className="bg-gray-50 py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-6 md:px-8">
            <div className="max-w-[720px]">
              <span className="inline-block rounded-full bg-[#FFB84D] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#333]">
                Your Progress
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
                {status === "ready"
                  ? "At a glance"
                  : status === "contact"
                  ? "Contact the school"
                  : "Enroll Now"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {status === "ready"
                  ? "Detailed lesson-by-lesson breakdown, updated after every session."
                  : status === "contact"
                  ? "We found more than one student record for your account. To keep your data safe, we won't guess which is yours — please reach out and we'll get you set up."
                  : "Your Google account is signed in. Choose a course and share your details to get started."}
              </p>
            </div>

            {fetchError && (
              <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                {fetchError}
              </div>
            )}

            {/* ── Contact the school (ambiguous match) ── */}
            {status === "contact" && (
              <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                  <User size={22} className="text-[#FF6201]" />
                </div>
                <p className="mt-4 text-base font-semibold text-gray-800">
                  We need to confirm your student record
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Sign-in worked, but we found more than one student record for your account.
                  To keep your data safe we won't guess which is yours. Reach out and we'll
                  connect you to the right record.
                </p>
                <a
                  href="https://wa.me/923094461407?text=Hello%2C%20please%20help%20me%20set%20up%20my%20dashboard."
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                >
                  Contact us on WhatsApp
                </a>
              </div>
            )}

            {/* ── Enroll Now (no / unassigned student) ── */}
            {status === "enroll" && <EnrollNow user={user} />}

            {/* ── Ready: lessons + metrics ── */}
            {status === "ready" && (
              <>
                {/* Metric cards */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {metrics.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.label}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                            <Icon size={18} className="text-[#FF6201]" />
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {card.label}
                          </span>
                        </div>
                        <p className="mt-3 text-2xl font-extrabold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-400">{card.sub}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Lesson rows — or empty state */}
                {progress.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <GraduationCap size={22} className="text-gray-400" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      No lessons recorded yet
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-400">
                      Your progress will appear here as lessons are recorded. Your details are
                      private — only you can see them.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full table-fixed text-sm">
                        <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Date</th>
                            <th className="px-4 py-3 text-left font-semibold">Course</th>
                            <th className="px-4 py-3 text-left font-semibold">Distance</th>
                            <th className="px-4 py-3 text-left font-semibold">Time</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {progress.map((row, i) => (
                            <tr key={i} className="border-t border-gray-100 text-gray-700">
                              <td className="px-4 py-3">{row.lesson_date || "—"}</td>
                              <td className="px-4 py-3">{row.course || "—"}</td>
                              <td className="px-4 py-3">
                                {row.distance_km != null && row.distance_km !== 0
                                  ? `${Number(row.distance_km).toFixed(1)} km`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3">
                                {row.duration_minutes ? `${row.duration_minutes} min` : "—"}
                              </td>
                              <td className="px-4 py-3 capitalize">{row.status || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* No footer on the dashboard — matches the request. */}
      <WhatsAppButton hidden />
    </>
  );
}
