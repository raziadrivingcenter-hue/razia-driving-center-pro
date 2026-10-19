import FooterBrand from "./Footer/FooterBrand";
import FooterLinks from "./Footer/FooterLinks";
import FooterBottom from "./Footer/FooterBottom";

function Footer() {
  return (
    <footer
      className="
        relative
        overflow-hidden
        bg-gray-900
        text-white
      "
    >
      {/* Main Content */}

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-6xl
          px-6
          py-10
        "
      >

        <div
          className="
            grid
            gap-10
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