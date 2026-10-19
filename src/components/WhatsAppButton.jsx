import { MessageCircle } from "lucide-react";

function WhatsAppButton({ hidden = false }) {
  if (hidden) return null;

  return (
    <a
      href="https://wa.me/923094461407"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Razia Driving Center on WhatsApp"
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="group flex items-center gap-2 rounded-full bg-green-500 px-4 py-2.5 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-green-600">

        <MessageCircle
          size={20}
          className="transition group-hover:rotate-12"
        />

        <span className="hidden font-semibold text-sm md:block">
          WhatsApp
        </span>

      </div>
    </a>
  );
}

export default WhatsAppButton;
