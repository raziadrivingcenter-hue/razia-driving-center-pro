import {
  ShieldCheck,
  Sparkles,
  LockKeyhole,
  Award,
  GraduationCap,
  ClipboardList,
  CarFront,
  UserRound,
  Gift,
  CalendarClock,
  BadgeIndianRupee,
  Target,
  Car,
  ShieldAlert,
  FileCheck,
  HandCoins,
  Clock,
  ThumbsUp,
  MapPinHouse,
  BadgeCheck,
} from "lucide-react";

// Feature → matching "referring logo" (lucide icon)
const FEATURES = [
  { icon: ShieldCheck, label: "Safety" },
  { icon: Sparkles, label: "Comfort Environment" },
  { icon: LockKeyhole, label: "Secure Payment" },
  { icon: Award, label: "Quality Training" },
  { icon: GraduationCap, label: "Experienced Instructor" },
  { icon: ClipboardList, label: "Complete Driving Programs" },
  { icon: CarFront, label: "Pick & Drop Available" },
  { icon: UserRound, label: "Female Instructor Available" },
  { icon: Gift, label: "2 Km Free On Plus Plan" },
  { icon: CalendarClock, label: "Flexible Scheduling" },
  { icon: BadgeIndianRupee, label: "Affordable Prices" },
  { icon: Target, label: "Test Preparation" },
  { icon: Car, label: "Own Car Training" },
  { icon: ShieldAlert, label: "Defensive Driving" },
  { icon: FileCheck, label: "License Assistance" },
  { icon: HandCoins, label: "Pay Per Lesson" },
  { icon: Clock, label: "Weekend Classes" },
  { icon: ThumbsUp, label: "High Pass Rate" },
  { icon: MapPinHouse, label: "Area Coverage" },
  { icon: BadgeCheck, label: "Certified Course" },
];

function FeatureItem({ icon: Icon, label }) {
  return (
    <li className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
      <Icon
        size={18}
        strokeWidth={1.6}
        className="text-gray-700"
        aria-hidden="true"
      />
      <span className="text-sm font-semibold tracking-wide text-gray-700">
        {label}
      </span>
    </li>
  );
}

// Decorative dot separator between items
function Sep() {
  return (
    <span
      aria-hidden="true"
      className="block h-1 w-1 shrink-0 rounded-full bg-gray-300"
    />
  );
}

export default function HeroFeaturesMarquee() {
  // Duplicated list → seamless -50% translate loop
  const loop = [...FEATURES, ...FEATURES];

  return (
    <div
      className="mt-10 w-full overflow-hidden border-y border-gray-100 py-4"
      aria-label="Razia Driving Center features"
    >
      <ul className="flex w-max animate-marquee-left items-center gap-6">
        {loop.map((f, i) => (
          <div key={i} className="flex shrink-0 items-center gap-6">
            <FeatureItem icon={f.icon} label={f.label} />
            <Sep />
          </div>
        ))}
      </ul>
    </div>
  );
}
