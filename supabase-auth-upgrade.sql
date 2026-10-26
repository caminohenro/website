-- ============================================================================
-- CAMINO HENRO (カミノ遍路) — STEP 8A: FORUM ANTI-IMPERSONATION & ALIAS AUTH
-- ============================================================================
-- IMPORTANT: BEFORE CLICKING "RUN" IN THE SUPABASE SQL EDITOR:
-- Edit the two values inside Step 5 below ('CHANGE_THIS_HENRO_PASSCODE' and
-- 'henro@caminohenro.blog') to set your real secret passcode and email!
-- ============================================================================

-- 1. Enable the pgcrypto extension for blowfish (bcrypt) password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the private forum_users table
CREATE TABLE IF NOT EXISTS public.forum_users (
  alias_key text PRIMARY KEY CHECK (alias_key = lower(trim(alias_key))),
  display_name text NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 1 AND 60),
  email text,
  passcode_hash text NOT NULL,
  role text NOT NULL DEFAULT 'verified' CHECK (role IN ('guest', 'verified', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) on public.forum_users
-- Do NOT add any public anon SELECT policy so emails and password hashes
-- can never be queried or scraped from the browser.
ALTER TABLE public.forum_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on forum_users" ON public.forum_users;
DROP POLICY IF EXISTS "Allow public read on forum_users" ON public.forum_users;

-- 4. Alter public.forum_threads and public.forum_replies to add auth columns
ALTER TABLE public.forum_threads
  ADD COLUMN IF NOT EXISTS author_passcode text,
  ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'guest';

ALTER TABLE public.forum_replies
  ADD COLUMN IF NOT EXISTS author_passcode text,
  ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'guest';

-- 5. Seed Henro's protected admin record into public.forum_users
-- >>> EDIT YOUR SECRET PASSCODE AND EMAIL ON THE NEXT LINES BEFORE RUNNING <<<
INSERT INTO public.forum_users (
  alias_key,
  display_name,
  email,
  passcode_hash,
  role
) VALUES (
  'henro',
  'Henro (Pilgrim)',
  'henro@caminohenro.blog',
  crypt('CHANGE_THIS_HENRO_PASSCODE', gen_salt('bf')),
  'admin'
)
ON CONFLICT (alias_key) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  passcode_hash = EXCLUDED.passcode_hash,
  role = 'admin';

-- Mark existing seeded starter threads by 'Henro (Pilgrim)' as author_role = 'admin'
UPDATE public.forum_threads
SET author_role = 'admin'
WHERE lower(trim(author_name)) IN ('henro', 'henro (pilgrim)')
   OR lower(trim(author_name)) LIKE '%henro%';

-- 6. Create SECURITY DEFINER trigger function to verify and claim aliases
CREATE OR REPLACE FUNCTION public.verify_and_claim_forum_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias_key text;
  v_input_passcode text;
  v_input_email text;
  v_admin_user public.forum_users%ROWTYPE;
  v_existing_user public.forum_users%ROWTYPE;
BEGIN
  v_alias_key := lower(trim(coalesce(NEW.author_name, '')));
  v_input_passcode := trim(coalesce(NEW.author_passcode, ''));
  v_input_email := NULLIF(lower(trim(coalesce(NEW.author_email, ''))), '');

  -- A) Anti-Impersonation Rule for Henro / Admin aliases
  IF v_alias_key LIKE '%henro%'
     OR v_alias_key LIKE '%admin%'
     OR v_alias_key LIKE '%カミノ遍路%'
  THEN
    SELECT *
    INTO v_admin_user
    FROM public.forum_users
    WHERE alias_key = 'henro'
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'ALIAS_PROTECTED: The name Henro is reserved. Please seed the Henro admin record in public.forum_users first.';
    END IF;

    IF v_input_passcode = ''
       OR crypt(v_input_passcode, v_admin_user.passcode_hash) <> v_admin_user.passcode_hash
    THEN
      RAISE EXCEPTION 'ALIAS_PROTECTED: The name Henro is reserved. Please enter Henro''s secret passcode to post under this name.';
    END IF;

    NEW.author_role := 'admin';

    IF v_input_email IS NOT NULL AND (v_admin_user.email IS NULL OR v_admin_user.email = '') THEN
      UPDATE public.forum_users
      SET email = v_input_email
      WHERE alias_key = 'henro';
    END IF;

  -- B) General Alias Claim & Verification Rule for all other names
  ELSE
    SELECT *
    INTO v_existing_user
    FROM public.forum_users
    WHERE alias_key = v_alias_key
    LIMIT 1;

    IF FOUND THEN
      -- Alias is already claimed: verify passcode
      IF v_input_passcode = ''
         OR crypt(v_input_passcode, v_existing_user.passcode_hash) <> v_existing_user.passcode_hash
      THEN
        RAISE EXCEPTION 'ALIAS_PROTECTED: This pilgrim alias is already claimed and protected. Please enter its passcode to post, or choose a different alias.';
      END IF;

      NEW.author_role := v_existing_user.role;

      IF v_input_email IS NOT NULL THEN
        UPDATE public.forum_users
        SET email = v_input_email
        WHERE alias_key = v_alias_key;
      END IF;
    ELSE
      -- Alias is not claimed yet
      IF v_input_passcode <> '' THEN
        IF char_length(v_input_passcode) < 3 THEN
          RAISE EXCEPTION 'ALIAS_PROTECTED: To claim and protect a new pilgrim alias, please enter a passcode of at least 3 characters (or leave the passcode blank to post as a guest).';
        END IF;

        INSERT INTO public.forum_users (
          alias_key,
          display_name,
          email,
          passcode_hash,
          role
        ) VALUES (
          v_alias_key,
          trim(NEW.author_name),
          v_input_email,
          crypt(v_input_passcode, gen_salt('bf')),
          'verified'
        );

        NEW.author_role := 'verified';
      ELSE
        NEW.author_role := 'guest';
      END IF;
    END IF;
  END IF;

  -- C) Privacy Scrubbing: Never store passcodes in public tables
  NEW.author_passcode := NULL;

  RETURN NEW;
END;
$$;

-- Attach BEFORE INSERT triggers to both forum_threads and forum_replies
DROP TRIGGER IF EXISTS trg_verify_forum_thread_alias ON public.forum_threads;
CREATE TRIGGER trg_verify_forum_thread_alias
  BEFORE INSERT ON public.forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_and_claim_forum_alias();

DROP TRIGGER IF EXISTS trg_verify_forum_reply_alias ON public.forum_replies;
CREATE TRIGGER trg_verify_forum_reply_alias
  BEFORE INSERT ON public.forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_and_claim_forum_alias();
