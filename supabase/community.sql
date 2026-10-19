/* ------------------------------------------------------------------ */
/*  Driving Learners Community — schema + Row Level Security           */
/*  Run this in the Supabase SQL editor.                              */
/* ------------------------------------------------------------------ */

/* ── Profiles — one row per Google user, written on first login ──── */
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

/* ── Posts ───────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text          varchar(1000) NOT NULL,
  image_url     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

/* ── Comments ────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text          varchar(500) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

/* ── Likes — one per user per post ───────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.likes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

/* ── Polls (one poll per post) ───────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.polls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  question      text NOT NULL
);

/* ── Poll options ────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.poll_options (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id       uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_index  smallint NOT NULL,
  option_text   text NOT NULL
);

/* ── Poll votes — one per user per poll ──────────────────────────── */
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id       uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id     uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);

/* ── Reports ─────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

/* ── Storage bucket for community images (public read) ───────────── */
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

/* ═══════════════════════════════════════════════════════════════════
   Row Level Security
   ═══════════════════════════════════════════════════════════════════ */

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;

/* ── Profiles: anyone can read; owner can write their own ────────── */
CREATE POLICY "profiles_read"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

/* ── Posts: anyone can read; signed-in can insert; owner can edit/delete  */
CREATE POLICY "posts_read"     ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert"   ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update"   ON public.posts FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete"   ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

/* ── Comments: anyone can read; signed-in can insert; owner can edit/delete  */
CREATE POLICY "comments_read"     ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert"   ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update"   ON public.comments FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete"   ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

/* ── Likes: anyone can read; signed-in can insert/delete their own ─ */
CREATE POLICY "likes_read"     ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert"   ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete"   ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

/* ── Polls: anyone can read; signed-in can insert (via post owner trigger not needed; app enforces post_id)  */
CREATE POLICY "polls_read"     ON public.polls FOR SELECT USING (true);
CREATE POLICY "polls_insert"   ON public.polls FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );

/* ── Poll options: anyone can read; insert allowed if owns the poll's post  */
CREATE POLICY "poll_options_read"    ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "poll_options_insert"  ON public.poll_options FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.polls pl
      JOIN public.posts p ON p.id = pl.post_id
      WHERE pl.id = poll_id AND p.user_id = auth.uid()
    )
  );

/* ── Poll votes: anyone can read; signed-in can insert/delete their own  */
CREATE POLICY "poll_votes_read"     ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "poll_votes_insert"   ON public.poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "poll_votes_delete"   ON public.poll_votes FOR DELETE
  USING (auth.uid() = user_id);

/* ── Reports: anyone can read; signed-in can insert ──────────────── */
CREATE POLICY "reports_read"     ON public.reports FOR SELECT USING (true);
CREATE POLICY "reports_insert"   ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

/* ── Storage: public read on community-images; authenticated upload  */
CREATE POLICY "storage_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'community-images');
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-images' AND auth.role() = 'authenticated');
