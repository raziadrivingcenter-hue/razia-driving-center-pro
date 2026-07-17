import FooterBrand from "./Footer/FooterBrand";
import FooterLinks from "./Footer/FooterLinks";
import FooterBottom from "./Footer/FooterBottom";

function Footer() {
  return (
    <footer
      className="
        relative
        overflow-hidden
        bg-[#111827]
        text-white
      "
    >
      {/* Background Glow */}

      <div
        className="
          absolute
          -left-32
          top-20
          h-80
          w-80
          rounded-full
          bg-[#FF6201]
          opacity-10
          blur-[120px]
        "
      />

      <div
        className="
          absolute
          -right-32
          bottom-10
          h-96
          w-96
          rounded-full
          bg-[#FF3131]
          opacity-10
          blur-[120px]
        "
      />

      {/* Main Content */}

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-7xl
          px-6
          py-24
        "
      >

        <div
          className="
            grid
            gap-20
            lg:grid-cols-[1.2fr_2fr]
          "
        >

          <FooterBrand />

          <FooterLinks />

        </div>

        <FooterBottom />

      </div>

    </footer>
  );
}

export default Footer;