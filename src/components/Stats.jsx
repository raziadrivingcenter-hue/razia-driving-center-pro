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

        <StatCard Icon={Users} value={<span className="font-dm-sans">5,221+</span>} title="Students Trained" />

        <StatCard Icon={Star} value={<span className="font-dm-sans">5.0</span>} title="Google Rating" />

        <StatCard Icon={GraduationCap} value={<span className="font-dm-sans">136</span>} title="Google Reviews" />

        <StatCard Icon={Car} value={<><span>Est. </span><span className="font-dm-sans">2016</span></>} title="Since 2016" />

      </div>
    </section>
  );
}

export default Stats;
