import {
  ShieldCheck,
  Car,
  Award,
  HeartHandshake,
  MapPinned,
  Users,
} from "lucide-react";

const badges = [
  {
    icon: <Award size={22} />,
    title: "20+ Years Experience",
  },
  {
    icon: <Users size={22} />,
    title: "5000+ Students Trained",
  },
  {
    icon: <Car size={22} />,
    title: "Real Traffic Training",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Female Driving Instructor",
  },
  {
    icon: <HeartHandshake size={22} />,
    title: "Patient One-to-One Teaching",
  },
  {
    icon: <MapPinned size={22} />,
    title: "Lahore Road Specialist",
  },
];

function InstructorBadges() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">

      {badges.map((badge) => (

        <div
          key={badge.title}
          className="
            group
            flex
            items-center
            gap-4
            rounded-2xl
            border
            border-orange-100
            bg-white
            p-4
            shadow-md
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-[#FF6201]
            hover:shadow-xl
          "
        >

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              text-white
              transition-transform
              duration-300
              group-hover:scale-110
              group-hover:rotate-6
            "
          >
            {badge.icon}
          </div>

          <p className="font-semibold text-gray-700">
            {badge.title}
          </p>

        </div>

      ))}

    </div>
  );
}

export default InstructorBadges;