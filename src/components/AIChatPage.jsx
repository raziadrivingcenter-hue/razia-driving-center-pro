import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  LoaderCircle,
  ArrowLeft,
  RotateCcw,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { useMeta } from "../useMeta";
import { useRouter } from "../router";
import Navbar from "./Navbar";
import WhatsAppButton from "./WhatsAppButton";
import ScrollProgress from "./ScrollProgress";

const CHAT_META = {
  title: "Chat With AI | Razia Driving Center",
  description:
    "Chat with RDC AI, the AI assistant for Razia Driving Center in Lahore. Get course info, pricing, and booking help instantly.",
  canonical: "https://raziadrivingcenter.com/chat/",
};

/* ------------------------------------------------------------------ */
/*  Parse [BUTTONS:Option1|Option2] markers                           */
/* ------------------------------------------------------------------ */

function parseMessage(text) {
  const buttonRegex = /\[BUTTONS:([^\]]+)\]/g;
  const buttons = [];
  let match;
  while ((match = buttonRegex.exec(text)) !== null) {
    match[1].split("|").forEach((opt) => buttons.push(opt.trim()));
  }
  const cleanText = text.replace(buttonRegex, "").trim();
  return { cleanText, buttons };
}

/* ------------------------------------------------------------------ */
/*  Lightweight markdown renderer                                      */
/* ------------------------------------------------------------------ */

function renderMarkdown(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    else if (match[4]) parts.push(
      <code key={match.index} className="rounded bg-black/5 px-1.5 py-0.5 text-xs font-mono text-[#FF6201]">{match[4]}</code>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  if (parts.length === 0) return text;

  const result = [];
  parts.forEach((part, i) => {
    if (typeof part === "string") {
      const lines = part.split("\n");
      lines.forEach((line, j) => {
        result.push(line);
        if (j < lines.length - 1) result.push(<br key={`br-${i}-${j}`} />);
      });
    } else {
      result.push(part);
    }
  });
  return result;
}

/* ------------------------------------------------------------------ */
/*  Typing indicator                                                   */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-end gap-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF3131] to-[#FF6201] shadow-lg shadow-orange-200/50">
        <Bot size={15} className="text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-white px-5 py-3.5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[#FF6201]"
              style={{ animation: `chatBounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick-reply buttons                                                */
/* ------------------------------------------------------------------ */

function QuickReplies({ buttons, onSelect, disabled }) {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="ml-11 mt-2.5 flex flex-wrap gap-2">
      {buttons.map((option, i) => {
        const isSlotLink = option.includes("Go to Slot Availability Page");
        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(option)}
            disabled={disabled}
            className={`
              rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
              disabled:cursor-not-allowed disabled:opacity-50
              ${isSlotLink
                ? "bg-gradient-to-r from-[#FF3131] to-[#FF6201] text-white shadow-md shadow-orange-200/40 hover:shadow-lg hover:shadow-orange-200/60"
                : "border border-gray-200 bg-white text-gray-700 hover:border-[#FF6201] hover:bg-orange-50 hover:text-[#FF6201]"
              }
            `}
          >
            {option}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single message bubble                                              */
/* ------------------------------------------------------------------ */

function ChatMessage({ message, onButtonSelect, disabled, index }) {
  const isUser = message.role === "user";
  const { cleanText, buttons } = !isUser ? parseMessage(message.content) : { cleanText: message.content, buttons: [] };
  const isSummary = !isUser && cleanText.includes("Booking Summary");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 shadow-md">
            <User size={15} className="text-white" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF3131] to-[#FF6201] shadow-lg shadow-orange-200/50">
            <Bot size={15} className="text-white" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`
            rounded-2xl px-4 py-3 text-[14px] leading-[1.7]
            ${isUser
              ? "rounded-br-md bg-gray-900 text-white"
              : isSummary
                ? "rounded-bl-md border border-orange-100 bg-gradient-to-br from-orange-50/80 to-amber-50/50 text-gray-800"
                : "rounded-bl-md bg-white text-gray-800 shadow-sm ring-1 ring-gray-100/80"
            }
          `}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{cleanText}</span>
          ) : (
            <span className="whitespace-pre-wrap">{renderMarkdown(cleanText)}</span>
          )}
        </div>
        {!isUser && buttons.length > 0 && (
          <QuickReplies buttons={buttons} onSelect={onButtonSelect} disabled={disabled} />
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature card (welcome screen)                                      */
/* ------------------------------------------------------------------ */

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-gray-100 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md hover:ring-gray-200">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF3131]/10 to-[#FF6201]/10">
        <Icon size={17} className="text-[#FF6201]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{description}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

function AIChatPage() {
  useMeta(CHAT_META);
  const { navigate } = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages.map((m) => ({ role: m.role, content: m.content })), userMessage] }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        throw new Error("Empty reply");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again or contact us on WhatsApp at +92 309 4461407." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleButtonSelect = (option) => {
    if (option.includes("Go to Slot Availability Page")) {
      navigate("/slot-availability/");
      return;
    }
    sendMessage(option);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
  };

  const quickStarts = [
    { emoji: "📝", label: "Book a Course", msg: "I want to book a course" },
    { emoji: "🕐", label: "Available Slots", msg: "Show me available slots" },
    { emoji: "📚", label: "Course Info", msg: "Tell me about courses" },
    { emoji: "💰", label: "Pricing", msg: "What are the prices?" },
  ];

  return (
    <>
      <ScrollProgress />
      <Navbar onBookNow={() => navigate("/slot-availability/")} />

      {/* ── Full-height chat shell ── */}
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-20">

        {/* ── Header bar ── */}
        <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF3131] to-[#FF6201] shadow-lg shadow-orange-200/50">
                  <Bot size={22} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">RDC AI</h1>
                <p className="flex items-center gap-1 text-xs text-green-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  Online — Ready to help
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title="New conversation"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => navigate("/")}
                title="Back to home"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">

            <AnimatePresence mode="wait">
              {messages.length === 0 && !isLoading && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="flex min-h-[60vh] flex-col items-center justify-center text-center"
                >
                  {/* Hero glow */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF3131]/20 to-[#FF6201]/20 blur-2xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF3131] to-[#FF6201] shadow-2xl shadow-orange-200/60">
                      <Sparkles size={36} className="text-white" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                    Assalam-o-Alaikum! 👋
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-gray-500">
                    I'm <span className="font-semibold text-[#FF6201]">RDC AI</span> — your smart assistant for courses, pricing, slots, and booking help.
                  </p>

                  {/* Feature cards */}
                  <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
                    <FeatureCard icon={Zap} title="Instant Answers" description="Courses, pricing & Pick & Drop info" />
                    <FeatureCard icon={Clock} title="Check Slots" description="See available time slots live" />
                    <FeatureCard icon={Shield} title="Easy Booking" description="Guided step-by-step booking" />
                  </div>

                  {/* Quick-start pills */}
                  <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                    {quickStarts.map((qs) => (
                      <motion.button
                        key={qs.label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => sendMessage(qs.msg)}
                        className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-[#FF6201]/30 hover:bg-orange-50 hover:text-[#FF6201] hover:shadow-md"
                      >
                        {qs.emoji} {qs.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message list */}
            <div className="space-y-5">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  message={msg}
                  onButtonSelect={handleButtonSelect}
                  disabled={isLoading}
                  index={i}
                />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input bar (sticky bottom) ── */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-white/80 backdrop-blur-md">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
            <div className="flex items-end gap-3">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#FF6201]/40 focus:bg-white focus:shadow-lg focus:shadow-orange-100/30 focus:ring-4 focus:ring-[#FF6201]/10"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
              >
                {isLoading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </motion.button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">
              Powered by Razia Driving Center · AI responses may not always be perfect
            </p>
          </div>
        </div>
      </div>

      <WhatsAppButton />

      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default AIChatPage;
