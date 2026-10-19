import instructorImage from "../../assets/instructor/instructor.png";
import { motion } from "framer-motion";
import {
  Award,
  Users,
  Car,
  ShieldCheck,
  HeartHandshake,
  MapPinned,
  Star,
} from "lucide-react";

const badges = [
  { icon: Award, label: "Since 2016" },
  { icon: Users, label: "5,221 Students" },
  { icon: Car, label: "Real Traffic Training" },
  { icon: ShieldCheck, label: "Female Instructor" },
  { icon: HeartHandshake, label: "One-to-One Teaching" },
  { icon: MapPinned, label: "Lahore Specialist" },
];

const stats = [
  { value: "5.0", label: "Google Rating", star: true },
  { value: "136", label: "Reviews" },
  { value: "5,221", label: "Students Trained" },
];

function Instructor() {
  return (
    <section id="instructor" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">

        {/* Section Header */}
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-orange-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#FF6201]">
            Your Instructor
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950 md:text-4xl">
            Learn From Experience
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Trusted by thousands of students across Lahore for safe,
            confident and stress-free driving lessons.
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 overflow-hidden rounded-3xl bg-gray-50 shadow-sm ring-1 ring-gray-100"
        >
          <div className="grid lg:grid-cols-[1fr_1.3fr]">

            {/* ── Image Column ── */}
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 p-6 lg:p-8">
              <img
                src={instructorImage}
                alt="Madam Razia — Professional Female Driving Instructor"
                loading="lazy"
                decoding="async"
                className="relative z-10 mx-auto w-full max-w-sm rounded-2xl object-cover shadow-lg lg:max-w-none"
              />

              {/* Floating rating pill */}
              <div className="absolute bottom-10 left-6 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg ring-1 ring-gray-100">
                <span className="flex text-yellow-400">
                  <Star size={14} fill="currentColor" />
                </span>
                <span className="text-sm font-bold text-gray-900">
                  <span className="font-dm-sans">5.0</span>
                </span>
                <span className="text-xs text-gray-400">
                  <span className="font-dm-sans">136</span> reviews
                </span>
              </div>
            </div>

            {/* ── Content Column ── */}
            <div className="flex flex-col justify-center p-6 lg:p-10">

              {/* Name + role */}
              <h3 className="text-2xl font-extrabold tracking-tight text-gray-950 md:text-3xl">
                Madam Razia
              </h3>
              <p className="mt-1 text-sm font-semibold text-[#FF6201]">
                Professional Female Driving Instructor
              </p>

              {/* Bio */}
              <p className="mt-4 text-sm leading-[1.75] text-gray-500">
                Since December <span className="font-dm-sans font-semibold text-gray-700">2016</span>, Madam Razia
                has helped thousands of beginners become confident, responsible
                and independent drivers across Lahore. Every lesson focuses on
                confidence, safety and real traffic experience.
              </p>

              {/* Personal message */}
              <blockquote className="mt-6 border-l-[3px] border-[#FF6201] pl-4">
                <p className="text-sm italic leading-[1.7] text-gray-600">
                  "Every student deserves confidence behind the steering wheel.
                  My goal is to make learning enjoyable, safe and stress-free."
                </p>
                <cite className="mt-2 block text-xs font-bold not-italic tracking-wide text-[#FF6201]">
                  — Madam Razia
                </cite>
              </blockquote>

              {/* Badges — clean pill layout */}
              <div className="mt-7 flex flex-wrap gap-2">
                {badges.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-sm ring-1 ring-gray-100"
                  >
                    <Icon size={12} className="text-[#FF6201]" />
                    <span className="font-dm-sans">{label}</span>
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center rounded-xl bg-white px-2 py-4 text-center shadow-sm ring-1 ring-gray-100"
                  >
                    <span className="text-xl font-black text-gray-950">
                      <span className="font-dm-sans">{s.value}</span>
                      {s.star && (
                        <span className="ml-0.5 text-yellow-400">★</span>
                      )}
                    </span>
                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Instructor;
