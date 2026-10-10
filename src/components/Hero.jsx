import { motion } from "framer-motion";
import {
  GiStopSign,
  GiSpeedometer,
  GiTrafficCone,
  GiDirectionSign,
  GiHazardSign,
  GiLevelCrossing,
  GiRoad,
  GiCrossroad,
} from "react-icons/gi";
import {
  BsSignYield,
  BsSignNoParking,
} from "react-icons/bs";
import { BiNoEntry } from "react-icons/bi";
import {
  MdOutlineRoundaboutLeft,
  MdOutlineLocalParking,
  MdOutlineSchool,
} from "react-icons/md";
import {
  TbArrowRoundaboutRight,
  TbParkingCircle,
} from "react-icons/tb";

import ReviewWall from "./Hero/ReviewWall";

// Scattered road-sign icons: { Icon, size, top, bottom, left, opacity }.
// All signs on the LEFT side — right side is reserved for the review wall.
const signs = [
  // large (96–120px)
  { Icon: GiStopSign,            size: 110, top: "3%",  left: "4%",  opacity: 0.18 },
  { Icon: BiNoEntry,             size: 100, bottom: "6%", left: "10%", opacity: 0.16 },
  { Icon: GiDirectionSign,       size: 96,  top: "45%", left: "1%",  opacity: 0.20 },
  // medium (56–72px)
  { Icon: BsSignYield,           size: 64,  bottom: "4%", left: "20%", opacity: 0.15 },
  { Icon: MdOutlineRoundaboutLeft, size: 68, top: "3%", left: "30%", opacity: 0.18 },
  { Icon: GiHazardSign,          size: 60,  top: "22%", left: "18%", opacity: 0.16 },
  { Icon: GiCrossroad,           size: 60,  bottom: "28%", left: "24%", opacity: 0.14 },
  { Icon: MdOutlineLocalParking, size: 56,  top: "62%", left: "12%", opacity: 0.20 },
  // small (28–40px)
  { Icon: GiSpeedometer,         size: 36,  top: "15%", left: "38%", opacity: 0.16 },
  { Icon: MdOutlineSchool,       size: 32,  bottom: "18%", left: "36%", opacity: 0.18 },
  { Icon: GiTrafficCone,         size: 36,  top: "50%", left: "28%", opacity: 0.14 },
  { Icon: GiLevelCrossing,       size: 32,  bottom: "42%", left: "6%",  opacity: 0.18 },
  { Icon: GiRoad,                size: 28,  bottom: "50%", left: "18%", opacity: 0.15 },
  { Icon: BsSignNoParking,       size: 32,  top: "72%", left: "22%", opacity: 0.16 },
  { Icon: TbArrowRoundaboutRight, size: 40, bottom: "8%", left: "36%", opacity: 0.14 },
  { Icon: TbParkingCircle,       size: 32,  top: "12%", left: "42%", opacity: 0.18 },
];

function Hero({ onBookNow }) {
  return (
    <section
      id="home"
      className="
        relative
        w-full
        overflow-hidden
        bg-gradient-to-br
        from-[#FF3131]
        to-[#FF6201]
        pt-20
        pb-8
        md:pt-16
        md:pb-12
      "
    >
      {/* Embossed road-sign pattern layer.
          Above the orange gradient, below the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      >
        {signs.map(({ Icon, size, top, bottom, left, right, opacity }, i) => (
          <Icon
            key={i}
            size={size}
            color="white"
            style={{
              position: "absolute",
              top,
              bottom,
              left,
              right,
              opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl items-center gap-10 px-6 md:px-8 lg:gap-12">
        {/* Left column: headline, description, buttons, fact */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="min-w-0 flex-1"
        >
          {/* H1 */}

          <h1
            className="
              text-[1.6rem]
              font-extrabold
              leading-[1.2]
              tracking-tight
              text-white
              md:text-[2.25rem]
            "
          >
            Driving School in
            <br />
            Gulberg 2, Lahore
          </h1>

          {/* Supporting Line */}

          <p className="mt-3 max-w-[520px] text-sm leading-snug text-white/85 md:text-base">
            One-to-one lessons with Madam Razia. Pick-up, training in your area, then drop home.
          </p>

          {/* CTA Buttons */}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onBookNow}
              className="
                inline-flex
                items-center
                justify-center
                rounded-full
                bg-white
                px-5
                py-2.5
                text-sm
                font-bold
                text-[#FF3131]
                transition-transform
                duration-200
                hover:-translate-y-0.5
              "
            >
              Book a Course
            </button>

            <a
              href="https://wa.me/923094461407"
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex
                items-center
                justify-center
                rounded-full
                bg-[#25D366]
                px-5
                py-2.5
                text-sm
                font-bold
                text-white
                transition-transform
                duration-200
                hover:-translate-y-0.5
              "
            >
              Chat on WhatsApp
            </a>
          </div>

          {/* Fact Row */}

          <p className="mt-5 text-xs text-white/70">
            5.0 Google Rating · 133 Reviews · 5,218+ Students Trained · Est. 2016
          </p>
        </motion.div>

        {/* Right column: review brick wall (desktop only) */}
        <div className="hidden shrink-0 min-[900px]:block">
          <ReviewWall />
        </div>
      </div>
    </section>
  );
}

export default Hero;
