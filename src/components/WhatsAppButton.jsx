import { MessageCircle } from "lucide-react";

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/923094461407"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="group flex items-center gap-3 rounded-full bg-green-500 px-5 py-4 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-green-600">

        <MessageCircle
          size={28}
          className="transition group-hover:rotate-12"
        />

        <span className="hidden font-bold md:block">
          WhatsApp
        </span>

      </div>
    </a>
  );
}

export default WhatsAppButton;