import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Clock3,
  Route,
  TrendingUp,
  GraduationCap,
  Gauge,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useMeta } from "../useMeta";
import { useRouter } from "../router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollProgress from "./ScrollProgress";
import WhatsAppButton from "./WhatsAppButton";
import SectionTitle from "./UI/SectionTitle";
import { courses } from "../data/courses";

// ---------------------------------------------------------------------------
// Page-level SEO. One H1, unique title/description/canonical — matches the
// project's existing useMeta convention (see ServicePage, SlotAvailability).
// ---------------------------------------------------------------------------
const LANDING_META = {
  title: "Student Progress Dashboard | Driving School in Lahore",
  description:
    "Explore technology-enabled driving lessons at Razia Driving Center in Gulberg 2, Lahore, with scheduled lessons and recorded driving progress through a personal student dashboard.",
  canonical: "https://raziadrivingcenter.com/student-progress-dashboard/",
};

// ---------------------------------------------------------------------------
// FAQPage structured data — mirrors the existing FAQ.jsx convention. Answers
// are grounded in the real implementation (no invented policies or timings).
// ---------------------------------------------------------------------------
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How can students view their driving lesson schedule?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Students sign in to their personal student dashboard to see upcoming lesson dates, time slots and course details. The schedule appears once a booking has been accepted by the school and the records are synchronised.",
      },
    },
    {
      "@type": "Question",
      name: "Can students see their actual recorded practice time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When an instructor records a driving session with start and end timestamps, the dashboard shows the actual elapsed practice time for that lesson. Scheduled lessons without a recorded session yet show their planned duration.",
      },
    },
    {
      "@type": "Question",
      name: "How is driving distance recorded?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Driving distance comes from GPS tracking data captured during an instructor-led session. It is displayed for lessons that have a recorded tracking session, together with the session history.",
      },
    },
    {
      "@type": "Question",
      name: "What happens after an online booking is accepted?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After the school reviews and accepts an online booking, the student's lesson schedule is created. Once synchronised, the student can view upcoming lessons and, after each session, any recorded progress in the dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "How can a student book a driving course in Lahore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Driving courses can be booked online through the booking page, or by contacting Razia Driving Center directly. The Basic, PLUS and PRO+ plans are listed with their duration and pricing on the courses page.",
      },
    },
  ],
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Illustrative sample data for the dashboard preview. This is NOT real student
// data — it mirrors the real data shapes (lesson_date, lesson_time, course,
// status, distance_km, duration) so the preview is accurate, but every value
// is fictional and the block is labelled as an example.
// ---------------------------------------------------------------------------
const SAMPLE_LESSONS = [
  { date: "Oct 22, 2026", slot: "9:00 AM", course: "PLUS Plan", status: "Completed", km: 5.2, duration: "30 min" },
  { date: "Oct 24, 2026", slot: "10:30 AM", course: "PLUS Plan", status: "Completed", km: 3.8, duration: "30 min" },
  { date: "Oct 27, 2026", slot: "9:00 AM", course: "PLUS Plan", status: "Scheduled", km: null, duration: "30 min" },
  { date: "Oct 29, 2026", slot: "11:00 AM", course: "PLUS Plan", status: "Scheduled", km: null, duration: "30 min" },
];

const SAMPLE_METRICS = [
  { icon: GraduationCap, label: "Lessons", value: "2", sub: "completed" },
  { icon: Route, label: "Driven", value: "9.0 km", sub: "total distance" },
  { icon: Clock3, label: "Time on road", value: "1h 0m", sub: "recorded practice" },
  { icon: TrendingUp, label: "Sessions tracked", value: "2", sub: "with GPS data" },
];

function StatusBadge({ status }) {
  const key = String(status || "").trim().toLowerCase();
  let styles = "bg-gray-100 text-gray-600 ring-gray-200";
  if (key === "completed") styles = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  else if (key === "scheduled") styles = "bg-blue-50 text-blue-700 ring-blue-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Reusable FAQ accordion — self-contained (the homepage FAQ component is
// coupled to its own data + section), built to the same accessible pattern.
// ---------------------------------------------------------------------------
function FAQAccordion({ items }) {
  const [active, setActive] = useState(null);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <button
            onClick={() => setActive(active === i ? null : i)}
            aria-expanded={active === i}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
          >
            <span className="text-sm font-bold leading-snug text-gray-900">{item.question}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-gray-400 transition-transform duration-300 ${
                active === i ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`grid transition-all duration-300 ${
              active === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <p className="px-4 pb-3 text-sm leading-6 text-gray-600">{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentProgressLanding() {
  const { navigate, navigateToSection } = useRouter();

  useMeta(LANDING_META);

  const faqItems = faqStructuredData.mainEntity.map((e) => ({
    question: e.name,
    answer: e.acceptedAnswer.text,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <ScrollProgress />
      <Navbar onBookNow={() => navigate("/slot-availability/")} />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-white pb-16 pt-28 md:pb-24 md:pt-36">
        {/* Subtle brand glow — matches ServicePage hero treatment */}
        <div
          className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#FF6201] opacity-[0.06] blur-[120px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[#FF3131] opacity-[0.05] blur-[120px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
            {/* Left — copy + CTAs */}
            <div className="max-w-[640px]">
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
                transition={{ duration: 0.5, delay: 0.06, ease: "easeOut" }}
                className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-950 md:text-5xl lg:text-6xl"
              >
                Learn to Drive
                <br />
                <span className="bg-gradient-to-r from-[#FF3131] to-[#FF6201] bg-clip-text text-transparent">
                  with More Transparency
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.5, delay: 0.14, ease: "easeOut" }}
                className="mt-5 max-w-[520px] text-base leading-7 text-gray-600 md:text-lg"
              >
                View your scheduled lessons and review recorded driving progress
                through a personal student dashboard. One-to-one driving lessons
                at Razia Driving Center, with real practice data captured by your
                instructor.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.5, delay: 0.22, ease: "easeOut" }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <button
                  onClick={() => navigateToSection("courses")}
                  className="btn-interactive inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-7 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/40"
                >
                  Explore Our Courses
                </button>
                <button
                  onClick={() => navigate("/slot-availability/")}
                  className="btn-interactive inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-7 text-sm font-semibold text-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300"
                >
                  Book a Driving Lesson
                </button>
              </motion.div>

              {/* Trust strip — same restrained style as the homepage hero */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
                  5.0 on Google
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
                  Female instructor
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6201]" />
                  One-to-one lessons
                </span>
              </motion.div>
            </div>

            {/* Right — illustrative dashboard preview (sample data, clearly labelled) */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
              className="mt-2 flex justify-start lg:mt-12 lg:justify-end"
            >
              <div className="w-full max-w-[360px]">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                        <Gauge size={16} className="text-[#FF6201]" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Your Progress</span>
                    </div>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF6201]">
                      Example
                    </span>
                  </div>

                  {/* Metric cards */}
                  <div className="grid grid-cols-2 gap-3 p-4">
                    {SAMPLE_METRICS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <div key={m.label} className="rounded-xl bg-gray-50 p-3">
                          <Icon size={16} className="text-[#FF6201]" />
                          <p className="mt-2 text-lg font-extrabold text-gray-900">{m.value}</p>
                          <p className="text-[11px] text-gray-400">{m.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mini lesson list */}
                  <div className="border-t border-gray-100 px-4 py-2">
                    <p className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Upcoming & recent lessons
                    </p>
                    <div className="divide-y divide-gray-50">
                      {SAMPLE_LESSONS.map((row) => (
                        <div key={row.date} className="flex items-center justify-between gap-2 py-2.5">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900">{row.date}</p>
                            <p className="text-[11px] text-gray-400">
                              {row.slot} · {row.course}
                            </p>
                          </div>
                          <StatusBadge status={row.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-2 px-1 text-center text-[11px] text-gray-400">
                  Illustrative preview — sample data, not a real student record.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== HOW THE STUDENT DASHBOARD WORKS ===== */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionTitle
            badge="How it works"
            title="From your first booking to tracked progress"
            subtitle="A simple, transparent flow for driving lessons in Lahore — from online booking to recorded practice data in your personal dashboard."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Book a lesson online",
                text: "Choose a course and reserve a 30-minute slot through our online booking page — available 7 AM to 7 PM, seven days a week.",
                icon: CalendarCheck,
              },
              {
                step: "2",
                title: "School reviews your booking",
                text: "The team at Razia Driving Center reviews every online booking and sets up your enrollment before lessons begin.",
                icon: ShieldCheck,
              },
              {
                step: "3",
                title: "View scheduled lessons",
                text: "After synchronisation, your personal dashboard shows your upcoming lesson dates, time slots and course details.",
                icon: Clock3,
              },
              {
                step: "4",
                title: "Review recorded progress",
                text: "When your instructor records a session, the dashboard shows actual practice time and distance for that lesson.",
                icon: TrendingUp,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-orange-200"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                    <Icon size={20} className="text-[#FF6201]" />
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FF6201]">Step {item.step}</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== PROGRESS TRACKING FEATURES ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <SectionTitle
            badge="What you can track"
            title="A clear picture of every driving lesson"
            subtitle="The student dashboard surfaces the data your instructor records — so you always know where you are in your training."
          />

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  icon: CalendarCheck,
                  title: "Scheduled lessons",
                  text: "See each lesson's date, time slot and course at a glance.",
                },
                {
                  icon: Clock3,
                  title: "Recorded practice time",
                  text: "Actual session duration, calculated from your instructor's start and end timestamps.",
                },
                {
                  icon: Route,
                  title: "Driving distance",
                  text: "Kilometres driven per lesson, captured from GPS tracking data when available.",
                },
                {
                  icon: TrendingUp,
                  title: "GPS session history",
                  text: "A record of instructor-led tracking sessions tied to your lessons.",
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-gray-200">
                      <Icon size={18} className="text-[#FF6201]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{f.title}</p>
                      <p className="mt-1 text-sm leading-5 text-gray-500">{f.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Available when recorded
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-gray-900">
                Honest numbers, not estimates
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Distance and practice-time figures depend on an instructor-recorded
                session being available for that lesson. Scheduled lessons always
                show their date, slot and planned duration; recorded metrics appear
                only once your instructor has captured the session.
              </p>
              <ul className="mt-5 space-y-3">
                {[
                  "Scheduled lesson dates and time slots",
                  "Course and lesson status (scheduled or completed)",
                  "Actual recorded session duration from timestamps",
                  "Recorded driving distance when a tracking session exists",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#FF6201]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONNECTED LEARNING EXPERIENCE ===== */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionTitle
                badge="Connected experience"
                title="Booking, scheduling and progress — in sync"
                center={false}
                subtitle="Online booking, the school's lesson scheduling, the instructor's session recording and the student dashboard work together so your progress stays up to date."
              />
              <div className="mt-6 space-y-4">
                {[
                  {
                    title: "Book online",
                    text: "Reserve a driving lesson at Razia Driving Center through the booking page.",
                  },
                  {
                    title: "Scheduled by the school",
                    text: "The school reviews your booking and builds your lesson schedule.",
                  },
                  {
                    title: "Recorded by your instructor",
                    text: "Instructors capture each session's practice data as you train on Lahore roads.",
                  },
                  {
                    title: "Visible in your dashboard",
                    text: "Your personal dashboard shows scheduled lessons and recorded progress in one place.",
                  },
                ].map((c) => (
                  <div key={c.title} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-[#FF3131] to-[#FF6201]" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.title}</p>
                      <p className="text-sm leading-5 text-gray-500">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course plans — reuses the real course data so copy stays accurate */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#FF6201]" />
                <h3 className="text-lg font-extrabold text-gray-900">Driving courses</h3>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Pick the plan that fits your schedule. Every course is one-to-one
                with Madam Razia.
              </p>
              <div className="mt-5 space-y-3">
                {courses.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => navigateToSection("courses")}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.duration}</p>
                    </div>
                    <span className="text-sm font-bold text-[#FF6201]">{c.price}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate("/slot-availability/")}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <MapPin size={16} />
                Book a lesson
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <SectionTitle
            badge="Questions"
            title="Frequently asked questions"
            subtitle="Answers about booking driving lessons in Lahore and using the student progress dashboard."
          />
          <div className="mt-8">
            <FAQAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="text-3xl font-extrabold leading-tight text-white md:text-4xl">
            Ready to Start Your{" "}
            <span className="bg-gradient-to-r from-[#FF3131] to-[#FF6201] bg-clip-text text-transparent">
              Driving Journey?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-gray-400">
            Explore our driving courses or book a lesson online. Razia Driving
            Center offers one-to-one driving lessons in Gulberg 2, Lahore.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigateToSection("courses")}
              className="btn-interactive inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-7 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/40"
            >
              Explore Our Courses
            </button>
            <button
              onClick={() => navigate("/slot-availability/")}
              className="btn-interactive inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-gray-700 px-7 text-sm font-semibold text-white transition-all duration-200 hover:border-gray-500 hover:bg-gray-800"
            >
              Book a Driving Lesson
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
