-- ============================================================================
-- CAMINO HENRO (カミノ遍路) — STEP 8B: ADMIN STAR & ROLE BADGE SYSTEM UPGRADE
-- Paste this entire file into the Supabase SQL Editor and click "Run".
-- ============================================================================

-- 1. Ensure author_role columns exist on forum_threads and forum_replies
ALTER TABLE public.forum_threads
  ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'guest';

ALTER TABLE public.forum_replies
  ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'guest';

-- 2. Backfill any existing threads & replies by Henro as 'admin'
UPDATE public.forum_threads
SET author_role = 'admin'
WHERE lower(trim(author_name)) LIKE '%henro%'
   OR lower(trim(author_name)) LIKE '%admin%'
   OR lower(trim(author_name)) LIKE '%カミノ遍路%';

UPDATE public.forum_replies
SET author_role = 'admin'
WHERE lower(trim(author_name)) LIKE '%henro%'
   OR lower(trim(author_name)) LIKE '%admin%'
   OR lower(trim(author_name)) LIKE '%カミノ遍路%';

-- 3. Synchronize all existing threads and replies with their author's current role in public.forum_users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'forum_users'
  ) THEN
    UPDATE public.forum_threads t
    SET author_role = u.role
    FROM public.forum_users u
    WHERE lower(trim(t.author_name)) = u.alias_key
      AND t.author_role IS DISTINCT FROM u.role;

    UPDATE public.forum_replies r
    SET author_role = u.role
    FROM public.forum_users u
    WHERE lower(trim(r.author_name)) = u.alias_key
      AND r.author_role IS DISTINCT FROM u.role;
  END IF;
END;
$$;

-- 4. Create Trigger Function on public.forum_users so changing a user's role
--    in the Supabase Table Editor automatically updates all of their past posts!
CREATE OR REPLACE FUNCTION public.sync_forum_user_role_to_posts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all threads authored by this user alias
  UPDATE public.forum_threads
  SET author_role = NEW.role
  WHERE lower(trim(author_name)) = NEW.alias_key
     OR lower(trim(author_name)) = lower(trim(NEW.display_name));

  -- Update all replies authored by this user alias
  UPDATE public.forum_replies
  SET author_role = NEW.role
  WHERE lower(trim(author_name)) = NEW.alias_key
     OR lower(trim(author_name)) = lower(trim(NEW.display_name));

  -- If the 'henro' master admin row was updated, ensure all Henro variations stay synced
  IF NEW.alias_key = 'henro' THEN
    UPDATE public.forum_threads
    SET author_role = NEW.role
    WHERE lower(trim(author_name)) LIKE '%henro%'
       OR lower(trim(author_name)) LIKE '%カミノ遍路%';

    UPDATE public.forum_replies
    SET author_role = NEW.role
    WHERE lower(trim(author_name)) LIKE '%henro%'
       OR lower(trim(author_name)) LIKE '%カミノ遍路%';
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Attach the role-sync trigger to public.forum_users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'forum_users'
  ) THEN
    DROP TRIGGER IF EXISTS trg_sync_forum_user_role ON public.forum_users;
    CREATE TRIGGER trg_sync_forum_user_role
      AFTER INSERT OR UPDATE OF role ON public.forum_users
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_forum_user_role_to_posts();
  END IF;
END;
$$;
