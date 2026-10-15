function Hero({ onBookNow }) {
  const title = "Driving School in Gulberg 2, Lahore";

  return (
    <section
      id="home"
      className="
        w-full
        bg-white
        py-10
        md:py-[4.5rem]
      "
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="max-w-[720px]">
          {/* Location label */}
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-400">
            Gulberg 2, Lahore
          </span>

          {/* H1 — each letter hoverable on desktop for a subtle bold shift */}
          <h1
            className="
              mt-2
              text-2xl
              font-extrabold
              leading-[1.15]
              tracking-tight
              text-black
              md:text-3xl
            "
          >
            {title.split("").map((char, i) => (
              <span
                key={i}
                className="md:hover:font-black"
              >
                {char}
              </span>
            ))}
          </h1>

          {/* Supporting line */}
          <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-gray-500 md:text-base">
            One-to-one lessons with Madam Razia. Pick-up, training in your area, then drop home.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onBookNow}
              className="
                inline-flex
                h-11
                items-center
                justify-center
                rounded-full
                bg-gradient-to-r
                from-[#FF3131]
                to-[#FF6201]
                px-6
                text-sm
                font-bold
                text-white
                shadow-md
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
                h-11
                items-center
                justify-center
                rounded-full
                bg-[#25D366]
                px-6
                text-sm
                font-bold
                text-white
                shadow-md
                transition-transform
                duration-200
                hover:-translate-y-0.5
              "
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
