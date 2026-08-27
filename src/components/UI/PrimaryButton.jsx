import { ArrowRight } from "lucide-react";

function PrimaryButton({
  children,
  onClick,
  href,
  type = "button",
  className = "",
  hideArrow = false,
}) {
  const buttonClasses = `
    group
    inline-flex
    items-center
    justify-center
    gap-2
    rounded-2xl
    bg-gradient-to-r
    from-[#FF3131]
    to-[#FF6201]
    px-8
    py-4
    font-semibold
    text-white
    shadow-lg
    shadow-orange-500/20
    transition-all
    duration-300
    hover:-translate-y-1
    hover:scale-105
    hover:shadow-2xl
    hover:shadow-orange-500/40
    active:scale-95
    ${className}
  `;

  const arrow = (
    <ArrowRight
      size={18}
      className="
        transition-transform
        duration-300
        group-hover:translate-x-1
      "
    />
  );

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        <span>{children}</span>

        {!hideArrow && arrow}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonClasses}
    >
      <span>{children}</span>

      {!hideArrow && arrow}
    </button>
  );
}

export default PrimaryButton;