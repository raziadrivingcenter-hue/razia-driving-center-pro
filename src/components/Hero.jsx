import { motion } from "framer-motion";

function Hero({ onBookNow }) {
  return (
    <section
      id="home"
      className="
        relative
        w-full
        bg-gradient-to-br
        from-[#FF3131]
        to-[#FF6201]
        pt-20
        pb-8
        md:pt-24
        md:pb-10
      "
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
            Driving School in Gulberg 2, Lahore
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
      </div>
    </section>
  );
}

export default Hero;
