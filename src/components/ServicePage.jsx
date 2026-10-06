import { useMeta } from "../useMeta";
import { useRouter } from "../router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import ScrollProgress from "./ScrollProgress";
import PrimaryButton from "./UI/PrimaryButton";
import SectionTitle from "./UI/SectionTitle";
import { courses } from "../data/courses";
import {
  SERVICE_META,
  breadcrumbSchema,
  faqSchema,
  skills,
} from "../data/servicePageContent";
import {
  ShieldCheck,
  Car,
  Users,
  Award,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

function SkillCard({ skill }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-orange-200 hover:bg-orange-50">
      <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#FF6201]" />
      <span className="text-sm font-medium text-gray-700">{skill}</span>
    </div>
  );
}

function ServicePage() {
  const { navigateToSection } = useRouter();

  useMeta(SERVICE_META);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <ScrollProgress />
      <Navbar onBookNow={() => navigateToSection("contact")} />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50/40 to-white pt-32 pb-20">
        <div
          className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#FF6201] opacity-5 blur-[120px]"
          aria-hidden="true"
        />
        <div
          className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[#FF3131] opacity-5 blur-[120px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <nav className="mb-8 flex items-center justify-center gap-2 text-sm text-gray-500">
            <button
              onClick={() => navigateToSection("home")}
              className="transition hover:text-[#FF6201]"
            >
              Home
            </button>
            <ChevronRight size={14} />
            <span className="font-medium text-gray-700">
              Driving School Gulberg Lahore
            </span>
          </nav>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl">
            Driving School in{" "}
            <span className="bg-gradient-to-r from-[#FF3131] to-[#FF6201] bg-clip-text text-transparent">
              Gulberg Lahore
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Razia Driving Center provides practical one-to-one driving lessons
            from its Gulberg 2 location. Whether you are a complete beginner or
            want to build confidence on Lahore roads, our structured training
            helps you become a safe and independent driver.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <PrimaryButton onClick={() => navigateToSection("courses")}>
              View Our Driving Courses
            </PrimaryButton>
            <a
              href="tel:+923094461407"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#FF6201] px-8 py-4 font-semibold text-[#FF6201] transition-all duration-300 hover:-translate-y-1 hover:bg-[#FF6201] hover:text-white hover:shadow-xl"
            >
              <Phone size={18} />
              Call to Book
            </a>
          </div>
        </div>
      </section>

      {/* ===== SECTION 1: DRIVING LESSONS IN GULBERG 2 ===== */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                Driving Lessons in{" "}
                <span className="text-[#FF6201]">Gulberg 2, Lahore</span>
              </h2>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                Razia Driving Center is based in Gulberg 2, one of Lahore's most
                connected neighbourhoods. From this central location we provide
                one-to-one driving lessons on real Gulberg and Lahore roads,
                giving learners practical experience in the traffic conditions
                they will face every day.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Every lesson is a private session with no shared car time. Your
                instructor focuses entirely on your progress, adjusting the pace
                to suit your confidence and skill level.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Users, text: "One-to-one private lessons" },
                  { icon: Car, text: "Real Lahore road training" },
                  { icon: ShieldCheck, text: "Beginner-friendly instruction" },
                  { icon: Award, text: "Structured skill progression" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 p-4"
                  >
                    <Icon size={20} className="shrink-0 text-[#FF6201]" />
                    <span className="text-sm font-medium text-gray-700">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-orange-50 to-white p-8">
              <h3 className="text-xl font-bold text-gray-900">
                Quick Facts
              </h3>
              <div className="mt-6 space-y-5">
                {[
                  { label: "Based in", value: "Gulberg 2, Lahore" },
                  { label: "Students trained", value: "5,118+" },
                  { label: "Experience", value: "20+ years" },
                  { label: "Google rating", value: "5.0 from 133 reviews" },
                  { label: "Training hours", value: "8:00 AM – 8:00 PM daily" },
                  { label: "Lesson type", value: "One-to-one, manual car" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-gray-100 pb-3"
                  >
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: WHY CHOOSE ===== */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle
            badge="Why Razia Driving Center"
            title="Why Learn Driving with Razia Driving Center?"
            subtitle="Thousands of students across Lahore have learned to drive with us since 2016. Here what makes our training different."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Award,
                title: "20+ Years Experience",
                text: "Decades of driving and instruction experience behind every lesson.",
              },
              {
                icon: Users,
                title: "5,118+ Students",
                text: "Thousands of successful students trained across Lahore since 2016.",
              },
              {
                icon: ShieldCheck,
                title: "Female Instructor",
                text: "Experienced female instructor with ladies-focused training available.",
              },
              {
                icon: Car,
                title: "Real Traffic Training",
                text: "Practice on actual Lahore roads, not just isolated practice areas.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                  <Icon size={24} className="text-[#FF6201]" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: WHAT YOU CAN LEARN ===== */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle
            badge="Practical Skills"
            title="What You Can Learn"
            subtitle="Our training covers the full range of practical driving skills, from basic vehicle control to confident independent driving in Lahore traffic."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill} skill={skill} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: BEGINNERS ===== */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl bg-white p-8 shadow-lg">
                <div className="flex items-center gap-4 rounded-2xl bg-orange-50 p-5">
                  <Users size={32} className="text-[#FF6201]" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#FF6201]">
                      Beginner Friendly
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      Start from zero. Drive with confidence.
                    </p>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 text-gray-600">
                  {[
                    "Lessons start from basic vehicle control",
                    "No prior driving experience needed",
                    "Progress at your own pace",
                    "Patient, confidence-building instruction",
                    "Move from basics to real traffic gradually",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-[#FF6201]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                Driving Lessons for{" "}
                <span className="text-[#FF6201]">Beginners</span>
              </h2>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                Most of our students are complete beginners. Your first lessons
                focus on the fundamentals — starting, stopping, steering and
                understanding how the vehicle responds. Once you are comfortable
                with basic control, you progress to turns, lane changes and
                navigating real Lahore junctions.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                There is no rush. Each lesson builds on the last, so you develop
                genuine confidence before moving to busier roads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: LADIES DRIVING ===== */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
              Ladies Driving Lessons in{" "}
              <span className="text-[#FF6201]">Gulberg</span>
            </h2>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Razia Driving Center is led by an experienced female instructor,
              Madam Razia. Ladies-focused training is available for students who
              prefer learning in a comfortable, supportive environment.
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              All lessons are private one-to-one sessions, with patient
              instruction focused on building confidence and practical driving
              skill.
            </p>
            <div className="mt-8">
              <a
                href="https://wa.me/923094461407"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                Enquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: REAL LAHORE TRAFFIC ===== */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                Driving Training in{" "}
                <span className="text-[#FF6201]">Real Lahore Traffic</span>
              </h2>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                Practical training at Razia Driving Center takes place on real
                Lahore roads. Rather than practicing only in empty spaces, you
                learn to navigate actual traffic conditions — junctions,
                roundabouts, busy market roads and mixed traffic.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                This real-world approach helps you build the awareness and
                confidence needed to drive independently after your course
                ends.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8">
              <h3 className="text-xl font-bold text-gray-900">
                Training covers
              </h3>
              <div className="mt-6 grid gap-3">
                {[
                  "Gulberg and Lahore main roads",
                  "Junctions and intersections",
                  "Roundabouts and U-turns",
                  "Parking in real spaces",
                  "Mixed-traffic awareness",
                  "Defensive driving habits",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Car size={18} className="shrink-0 text-[#FF6201]" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: COURSES ===== */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionTitle
            badge="Structured Courses"
            title="Driving Courses"
            subtitle="Choose a structured course or build your own training plan. All courses include one-to-one manual-car instruction."
          />

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.name}
                className={`rounded-3xl border bg-white p-8 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl ${
                  course.badge ? "border-2 border-[#FF6201]" : "border-gray-100"
                }`}
              >
                {course.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-3 py-1 text-xs font-bold text-white">
                    {course.badge.text}
                  </span>
                )}
                <h3 className="mt-4 text-2xl font-black text-gray-900">
                  {course.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{course.name}</p>
                <div className="mt-5">
                  <span className="text-4xl font-black text-[#FF3131]">
                    {course.price}
                  </span>
                  <span className="ml-2 text-base text-gray-400 line-through">
                    {course.oldPrice}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-gray-600">
                  <Clock size={16} className="text-[#FF6201]" />
                  <span className="text-sm font-medium">{course.duration}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500">
              Visit the full courses page for features, pricing details and the
              custom course builder.
            </p>
            <button
              onClick={() => navigateToSection("courses")}
              className="mt-4 inline-flex items-center gap-2 font-semibold text-[#FF6201] transition hover:text-[#FF3131]"
            >
              View all course details
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ===== SECTION 8: PICK & DROP ===== */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
              Pick & Drop / Home Service
            </h2>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              The PLUS Plan includes pick & drop within the first 2 km of the
              training route. Beyond 2 km, an additional charge applies based on
              distance, daily sessions and course duration.
            </p>

            <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6">
              <h3 className="font-bold text-gray-900">
                Pick & Drop Pricing (beyond 2 km)
              </h3>
              <p className="mt-3 text-gray-600">
                Additional charge ={" "}
                <span className="font-mono text-sm text-gray-800">
                  distance_km × Rs 50 × course duration (days) × 2
                </span>
              </p>
              <p className="mt-3 text-sm text-gray-500">
                This applies to the PLUS Plan only. Contact us to confirm
                availability for your area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 9: LOCATION ===== */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                Location & Directions
              </h2>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                Razia Driving Center is located in Gulberg 2, Lahore. Visit us
                for a free consultation or to discuss your training plan.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <MapPin size={22} className="mt-1 text-[#FF6201]" />
                  <div>
                    <h3 className="font-bold text-gray-900">Address</h3>
                    <p className="mt-1 text-gray-600">
                      28/A, S Block, Gulberg 2, Lahore, 54660, Pakistan
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone size={22} className="mt-1 text-[#FF6201]" />
                  <div>
                    <h3 className="font-bold text-gray-900">Phone</h3>
                    <a
                      href="tel:+923094461407"
                      className="mt-1 text-gray-600 transition hover:text-[#FF6201]"
                    >
                      +92 309 4461407
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock size={22} className="mt-1 text-[#FF6201]" />
                  <div>
                    <h3 className="font-bold text-gray-900">Training Hours</h3>
                    <p className="mt-1 text-gray-600">
                      8:00 AM – 8:00 PM, Monday – Sunday
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="https://www.google.com/maps/dir//28+S+Block,+Razia+Driving+Center,+Plot,+2+Gulberg+Rd,+Block+S+Gulberg+2,+Lahore,+54660,+Pakistan/@31.5077711,74.3470166,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3919058cfa714f95:0x4628296acb17c69e!2m2!1d74.3575145!2d31.5201889"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  Get Directions on Google Maps
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl shadow-xl">
              <iframe
                title="Razia Driving Center — Gulberg 2, Lahore"
                src="https://www.google.com/maps?q=31.5201889,74.3575145&z=15&output=embed"
                width="100%"
                height="380"
                loading="lazy"
                className="border-0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 10: FAQ ===== */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-center text-gray-500">
            Common questions about learning to drive with Razia Driving Center
            in Gulberg.
          </p>

          <div className="mt-12 space-y-4">
            {faqSchema.mainEntity.map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-white shadow-md"
              >
                <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-bold text-gray-900">
                  {faq.name}
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-gray-400 transition-transform group-open:rotate-90"
                  />
                </summary>
                <div className="px-6 pb-6 leading-7 text-gray-600">
                  {faq.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 11: CTA ===== */}
      <section className="bg-gradient-to-r from-[#FF3131] to-[#FF6201] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">
            Ready to Start Learning?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Contact Razia Driving Center to discuss your experience level and
            choose the right course for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+923094461407"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-[#FF3131] shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <Phone size={18} />
              +92 309 4461407
            </a>
            <a
              href="https://wa.me/923094461407"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-white px-8 py-4 font-semibold text-white transition hover:-translate-y-1 hover:bg-white hover:text-[#FF3131]"
            >
              WhatsApp Us
            </a>
            <button
              onClick={() => navigateToSection("contact")}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/60 px-8 py-4 font-semibold text-white transition hover:-translate-y-1 hover:border-white"
            >
              Contact Page
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default ServicePage;
