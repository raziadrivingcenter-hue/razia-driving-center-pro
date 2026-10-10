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
      "One-to-one driving lessons with an experienced female instructor.",
  },
  {
    icon: Navigation,
    title: "Real Lahore Traffic",
    description:
      "Practice on real Lahore roads to build confidence in actual traffic conditions.",
  },
  {
    icon: Car,
    title: "One-to-One Training",
    description:
      "Every lesson is private, personal attention from start to finish.",
  },
  {
    icon: Users,
    title: "5,218 Students",
    description:
      "Thousands of successful students have learned driving with us since 2016.",
  },
  {
    icon: Award,
    title: "5.0 on Google",
    description:
      "Rated 5.0 stars from 133 verified Google reviews.",
  },
  {
    icon: Clock,
    title: "Training Hours",
    description:
      "Driving lessons 8 AM – 8 PM. Consultation 7 AM – 12 AM, 7 days a week.",
  },
  {
    icon: GraduationCap,
    title: "Beginner Friendly",
    description:
      "Complete beginners learn basics, parking, reversing, U-turns and traffic rules.",
  },
  {
    icon: MapPinned,
    title: "Gulberg 2 & Across Lahore",
    description:
      "Based in Gulberg 2. Serving Gulberg III, Lahore Cantt and surrounding Lahore areas.",
  },
];

function WhyChoose() {
  return (
    <section
      id="why-choose"
      data-aos="fade-up"
      className="border-t border-[#E8E8E8] px-6 py-6 md:px-8 md:py-8"
      style={{
        background: "linear-gradient(135deg, #FFFBF7, #FFF9F5)",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Badge */}

        <span className="inline-block rounded-full bg-[#FFB84D] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#333]">
          Why Choose Us
        </span>

        {/* Heading */}

        <h2 className="mt-2 max-w-[500px] text-2xl font-extrabold leading-[1.2] text-[#1A1A1A] md:text-3xl">
          Why Choose Razia Driving Center?
        </h2>

        {/* Description */}

        <p className="mt-2 max-w-[550px] text-sm leading-[1.45] text-[#666]">
          Professional, safe and confidence-building driving lessons trusted by thousands of students across Lahore.
        </p>

        {/* Icon grid */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                  <Icon size={18} className="text-[#FF6201]" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-tight text-[#1A1A1A]">
                    {feature.title}
                  </h3>

                  <p className="mt-0.5 text-xs leading-snug text-[#666]">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;
