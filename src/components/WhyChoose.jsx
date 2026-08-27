import {
  ShieldCheck,
  Car,
  Navigation,
  Users,
  Award,
  Clock,
  GraduationCap,
  MapPinned,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Female Instructor",
    description:
      "Professional one-to-one driving lessons by an experienced female instructor.",
  },
  {
    icon: Navigation,
    title: "Real Traffic Training",
    description:
      "Practice on real Lahore roads to build confidence in actual traffic.",
  },
  {
    icon: Car,
    title: "One-to-One Training",
    description:
      "Personal attention throughout your driving course for faster learning.",
  },
  {
    icon: Users,
    title: "5000+ Students",
    description:
      "Thousands of successful students have learned driving with us.",
  },
  {
    icon: Award,
    title: "20+ Years Experience",
    description:
      "More than two decades of professional driving instruction experience.",
  },
  {
    icon: Clock,
    title: "Flexible Timing",
    description:
      "Morning and evening driving classes to fit your schedule.",
  },
  {
    icon: GraduationCap,
    title: "Confidence Building",
    description:
      "Learn safe driving techniques and become a confident driver.",
  },
  {
    icon: MapPinned,
    title: "Lahore Coverage",
    description:
      "Driving lessons available across Gulberg and surrounding Lahore areas.",
  },
];

function WhyChoose() {
  return (
    <section
      id="why-choose"
      data-aos="fade-up"
      className="border-t border-[#E8E8E8] px-8 py-12 md:px-16 md:py-16"
      style={{
        background: "linear-gradient(135deg, #FFFBF7, #FFF9F5)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Badge */}
        <span className="inline-block rounded-full bg-[#FFB84D] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#333]">
          Why Choose Us
        </span>

        {/* Heading */}
        <h2 className="mt-3 max-w-[600px] text-3xl font-extrabold leading-tight text-[#1A1A1A] md:text-[40px]">
          Why Choose Razia Driving Center?
        </h2>

        {/* Description */}
        <p className="mt-4 max-w-[650px] text-base leading-relaxed text-[#666] md:text-lg">
          We provide professional, safe and confidence-building driving
          lessons trusted by thousands of students across Lahore.
        </p>

        {/* Icon grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                data-aos="zoom-in"
                data-aos-delay={index * 80}
                className="group rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 transition-all duration-300 group-hover:scale-110">
                  <Icon size={28} className="text-[#FF6201]" />
                </div>

                <h3 className="text-base font-bold text-[#1A1A1A]">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#666]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;
