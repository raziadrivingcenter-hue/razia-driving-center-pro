function SectionTitle({
  badge,
  title,
  subtitle,
  center = true,
}) {
  return (
    <div className={center ? "text-center" : ""}>

      {badge && (
        <span
          className="
            inline-block
            rounded-full
            bg-orange-100
            px-4
            py-2
            text-sm
            font-semibold
            text-[#FF6201]
          "
        >
          {badge}
        </span>
      )}

      <h2
        className="
          mt-5
          text-4xl
          font-black
          leading-tight
          text-gray-900
          md:text-5xl
        "
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="
            mx-auto
            mt-5
            max-w-2xl
            text-lg
            leading-8
            text-gray-600
          "
        >
          {subtitle}
        </p>
      )}

    </div>
  );
}

export default SectionTitle;