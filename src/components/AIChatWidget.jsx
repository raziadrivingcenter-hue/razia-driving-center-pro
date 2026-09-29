import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  LoaderCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Parse [BUTTONS:Option1|Option2] markers out of AI text             */
/*  Returns { cleanText, buttons }                                     */
/* ------------------------------------------------------------------ */

function parseMessage(text) {
  const buttonRegex = /\[BUTTONS:([^\]]+)\]/g;
  const buttons = [];
  let match;

  while ((match = buttonRegex.exec(text)) !== null) {
    match[1].split("|").forEach((opt) => buttons.push(opt.trim()));
  }

  // Replace markers with nothing (or a separator before the first one)
  const cleanText = text.replace(buttonRegex, "").trim();

  return { cleanText, buttons };
}

/* ------------------------------------------------------------------ */
/*  Typing indicator — three bouncing dots                             */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] text-white">
        <Bot size={16} />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[#FF6201]"
              style={{
                animation: `chatBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick-reply buttons (rendered below an AI message)                 */
/* ------------------------------------------------------------------ */

function QuickReplies({ buttons, onSelect, disabled }) {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="ml-10 mt-2 flex flex-wrap gap-2">
      {buttons.map((option, i) => (
        <button
          key={i}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="
            rounded-full
            border
            border-[#FF6201]/30
            bg-orange-50
            px-4
            py-2
            text-sm
            font-medium
            text-[#FF6201]
            transition-all
            duration-200
            hover:border-[#FF6201]
            hover:bg-[#FF6201]
            hover:text-white
            hover:shadow-md
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking success card                                               */
/* ------------------------------------------------------------------ */

function BookingSuccessCard({ bookingId, whatsappLink }) {
  return (
    <div className="ml-10 mt-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 size={28} className="text-green-600" />
      </div>

      <h4 className="font-bold text-green-800">
        Booking Confirmed! 🎉
      </h4>

      <p className="mt-1 text-sm text-green-700">
        Booking ID: <span className="font-mono font-bold">#{bookingId}</span>
      </p>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="
          mt-3
          inline-flex
          items-center
          gap-2
          rounded-full
          bg-green-600
          px-5
          py-2.5
          text-sm
          font-bold
          text-white
          shadow-lg
          transition-all
          hover:bg-green-700
          hover:shadow-xl
        "
      >
        Inform on WhatsApp
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single message bubble                                              */
/* ------------------------------------------------------------------ */

function ChatMessage({ message, onButtonSelect, disabled, bookingResult }) {
  const isUser = message.role === "user";
  const { cleanText, buttons } = !isUser ? parseMessage(message.content) : { cleanText: message.content, buttons: [] };

  // Detect if this message contains a booking summary (for styling)
  const isSummary = !isUser && cleanText.includes("Booking Summary");

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] text-white">
          <Bot size={16} />
        </div>
      )}

      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "rounded-br-sm bg-[#FF6201] text-white"
              : isSummary
                ? "rounded-bl-sm border border-orange-200 bg-orange-50 text-gray-800"
                : "rounded-bl-sm bg-gray-100 text-gray-800"
          }`}
        >
          {cleanText}
        </div>

        {/* Quick-reply buttons for AI messages */}
        {!isUser && (
          <QuickReplies
            buttons={buttons}
            onSelect={onButtonSelect}
            disabled={disabled}
          />
        )}

        {/* Booking success card */}
        {!isUser && bookingResult && (
          <BookingSuccessCard
            bookingId={bookingResult.bookingId}
            whatsappLink={bookingResult.whatsappLink}
          />
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500">
          <User size={16} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main widget                                                        */
/* ------------------------------------------------------------------ */

function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, bookingResult]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Send a message to the AI
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setBookingResult(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.reply) {
        // Check if the AI confirmed a booking (contains booking summary + confirm button was clicked)
        const replyText = data.reply;

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: replyText },
        ]);

        // If AI confirms booking was submitted, we don't need to do anything here
        // The booking submission happens via the handleButtonSelect path
      } else {
        throw new Error("Empty reply");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again or contact us on WhatsApp at 0309-4461407.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // Handle quick-reply button clicks
  const handleButtonSelect = useCallback(async (option) => {
    // If user clicks "Confirm Booking", submit the booking
    if (option.includes("Confirm Booking")) {
      setIsLoading(true);

      // Extract booking details from the conversation
      // We'll ask the user to provide details in a structured way
      // For now, collect from the last few messages
      const bookingData = extractBookingData(messages);

      try {
        const response = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setBookingResult({
            bookingId: data.bookingId,
            whatsappLink: data.whatsappLink,
          });
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `✅ Your booking has been confirmed successfully!\n\nBooking ID: #${data.bookingId}\n\nPlease click the button below to inform us on WhatsApp. Hum aap ko jaldi call karenge! 📞`,
            },
          ]);
        } else {
          throw new Error(data.error || "Booking failed");
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Booking submit nahi ho payi. Please try again ya WhatsApp karein: 0309-4461407",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For all other buttons, send the option as a user message
    await sendMessage(option);
  }, [messages, sendMessage]);

  // Regular send (input box)
  const handleSend = () => {
    sendMessage(input);
  };

  // Enter key to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating trigger button — bottom-left */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Assistant"
            className="
              fixed
              bottom-6
              left-6
              z-50
              flex
              items-center
              gap-3
              rounded-full
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              px-5
              py-4
              text-white
              shadow-2xl
              transition-all
              duration-300
              hover:scale-110
            "
          >
            <Sparkles
              size={24}
              className="transition animate-pulse"
            />
            <span className="hidden font-bold md:block">
              AI Assistant
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="
              fixed
              bottom-6
              left-6
              z-50
              flex
              h-[560px]
              w-[380px]
              max-h-[85vh]
              max-w-[calc(100vw-2rem)]
              flex-col
              overflow-hidden
              rounded-3xl
              border
              border-gray-200
              bg-white
              shadow-2xl
            "
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold leading-tight">
                    AI Assistant
                  </h3>
                  <p className="text-xs text-white/80">
                    Razia Driving Center
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-2 transition hover:bg-white/20"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 py-5">
              {/* Welcome message */}
              {messages.length === 0 && !isLoading && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] text-white">
                    <Bot size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">
                    Assalam-o-Alaikum! 👋
                  </h4>
                  <p className="mt-2 max-w-[280px] text-sm text-gray-500">
                    Main aap ki course info, pricing, aur booking mein help kar
                    sakta hoon. Kya scene hai? 🚗
                  </p>

                  {/* Quick-start buttons */}
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => sendMessage("I want to book a course")}
                      className="
                        rounded-full
                        border
                        border-[#FF6201]/30
                        bg-orange-50
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-[#FF6201]
                        transition-all
                        hover:bg-[#FF6201]
                        hover:text-white
                      "
                    >
                      📝 Book a Course
                    </button>
                    <button
                      onClick={() => sendMessage("Tell me about courses")}
                      className="
                        rounded-full
                        border
                        border-gray-200
                        bg-white
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-gray-600
                        transition-all
                        hover:border-[#FF6201]
                        hover:text-[#FF6201]
                      "
                    >
                      📚 Course Info
                    </button>
                    <button
                      onClick={() => sendMessage("What are the prices?")}
                      className="
                        rounded-full
                        border
                        border-gray-200
                        bg-white
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-gray-600
                        transition-all
                        hover:border-[#FF6201]
                        hover:text-[#FF6201]
                      "
                    >
                      💰 Pricing
                    </button>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  message={msg}
                  onButtonSelect={handleButtonSelect}
                  disabled={isLoading}
                  bookingResult={
                    i === messages.length - 1 && bookingResult && msg.role === "assistant"
                      ? bookingResult
                      : null
                  }
                />
              ))}

              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-gray-200 bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="
                    flex-1
                    resize-none
                    rounded-2xl
                    border
                    border-gray-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-[#FF6201]
                    focus:ring-2
                    focus:ring-orange-100
                  "
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-[#FF3131]
                    to-[#FF6201]
                    text-white
                    shadow-lg
                    transition-all
                    duration-300
                    hover:scale-105
                    hover:shadow-xl
                    disabled:opacity-40
                    disabled:hover:scale-100
                  "
                >
                  {isLoading ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>

              <p className="mt-2 text-center text-[10px] text-gray-400">
                Powered by Razia Driving Center · info may not always be perfect
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframe animation for the typing dots */}
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Course pricing configuration (single source of truth)              */
/* ------------------------------------------------------------------ */

const COURSE_PRICING = {
  "Basic Plan": { fee: 9999, days: 7 },
  "PLUS Plan": { fee: 14500, days: 10 },
  "PRO+ Plan": { fee: 21750, days: 15 },
};

/* ------------------------------------------------------------------ */
/*  Calculate pick & drop charges using the same formula as the engine */
/*  Pick & Drop = Distance × 50 × Course Duration (days) × 2           */
/* ------------------------------------------------------------------ */

function calculatePickDropCharges(distanceKm, courseName) {
  const course = COURSE_PRICING[courseName];
  if (!course || !distanceKm) return 0;

  const dist = Math.min(parseFloat(distanceKm) || 0, 30); // clamp to 30 KM max
  return Math.round(dist * 50 * course.days * 2);
}

/* ------------------------------------------------------------------ */
/*  Extract booking data from conversation messages                    */
/* ------------------------------------------------------------------ */

function extractBookingData(messages) {
  const data = {
    name: "",
    phone: "",
    email: "",
    area: "",
    address: "",
    course: "",
    pickup: "",
    distance: "",
    preferred_date: "",
    time: "",
    notes: "",
    courseFee: 0,
    pickDropCharges: 0,
    totalPayable: 0,
  };

  const userTexts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim());

  // ---- Pass 1: Extract structured choices (course, pickup, time) ----

  for (const text of userTexts) {
    const lower = text.toLowerCase();

    // Course selection
    for (const [courseName, info] of Object.entries(COURSE_PRICING)) {
      if (lower.includes(courseName.toLowerCase())) {
        data.course = courseName;
        data.courseFee = info.fee;
        break;
      }
    }

    // Pick & Drop choice
    if (text === "Yes, I need Pick & Drop" || (lower.includes("yes") && lower.includes("pick"))) {
      data.pickup = "Yes";
    }
    if (text === "No, I'll come myself" || text === "No" || (lower === "no")) {
      data.pickup = "No";
    }

    // Time selection
    if (text.includes("Morning")) data.time = "Morning (8 AM - 12 PM)";
    if (text.includes("Afternoon")) data.time = "Afternoon (12 PM - 4 PM)";
    if (text.includes("Evening")) data.time = "Evening (4 PM - 8 PM)";

    // Distance — look for numbers followed by KM/unit or standalone numbers
    // when pick & drop context is active
    const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|KM|kms|kilometer)/);
    const standaloneNum = text.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
    if (kmMatch) {
      data.distance = kmMatch[1];
    } else if (standaloneNum && data.pickup === "Yes") {
      data.distance = standaloneNum[1];
    }
  }

  // ---- Pass 2: Heuristic extraction of name, phone, email, area, date, address, notes ----

  let foundName = false;
  let foundPhone = false;
  let foundEmail = false;

  for (let i = 0; i < userTexts.length; i++) {
    const text = userTexts[i];
    const lower = text.toLowerCase();

    // Skip already-identified structured choices
    if (
      text === "Yes, I need Pick & Drop" ||
      text === "No, I'll come myself" ||
      ["Morning", "Afternoon", "Evening"].some((t) => text.includes(t)) ||
      Object.keys(COURSE_PRICING).some((c) => lower.includes(c.toLowerCase())) ||
      text === "I want to book a course" ||
      text === "Tell me about courses" ||
      text === "What are the prices?"
    ) {
      continue;
    }

    // Skip pure numbers (distance)
    if (/^\s*\d+(?:\.\d+)?\s*(?:km|KM)?\s*$/.test(text)) continue;

    // Phone number (Pakistani format: 03XX-XXXXXXX or +92XXXXXXXXXX)
    if (!foundPhone) {
      const phoneMatch = text.match(/((?:\+92|0)?\d{10,13})/);
      if (phoneMatch) {
        const phone = phoneMatch[1];
        if (phone.length >= 10 && phone.length <= 13) {
          data.phone = phone.startsWith("0") ? phone : phone.replace("+92", "0");
          foundPhone = true;
          continue;
        }
      }
    }

    // Email
    if (!foundEmail) {
      const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.+-]+/);
      if (emailMatch) {
        data.email = emailMatch[0];
        foundEmail = true;
        continue;
      }
    }

    // Address / Landmark — longer text after distance question (5+ words, contains location keywords or house/street/block)
    if (
      data.pickup === "Yes" &&
      !data.address &&
      (lower.includes("house") ||
        lower.includes("street") ||
        lower.includes("block") ||
        lower.includes("road") ||
        lower.includes("near") ||
        lower.includes("landmark") ||
        lower.includes("gulberg") ||
        lower.includes("lahore") ||
        lower.includes("scheme") ||
        lower.includes("phase") ||
        text.split(/\s+/).length >= 4)
    ) {
      data.address = text;
      continue;
    }

    // Area / Location — medium text, before address
    if (
      !data.area &&
      !data.address &&
      text.split(/\s+/).length >= 2 &&
      text.split(/\s+/).length <= 6 &&
      !/\d/.test(text) &&
      !lower.includes("@") &&
      !lower.includes("skip") &&
      !lower.includes("confirm") &&
      !lower.includes("edit") &&
      !lower.includes("monday") &&
      !lower.includes("tuesday") &&
      !lower.includes("wednesday") &&
      !lower.includes("thursday") &&
      !lower.includes("friday") &&
      !lower.includes("saturday") &&
      !lower.includes("sunday") &&
      !lower.includes("september") &&
      !lower.includes("october") &&
      !lower.includes("november") &&
      !lower.includes("december") &&
      !lower.includes("january") &&
      !lower.includes("february") &&
      !lower.includes("march") &&
      !lower.includes("april") &&
      !lower.includes("may") &&
      !lower.includes("june") &&
      !lower.includes("july") &&
      !lower.includes("august") &&
      !lower.includes("next") &&
      !lower.includes("tomorrow")
    ) {
      data.area = text;
      continue;
    }

    // Preferred Date — contains day names, month names, "next", "tomorrow", "today", or date-like patterns
    if (
      !data.preferred_date &&
      (lower.includes("monday") ||
        lower.includes("tuesday") ||
        lower.includes("wednesday") ||
        lower.includes("thursday") ||
        lower.includes("friday") ||
        lower.includes("saturday") ||
        lower.includes("sunday") ||
        lower.includes("january") ||
        lower.includes("february") ||
        lower.includes("march") ||
        lower.includes("april") ||
        lower.includes("may") ||
        lower.includes("june") ||
        lower.includes("july") ||
        lower.includes("august") ||
        lower.includes("september") ||
        lower.includes("october") ||
        lower.includes("november") ||
        lower.includes("december") ||
        lower.includes("next") ||
        lower.includes("tomorrow") ||
        lower.includes("today") ||
        /\d{1,2}[/-]\d{1,2}/.test(text) ||
        /\d{1,2}(?:st|nd|rd|th)/.test(text))
    ) {
      data.preferred_date = text;
      continue;
    }

    // Name — first short text (2-4 words), no numbers, no @, not a keyword
    if (
      !foundName &&
      !text.includes("@") &&
      !/\d/.test(text) &&
      text.split(/\s+/).length >= 2 &&
      text.split(/\s+/).length <= 4 &&
      !lower.includes("skip") &&
      !lower.includes("confirm") &&
      !lower.includes("edit") &&
      !lower.includes("book") &&
      !lower.includes("course") &&
      !lower.includes("price") &&
      !lower.includes("yes") &&
      !lower.includes("no") &&
      !lower.includes("morning") &&
      !lower.includes("afternoon") &&
      !lower.includes("evening") &&
      !lower.includes("pick") &&
      !lower.includes("drop") &&
      !data.area &&  // don't reuse area as name
      !data.address  // don't reuse address as name
    ) {
      data.name = text;
      foundName = true;
      continue;
    }

    // Notes — longer free text at the end that wasn't captured as anything else
    if (
      text.split(/\s+/).length >= 3 &&
      !data.notes &&
      !text.includes("@") &&
      data.preferred_date // only capture notes after date has been set
    ) {
      data.notes = text;
    }
  }

  // ---- Calculate pricing using the formula ----

  if (data.pickup === "Yes" && data.distance && data.course) {
    data.pickDropCharges = calculatePickDropCharges(data.distance, data.course);
  }

  data.totalPayable = data.courseFee + data.pickDropCharges;

  return data;
}

export default AIChatWidget;
