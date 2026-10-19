/* ------------------------------------------------------------------ */
/*  ConfirmDialog — small centered modal for destructive actions     */
/*  (delete post / delete comment). Replaces window.confirm.           */
/*  Escape or clicking the overlay counts as Cancel.                  */
/* ------------------------------------------------------------------ */
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmDialog({ open, message, onCancel, onConfirm }) {
  /* Escape = cancel */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-xl"
          >
            <p className="text-center text-sm font-medium text-gray-800">
              {message}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
