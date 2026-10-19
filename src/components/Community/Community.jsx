/* ------------------------------------------------------------------ */
/*  Community — Driving Learners Community page                       */
/*  Google login via existing Supabase client. Anyone can read; only  */
/*  signed-in users can post, like, comment, or vote.                 */
/* ------------------------------------------------------------------ */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  ImagePlus,
  BarChart3,
  X,
  LogOut,
  Loader2,
  PenSquare,
  BadgeCheck,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { useRouter } from "../../router";
import { useMeta } from "../../useMeta";
import ScrollProgress from "../ScrollProgress";
import Navbar from "../Navbar";
import Footer from "../Footer";
import WhatsAppButton from "../WhatsAppButton";
import PostCard from "./PostCard";
import ConfirmDialog from "./ConfirmDialog";

const PAGE_SIZE = 20;

/* ── Ensure a profile row exists for the current user ────────────── */
async function ensureProfile(user) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (data) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner",
    avatar_url: user.user_metadata?.avatar_url || null,
  });
}

/* ── Fetch posts with counts + user state ────────────────────────── */
async function fetchPosts(currentUser, setPosts, setLoadingPosts) {
  setLoadingPosts(true);
  const { data, error } = await supabase
    .from("posts")
    .select(
      `id, text, image_url, created_at, user_id,
       profiles ( name, avatar_url )`
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) {
    setPosts([]);
    setLoadingPosts(false);
    return;
  }

  const postIds = data.map((p) => p.id);

  const { data: likes } = await supabase
    .from("likes")
    .select("post_id, user_id")
    .in("post_id", postIds);

  const { data: comments } = await supabase
    .from("comments")
    .select("post_id")
    .in("post_id", postIds);

  const { data: polls } = await supabase
    .from("polls")
    .select(
      `id, post_id, question,
       poll_options ( id, option_text, option_index )`
    )
    .in("post_id", postIds);

  let pollVotes = [];
  if (polls && polls.length) {
    const pollIds = polls.map((p) => p.id);
    const { data: pv } = await supabase
      .from("poll_votes")
      .select("poll_id, option_id, user_id")
      .in("poll_id", pollIds);
    pollVotes = pv || [];
  }

  const likeCount = {};
  const likedByMe = new Set();
  (likes || []).forEach((l) => {
    likeCount[l.post_id] = (likeCount[l.post_id] || 0) + 1;
    if (currentUser && l.user_id === currentUser.id) likedByMe.add(l.post_id);
  });

  const commentCount = {};
  (comments || []).forEach((c) => {
    commentCount[c.post_id] = (commentCount[c.post_id] || 0) + 1;
  });

  const pollMap = {};
  (polls || []).forEach((p) => {
    const counts = {};
    let total = 0;
    let myVote = null;
    (p.poll_options || []).forEach((o) => (counts[o.id] = 0));
    pollVotes.forEach((v) => {
      if (v.poll_id === p.id) {
        counts[v.option_id] = (counts[v.option_id] || 0) + 1;
        total++;
        if (currentUser && v.user_id === currentUser.id) myVote = v.option_id;
      }
    });
    pollMap[p.post_id] = {
      ...p,
      optionCounts: counts,
      totalVotes: total,
      myVote,
    };
  });

  setPosts(
    data.map((p) => ({
      ...p,
      likeCount: likeCount[p.id] || 0,
      likedByMe: likedByMe.has(p.id),
      commentCount: commentCount[p.id] || 0,
      poll: pollMap[p.id] || null,
    }))
  );
  setLoadingPosts(false);
}

export default function Community() {
  const { navigate } = useRouter();
  useMeta({
    title: "Community | Razia Driving Center — Driving School in Lahore",
    description:
      "Join the Driving Learners Community at Razia Driving Center. Share driving tips, ask questions, and connect with fellow learners in Lahore.",
    canonical: "https://raziadrivingcenter.com/community/",
  });

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [showCreate, setShowCreate] = useState(false);

  const [pageError, setPageError] = useState("");

  const [dialogPost, setDialogPost] = useState(null);

  const loadPosts = useCallback(
    () => fetchPosts(user, setPosts, setLoadingPosts),
    [user]
  );

  /* ── Auth state ───────────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!mounted) return;
      setUser(u);
      if (u) {
        await ensureProfile(u);
        const { data: p } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("id", u.id)
          .maybeSingle();
        if (mounted) setProfile(p);
      }
      if (mounted) {
        setLoadingAuth(false);
        fetchPosts(u, setPosts, setLoadingPosts);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user || null;
        setUser(u);
        if (u) {
          await ensureProfile(u);
          const { data: p } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .eq("id", u.id)
            .maybeSingle();
          setProfile(p);
        } else {
          setProfile(null);
        }
        fetchPosts(u, setPosts, setLoadingPosts);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ── Google sign-in ────────────────────────────────────────────── */
  const signIn = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/community" },
    });
  }, []);

  /* ── Sign out ──────────────────────────────────────────────────── */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  /* ── Prompt auth helper (used by child actions) ────────────────── */
  const requireAuth = useCallback(() => {
    if (user) return true;
    signIn();
    return false;
  }, [user, signIn]);

  /* ── Format a Supabase error for display ──────────────────────── */
  function fmtErr(err) {
    return (err.message || "Something went wrong.") +
      (err.code ? " (" + err.code + ")" : "");
  }

  /* ── Like toggle ───────────────────────────────────────────────── */
  const toggleLike = useCallback(
    async (post) => {
      if (!requireAuth()) return;
      setPageError("");
      if (post.likedByMe) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        if (error) {
          setPageError(fmtErr(error));
          return;
        }
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likedByMe: false, likeCount: p.likeCount - 1 }
              : p
          )
        );
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: post.id, user_id: user.id });
        if (error) {
          setPageError(fmtErr(error));
          return;
        }
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likedByMe: true, likeCount: p.likeCount + 1 }
              : p
          )
        );
      }
    },
    [user, requireAuth]
  );

  /* ── Post created callback ─────────────────────────────────────── */
  const onPostCreated = useCallback(() => {
    setShowCreate(false);
    loadPosts();
  }, [loadPosts]);

  /* ── Delete post ───────────────────────────────────────────────── */
  const requestDeletePost = useCallback((post) => {
    setDialogPost(post);
  }, []);

  const confirmDeletePost = useCallback(async () => {
    const post = dialogPost;
    if (!post) return;
    setDialogPost(null);
    setPageError("");
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);
    if (error) {
      setPageError(fmtErr(error));
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  }, [dialogPost]);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <>
      <ScrollProgress />
      <Navbar onBookNow={() => navigate("/slot-availability/")} />

      <main className="min-h-screen bg-white">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <span className="inline-block rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-[#FF6201]">
              Community
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
              Driving Learners Community
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-500">
              Share driving tips, ask questions, and connect with fellow
              learners at Razia Driving Center.
            </p>

            {/* Auth area */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {loadingAuth ? (
                <Loader2 className="animate-spin text-[#FF6201]" size={20} />
              ) : user && profile ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-4">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-[#FF6201]">
                        {profile.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-800">
                      {profile.name}
                    </span>
                    <BadgeCheck size={14} className="text-blue-500" />
                  </div>
                  <button
                    onClick={signOut}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <LogOut size={13} />
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={signIn}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          {/* Rules + new post button */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-gray-400">
              Post only lawful driving talk. No abuse, threats, hate, sexual
              content, scams, or private phone numbers.
            </p>
            <button
              onClick={() => {
                if (requireAuth()) setShowCreate(true);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PenSquare size={15} />
              New Post
            </button>
          </div>

          {/* Top-level error (like / delete failures) */}
          {pageError && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">
              {pageError}
            </div>
          )}

          {/* Posts list */}
          {loadingPosts ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-[#FF6201]" size={32} />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <MessageCircle size={40} className="mx-auto text-gray-300" />
              <p className="mt-4 text-sm text-gray-400">
                No posts yet. Be the first to share something!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  onLike={() => toggleLike(post)}
                  onDelete={() => requestDeletePost(post)}
                  requireAuth={requireAuth}
                  onUpdate={loadPosts}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <WhatsAppButton />

      {/* ── Create post modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CreatePostModal
            user={user}
            onClose={() => setShowCreate(false)}
            onCreated={onPostCreated}
          />
        )}
      </AnimatePresence>

      {/* ── Delete post dialog ─────────────────────────────────── */}
      <ConfirmDialog
        open={!!dialogPost}
        message="Delete this post?"
        onCancel={() => setDialogPost(null)}
        onConfirm={confirmDeletePost}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Create Post Modal
   ═══════════════════════════════════════════════════════════════════ */
function CreatePostModal({ user, onClose, onCreated }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [showPoll, setShowPoll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const canSubmit = text.trim().length > 0 && !submitting;

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Only JPG, PNG, or WebP photos are allowed.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const addOption = () => {
    if (pollOptions.length < 4) setPollOptions([...pollOptions, ""]);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      /* ── Upsert profile row first ─────────────────────────────── */
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Learner",
        avatar_url: user.user_metadata?.avatar_url || null,
      });
      if (profileErr) throw profileErr;

      /* ── Upload photo (if any) ───────────────────────────────── */
      let imageUrl = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = user.id + "/" + Date.now() + "." + ext;
        const { error: upErr } = await supabase.storage
          .from("community-images")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("community-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      /* ── Insert post ─────────────────────────────────────────── */
      const { data: post, error: postErr } = await supabase
        .from("posts")
        .insert({ user_id: user.id, text: text.trim(), image_url: imageUrl })
        .select("id")
        .single();
      if (postErr) throw postErr;

      /* ── Insert poll (if any) ────────────────────────────────── */
      if (showPoll && pollQuestion.trim()) {
        const valid = pollOptions.map((o) => o.trim()).filter(Boolean);
        if (valid.length >= 2) {
          const { data: poll, error: pollErr } = await supabase
            .from("polls")
            .insert({ post_id: post.id, question: pollQuestion.trim() })
            .select("id")
            .single();
          if (pollErr) throw pollErr;
          const { error: optErr } = await supabase.from("poll_options").insert(
            valid.map((t, i) => ({
              poll_id: poll.id,
              option_index: i,
              option_text: t,
            }))
          );
          if (optErr) throw optErr;
        }
      }

      onCreated();
    } catch (err) {
      /* Show the real Supabase error (message + code) */
      setError(
        (err.message || "Something went wrong.") +
          (err.code ? " (" + err.code + ")" : "")
      );
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-bold text-gray-900">Create Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Share your driving tips or ask a question..."
            className="min-h-[120px] w-full resize-none rounded-xl border border-gray-200 p-3 text-sm leading-relaxed text-gray-700 outline-none focus:border-[#FF6201] focus:ring-2 focus:ring-orange-100"
            autoFocus
          />
          <div className="mt-1 text-right text-xs text-gray-400">
            {text.length}/1000
          </div>

          {/* Photo preview */}
          {preview && (
            <div className="relative mt-3">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 w-full rounded-xl object-cover"
              />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Photo + poll buttons */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <ImagePlus size={15} />
              Add Photo
            </button>
            <button
              onClick={() => setShowPoll(!showPoll)}
              className={
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors " +
                (showPoll
                  ? "border-[#FF6201] bg-orange-50 text-[#FF6201]"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50")
              }
            >
              <BarChart3 size={15} />
              Poll
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Poll builder */}
          <AnimatePresence>
            {showPoll && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 rounded-xl border border-gray-200 p-3">
                  <input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll question..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6201]"
                  />
                  {pollOptions.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[i] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={"Option " + (i + 1)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6201]"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      onClick={addOption}
                      className="text-xs font-semibold text-[#FF6201]"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Post
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
