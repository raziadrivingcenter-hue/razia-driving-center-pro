import {

  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Star,
} from "lucide-react";

function FooterBottom() {
  return (
    <>
      {/* Divider */}

      <div className="my-14 h-px w-full bg-white/10" />

      {/* Bottom Section */}

      <div className="flex flex-col items-center justify-between gap-10 lg:flex-row">

        {/* Google Badge */}

        <div
          className="
            flex
            items-center
            gap-5
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-6
            py-4
            backdrop-blur-md
          "
        >

          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-white
            "
          >
            <Star
              size={28}
              className="fill-yellow-400 text-yellow-400"
            />
          </div>

          <div>

            <h4 className="font-bold text-white">
              Google Reviews
            </h4>

            <p className="text-sm text-gray-400">
              ★★★★★ Rated 5.0 by Our Students
            </p>

          </div>

        </div>

        {/* Social Icons */}

        <div className="flex flex-wrap justify-center gap-4">

          <a
            href="#"
            className="
              rounded-2xl
              bg-white/5
              p-4
              text-gray-300
              transition-all
              duration-300
              hover:-translate-y-2
              hover:bg-[#FF6201]
              hover:text-white
            "
          >
            <MessageCircle size={18} />
          </a>

          <a
            href="https://instagram.com/raziadrivingcenter"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-2xl
              bg-white/5
              p-4
              text-gray-300
              transition-all
              duration-300
              hover:-translate-y-2
              hover:bg-[#FF6201]
              hover:text-white
            "
          >
            <MessageCircle size={18} />
          </a>

          <a
            href="#"
            className="
              rounded-2xl
              bg-white/5
              p-4
              text-gray-300
              transition-all
              duration-300
              hover:-translate-y-2
              hover:bg-[#FF6201]
              hover:text-white
            "
          >
            <MessageCircle size={18} />
          </a>

          <a
            href="https://maps.app.goo.gl/"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-2xl
              bg-white/5
              p-4
              text-gray-300
              transition-all
              duration-300
              hover:-translate-y-2
              hover:bg-[#FF6201]
              hover:text-white
            "
          >
            <MapPin size={22} />
          </a>

          <a
            href="https://wa.me/923094461407"
            target="_blank"
            rel="noreferrer"
            className="
              rounded-2xl
              bg-white/5
              p-4
              text-gray-300
              transition-all
              duration-300
              hover:-translate-y-2
              hover:bg-green-500
              hover:text-white
            "
          >
            <MessageCircle size={22} />
          </a>

        </div>

      </div>

      {/* Copyright */}

      <div className="mt-14 border-t border-white/10 pt-8">

        <div
          className="
            flex
            flex-col
            items-center
            justify-between
            gap-5
            text-center
            lg:flex-row
          "
        >

          <p className="text-gray-500">
            © 2026 Razia Driving Center. All Rights Reserved.
          </p>

          <p className="font-medium text-gray-400">
            Learn Today. Drive Forever.
          </p>

        </div>

      </div>

    </>
  );
}

export default FooterBottom;