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
      className="bg-gray-50 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">

          <span className="rounded-full bg-orange-100 px-4 py-2 font-semibold text-[#FF6201]">
            Why Choose Us
          </span>

          <h2 className="mt-6 text-5xl font-black">
            Why Choose Razia Driving Center?
          </h2>

          <p className="mt-4 text-lg text-gray-500">
            We provide professional, safe and confidence-building driving
            lessons trusted by thousands of students across Lahore.
          </p>

        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {features.map((feature, index) => {

            const Icon = feature.icon;

            return (

              <div
                key={index}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
                className="group rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-3 hover:border hover:border-[#FF6201] hover:shadow-2xl"
              >

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">

                  <Icon
                    size={34}
                    className="text-[#FF6201]"
                  />

                </div>

                <h3 className="text-2xl font-bold">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-600">
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