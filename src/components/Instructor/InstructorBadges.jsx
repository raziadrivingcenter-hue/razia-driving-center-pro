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
    icon: <Award size={16} />,
    title: "Est. 2016",
  },
  {
    icon: <Users size={16} />,
    title: "5,218 Students Trained",
  },
  {
    icon: <Car size={16} />,
    title: "Real Traffic Training",
  },
  {
    icon: <ShieldCheck size={16} />,
    title: "Female Driving Instructor",
  },
  {
    icon: <HeartHandshake size={16} />,
    title: "Patient One-to-One Teaching",
  },
  {
    icon: <MapPinned size={16} />,
    title: "Lahore Road Specialist",
  },
];

function InstructorBadges() {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">

      {badges.map((badge) => (

        <div
          key={badge.title}
          className="
            flex
            items-center
            gap-2.5
            rounded-lg
            border
            border-orange-100
            bg-white
            px-3
            py-2
            shadow-sm
          "
        >

          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              text-white
            "
          >
            {badge.icon}
          </div>

          <p className="text-xs font-semibold text-gray-700">
            {badge.title}
          </p>

        </div>

      ))}

    </div>
  );
}

export default InstructorBadges;
