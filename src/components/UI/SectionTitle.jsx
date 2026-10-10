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
            px-3
            py-1.5
            text-xs
            font-semibold
            text-[#FF6201]
          "
        >
          {badge}
        </span>
      )}

      <h2
        className="
          mt-3
          text-2xl
          font-black
          leading-[1.2]
          text-gray-900
          md:text-3xl
        "
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="
            mx-auto
            mt-2
            max-w-xl
            text-sm
            leading-[1.45]
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
