import { useEffect, useRef, useState } from "react";
import {
  Users,
  GraduationCap,
  Car,
  Star,
} from "lucide-react";

function AnimatedNumber({
  end,
  duration = 2000,
  decimals = 0,
  suffix = "",
}) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;

        started.current = true;

        const startTime = performance.now();

        function animate(currentTime) {
          const progress = Math.min(
            (currentTime - startTime) / duration,
            1
          );

          const value = end * progress;

          setCount(value);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        }

        requestAnimationFrame(animate);
      },
      {
        threshold: 0.4,
      }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function StatCard({
  Icon,
  end,
  suffix,
  title,
  decimals = 0,
}) {
  return (
    <div className="group rounded-3xl p-.5 transition-all duration-300 hover:-translate-y-5 hover:bg-white/15">

      <Icon
        size={40}
        className="mx-auto mb-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-6"
      />

      <h2 className="text-3xl font-black transition-all duration-300 group-hover:scale-110">

        <AnimatedNumber
          end={end}
          suffix={suffix}
          decimals={decimals}
        />

      </h2>

      <p className="mt-1 text-lg">
        {title}
      </p>

    </div>
  );
}

function Stats() {
  return (
    <section
      id="stats"
      data-aos="zoom-in"
      className="bg-gradient-to-r from-[#FF3131] to-[#FF6201] py-8 text-white"
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-3 text-center md:grid-cols-8">

        <StatCard
          Icon={Users}
          end={5000}
          suffix="+"
          title="Students Trained"
        />

        <StatCard
          Icon={GraduationCap}
          end={20}
          suffix="+"
          title="Years Experience"
        />

        <StatCard
          Icon={Car}
          end={10}
          suffix="+"
          title="Driving Courses"
        />

        <StatCard
          Icon={Star}
          end={5}
          decimals={1}
          suffix=" ★"
          title="Google Rating"
        />

      </div>
    </section>
  );
}

export default Stats;