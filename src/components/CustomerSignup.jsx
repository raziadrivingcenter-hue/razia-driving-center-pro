import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import googleLogo from "../assets/google-logo.png";
import { signInWithGoogle } from "../lib/auth";

/**
 * Sign-in modal — real Google OAuth via Supabase Auth.
 *
 * The single button redirects to Google, then back to /dashboard/ where the
 * session is established. No password, no personal-data collection on this
 * site. On success the page navigates away, so this modal just kicks off the
 * redirect (and surfaces errors if the redirect can't start).
 *
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function CustomerSignup({ open, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      // Redirects the whole page; onClose is a best-effort cleanup.
      await signInWithGoogle();
      onClose();
    } catch {
      setBusy(false);
      setError("Could not start Google sign-in. Please try again.");
    }
  };

  const handleBackdrop = () => {
    if (busy) return;
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="signup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onClick={handleBackdrop}
        >
          <motion.div
            key="signup-modal"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Sign in with Google"
          >
            {/* Close */}
            <button
              onClick={handleBackdrop}
              disabled={busy}
              aria-label="Close sign-in"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <img
                src={googleLogo}
                alt=""
                width="44"
                height="44"
                className="mb-3 h-11 w-11 rounded-full bg-gray-50 p-1.5 ring-1 ring-gray-100"
              />
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                Sign in to your dashboard
              </h2>
              <p className="mt-1.5 max-w-xs text-sm text-gray-500">
                Use your Google account to track your lessons, driven kilometres
                and progress — all in one place.
              </p>
            </div>

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              <img
                src={googleLogo}
                alt=""
                width="18"
                height="18"
                className="h-[18px] w-[18px]"
              />
              {busy ? "Redirecting…" : "Sign in with Google"}
            </button>

            {error && (
              <p className="mt-3 text-center text-xs font-medium text-red-500">
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-[11px] leading-4 text-gray-400">
              No password needed. You'll pick a Google account, then come right back.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
