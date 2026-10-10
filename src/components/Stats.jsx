import {
  Users,
  GraduationCap,
  Car,
  Star,
} from "lucide-react";

function StatCard({ Icon, value, title }) {
  return (
    <div className="flex flex-col items-center">
      <Icon size={24} className="mb-1.5 text-white/90" />

      <h2 className="text-xl font-black text-white md:text-2xl">
        {value}
      </h2>

      <p className="mt-0.5 text-xs text-white/70">
        {title}
      </p>
    </div>
  );
}

function Stats() {
  return (
    <section
      id="stats"
      className="bg-gradient-to-r from-[#FF3131] to-[#FF6201] py-5 text-white"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-4 px-6 text-center">

        <StatCard Icon={Users} value="5,218+" title="Students Trained" />

        <StatCard Icon={Star} value="5.0" title="Google Rating" />

        <StatCard Icon={GraduationCap} value="133" title="Google Reviews" />

        <StatCard Icon={Car} value="Est. 2016" title="Since 2016" />

      </div>
    </section>
  );
}

export default Stats;
