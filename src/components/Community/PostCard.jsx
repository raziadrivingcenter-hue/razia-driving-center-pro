/* ------------------------------------------------------------------ */
/*  PostCard — single community post with comments, likes, poll,      */
/*  report, and edit/delete for the owner.                            */
/* ------------------------------------------------------------------ */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
  X,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import ConfirmDialog from "./ConfirmDialog";

/* ── Relative time (Asia/Karachi) ───────────────────────────────── */
function relativeTime(iso) {
  const KHI = "Asia/Karachi";
  const then = new Date(iso);
  const now = new Date();
  const diff = now - then;

  if (diff < 60_000) return "Just now";

  if (diff < 3_600_000) return Math.floor(diff / 60_000) + "m ago";

  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h ago";

  const timeStr = then.toLocaleTimeString("en-US", {
    timeZone: KHI,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const thenDate = then.toLocaleDateString("en-CA", { timeZone: KHI });
  const yesterdayDate = new Date(now - 86_400_000).toLocaleDateString("en-CA", {
    timeZone: KHI,
  });

  if (thenDate === yesterdayDate) return "Yesterday, " + timeStr;

  const dateStr = then.toLocaleDateString("en-GB", {
    timeZone: KHI,
    day: "numeric",
    month: "short",
  });
  return dateStr + ", " + timeStr;
}

export default function PostCard({
  post,
  user,
  onLike,
  onDelete,
  requireAuth,
  onUpdate,
}) {
  const isOwner = user && post.user_id === user.id;

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  /* Real Supabase error message for this card */
  const [cardError, setCardError] = useState("");

  /* ── Load comments ─────────────────────────────────────────────── */
  const loadComments = useCallback(async () => {
    if (commentsLoaded) return;
    const { data } = await supabase
      .from("comments")
      .select(
        `id, text, created_at, user_id,
         profiles ( name, avatar_url )`
      )
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setCommentsLoaded(true);
  }, [post.id, commentsLoaded]);

  const toggleComments = async () => {
    if (!showComments) await loadComments();
    setShowComments(!showComments);
  };

  /* ── Format a Supabase error for display ──────────────────────── */
  function fmtErr(err) {
    return (err.message || "Something went wrong.") +
      (err.code ? " (" + err.code + ")" : "");
  }

  /* ── Submit comment ────────────────────────────────────────────── */
  const submitComment = async () => {
    if (!commentText.trim()) return;
    if (!requireAuth()) return;
    setSubmittingComment(true);
    setCardError("");
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: user.id, text: commentText.trim() })
      .select(
        `id, text, created_at, user_id,
         profiles ( name, avatar_url )`
      )
      .single();
    if (error) {
      setCardError(fmtErr(error));
    } else if (data) {
      setComments((prev) => [...prev, data]);
      setCommentText("");
    }
    setSubmittingComment(false);
  };

  /* ── Delete comment ────────────────────────────────────────────── */
  const [dialogComment, setDialogComment] = useState(null);

  const requestDeleteComment = (comment) => {
    setDialogComment(comment);
  };

  const confirmDeleteComment = async () => {
    const comment = dialogComment;
    if (!comment) return;
    setDialogComment(null);
    setCardError("");
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment.id);
    if (error) {
      setCardError(fmtErr(error));
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    onUpdate();
  };

  /* ── Poll vote ─────────────────────────────────────────────────── */
  const vote = async (optionId) => {
    if (!requireAuth()) return;
    if (post.poll.myVote) return;
    setCardError("");
    const { error } = await supabase
      .from("poll_votes")
      .insert({ poll_id: post.poll.id, option_id: optionId, user_id: user.id });
    if (error) {
      setCardError(fmtErr(error));
      return;
    }
    const updated = { ...post.poll };
    updated.optionCounts[optionId] = (updated.optionCounts[optionId] || 0) + 1;
    updated.totalVotes = (updated.totalVotes || 0) + 1;
    updated.myVote = optionId;
    onUpdate();
  };

  /* ── Report ────────────────────────────────────────────────────── */
  const submitReport = async () => {
    if (!reportReason.trim()) return;
    if (!requireAuth()) return;
    setCardError("");
    const { error } = await supabase
      .from("reports")
      .insert({ post_id: post.id, reporter_id: user.id, reason: reportReason.trim() });
    if (error) {
      setCardError(fmtErr(error));
      return;
    }
    setReportSent(true);
    setShowReport(false);
  };

  const author = post.profiles || {};

  return (
    <>
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.name}
              className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-100"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-[#FF6201]">
              {(author.name || "?").charAt(0)}
            </div>
          )}
          <div>
            <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
              {author.name || "Learner"}
              <BadgeCheck size={13} className="text-blue-500" />
            </p>
            <p className="text-xs text-gray-400">
              {relativeTime(post.created_at)}
            </p>
          </div>
        </div>

        {/* Owner actions + report */}
        <div className="flex items-center gap-1">
          {isOwner && (
            <button
              onClick={onDelete}
              title="Delete post"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => {
                if (requireAuth()) setShowReport(true);
              }}
              title="Report"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <Flag size={16} />
            </button>
            {showReport && (
              <ReportPopover
                reason={reportReason}
                setReason={setReportReason}
                onSubmit={submitReport}
                onCancel={() => setShowReport(false)}
                sent={reportSent}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="px-5 pb-3 pt-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {post.text}
        </p>
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="mt-3 max-h-80 w-full rounded-xl object-cover"
          />
        )}
      </div>

      {/* ── Card-level error ────────────────────────────────────── */}
      {cardError && (
        <div className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {cardError}
        </div>
      )}

      {/* ── Poll ────────────────────────────────────────────────── */}
      {post.poll && (
        <div className="mx-5 mb-3 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-800">
            {post.poll.question}
          </p>
          <div className="mt-3 space-y-2">
            {post.poll.poll_options.map((opt) => {
              const count = post.poll.optionCounts[opt.id] || 0;
              const pct =
                post.poll.totalVotes > 0
                  ? Math.round((count / post.poll.totalVotes) * 100)
                  : 0;
              const isMine = post.poll.myVote === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => vote(opt.id)}
                  disabled={!!post.poll.myVote}
                  className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    isMine
                      ? "border-[#FF6201] text-[#FF6201]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  } ${post.poll.myVote ? "cursor-default" : "cursor-pointer"}`}
                >
                  {post.poll.myVote && (
                    <div
                      className="absolute inset-y-0 left-0 bg-orange-100"
                      style={{ width: pct + "%" }}
                    />
                  )}
                  <span className="relative flex items-center justify-between">
                    <span>{opt.option_text}</span>
                    {post.poll.myVote && (
                      <span className="font-semibold">
                        {count} ({pct}%)
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {post.poll.myVote && (
            <p className="mt-2 text-xs text-gray-400">
              {post.poll.totalVotes} vote{post.poll.totalVotes === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      {/* ── Actions bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-3">
        <button
          onClick={onLike}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            post.likedByMe
              ? "text-red-500"
              : "text-gray-500 hover:text-red-500"
          }`}
        >
          <Heart
            size={16}
            className={post.likedByMe ? "fill-red-500" : ""}
          />
          {post.likeCount}
        </button>
        <button
          onClick={toggleComments}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-[#FF6201]"
        >
          <MessageCircle size={16} />
          {post.commentCount}
          {showComments ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )}
        </button>
      </div>

      {/* ── Comments ────────────────────────────────────────────── */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          {/* Comment list */}
          <div className="space-y-3">
            {comments.length === 0 && (
              <p className="text-xs text-gray-400">No comments yet.</p>
            )}
            {comments.map((c) => {
              const cIsOwner = user && c.user_id === user.id;
              const cAuthor = c.profiles || {};
              return (
                <div key={c.id} className="flex gap-2.5">
                  {cAuthor.avatar_url ? (
                    <img
                      src={cAuthor.avatar_url}
                      alt={cAuthor.name}
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[10px] font-bold text-[#FF6201]">
                      {(cAuthor.name || "?").charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-800">
                        {cAuthor.name || "Learner"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {relativeTime(c.created_at)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">
                      {c.text}
                    </p>
                  </div>
                  {cIsOwner && (
                    <button
                      onClick={() => requestDeleteComment(c)}
                      className="self-start rounded p-1 text-gray-300 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comment input */}
          <div className="mt-3 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitComment();
              }}
              placeholder={
                user ? "Write a comment..." : "Sign in to comment"
              }
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#FF6201] focus:ring-2 focus:ring-orange-100"
            />
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || submittingComment}
              className="rounded-lg bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-3 py-2 text-white shadow-sm transition-opacity disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

    </article>

      {/* ── Delete comment dialog ───────────────────────────────── */}
      <ConfirmDialog
        open={!!dialogComment}
        message="Delete this comment?"
        onCancel={() => setDialogComment(null)}
        onConfirm={confirmDeleteComment}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Report popover
   ═══════════════════════════════════════════════════════════════════ */
function ReportPopover({ reason, setReason, onSubmit, onCancel, sent }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-8 z-10 w-56 rounded-xl bg-white p-3 shadow-lg ring-1 ring-gray-100"
    >
      {sent ? (
        <p className="text-xs font-semibold text-green-600">
          Reported. Thank you.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-gray-700">
            Report post
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason..."
            className="mb-2 h-16 w-full resize-none rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-[#FF6201]"
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={onCancel}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!reason.trim()}
              className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
