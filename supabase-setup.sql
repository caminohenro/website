-- ============================================================================
-- CAMINO HENRO (カミノ遍路) — SUPABASE FORUM SETUP SCRIPT
-- Paste this entire file into the Supabase SQL Editor and click "Run".
-- ============================================================================

-- 1. Create the Forum Threads table
CREATE TABLE IF NOT EXISTS public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (
    category IN (
      'Philosophy & Sufficiency',
      'Osettai & Hospitality',
      'Community & Book Initiatives',
      'Notes for the Road'
    )
  ),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 160),
  author_name text NOT NULL CHECK (char_length(trim(author_name)) BETWEEN 1 AND 60),
  author_email text,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 5 AND 5000),
  is_pinned boolean NOT NULL DEFAULT false,
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create the Forum Replies table
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(trim(author_name)) BETWEEN 1 AND 60),
  author_email text,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 2 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create performance indexes for sorting and thread lookups
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned_created
  ON public.forum_threads (is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_created
  ON public.forum_replies (thread_id, created_at ASC);

-- 4. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- 5. Create public read/insert policies for anonymous visitors (no login wall)
DROP POLICY IF EXISTS "Allow anon select on forum_threads" ON public.forum_threads;
CREATE POLICY "Allow anon select on forum_threads"
  ON public.forum_threads
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert on forum_threads" ON public.forum_threads;
CREATE POLICY "Allow anon insert on forum_threads"
  ON public.forum_threads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(title)) BETWEEN 3 AND 160
    AND char_length(trim(author_name)) BETWEEN 1 AND 60
    AND char_length(trim(body)) BETWEEN 5 AND 5000
  );

DROP POLICY IF EXISTS "Allow anon select on forum_replies" ON public.forum_replies;
CREATE POLICY "Allow anon select on forum_replies"
  ON public.forum_replies
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert on forum_replies" ON public.forum_replies;
CREATE POLICY "Allow anon insert on forum_replies"
  ON public.forum_replies
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(author_name)) BETWEEN 1 AND 60
    AND char_length(trim(body)) BETWEEN 2 AND 3000
  );

-- 6. Create PostgreSQL Trigger to automatically maintain reply_count
CREATE OR REPLACE FUNCTION public.update_forum_thread_reply_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_threads
    SET reply_count = reply_count + 1
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_threads
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_forum_reply_count ON public.forum_replies;
CREATE TRIGGER trg_increment_forum_reply_count
  AFTER INSERT OR DELETE ON public.forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_thread_reply_count();

-- 7. Seed 3 thoughtful starter discussion threads (idempotent via fixed UUIDs)
INSERT INTO public.forum_threads (
  id,
  category,
  title,
  author_name,
  author_email,
  body,
  is_pinned,
  reply_count,
  created_at
) VALUES
(
  '11111111-1111-4111-8111-111111111101',
  'Philosophy & Sufficiency',
  'On Sufficiency vs. Surplus: What Does It Require to Feel Secure?',
  'Henro (Pilgrim)',
  NULL,
  'Where do we draw the boundary between what is genuinely required to feel safe in the world and what we accumulate merely out of habit or fear?

Walking eastward from the Atlantic cliffs with only what fits inside a small pack strips the question down to bone and breath: water, bread, dry shelter at nightfall, and the quiet trust that human society is not separate from Nature, but one of its living expressions.

Have you experienced a moment in your own life when carrying or owning less unexpectedly deepened your sense of material security? Share your reflections below.',
  true,
  1,
  now() - interval '3 days'
),
(
  '11111111-1111-4111-8111-111111111102',
  'Osettai & Hospitality',
  'Traditions of Hospitality: Bridging Osettai (お接待) and Donativo',
  'Henro (Pilgrim)',
  NULL,
  'Both the European Camino de Santiago and the Shikoku Henro pilgrimage rest upon an ancient economy of trust. In Spain, hospitaleros welcome foot-weary strangers under the spirit of donativo; in Shikoku, locals offer green tea, citrus, or lodging as Osettai (お接待)—freely given alms offered in good faith so that giver and walker travel forward together in spirit (Dōgyō Ninin / 同行二人).

How can we preserve and practice uncalculated hospitality inside a modern commercial world that prices every interaction? Have you encountered or offered Osettai in unexpected places?',
  true,
  0,
  now() - interval '2 days'
),
(
  '11111111-1111-4111-8111-111111111103',
  'Community & Book Initiatives',
  'Deliberating Future Works & Community Initiatives for the Archive',
  'Henro (Pilgrim)',
  NULL,
  'While daily subsistence on the trail comes solely from the road itself, Osettai contributions made through this digital scroll are dedicated to sustaining the archive, preparing a future printed edition of these philosophical dispatches, and supporting community-aligned initiatives.

As this courtyard grows, how would you like to see our shared platform evolve? Are there specific philosophical inquiries, translations, or physical book formats you feel we should prioritize when the time comes?',
  true,
  0,
  now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- Seed 1 welcome reply on the first starter thread
INSERT INTO public.forum_replies (
  id,
  thread_id,
  author_name,
  author_email,
  body,
  created_at
) VALUES (
  '22222222-2222-4222-8222-222222222201',
  '11111111-1111-4111-8111-111111111101',
  'Mateo (Galicia)',
  NULL,
  'Buen Camino from Finisterra. For me, the realization came during a winter storm in O Cebreiro: security was never the weight of my wallet, but the warmth of a shared stove and a stranger handing over a bowl of caldo gallego without asking my name.',
  now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;
