-- ============================================================================
-- CAMINO HENRO — FEATURE 1 UPGRADE: EMAIL NOTIFICATIONS VIA PG_NET
-- Run this in the Supabase SQL Editor AFTER Steps 8A and 8B.
-- ============================================================================

-- 1. Enable pg_net extension for outbound HTTP requests (emails)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create Private Secrets Table (Zero Public Access)
CREATE TABLE IF NOT EXISTS public.forum_secrets (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.forum_secrets ENABLE ROW LEVEL SECURITY;
-- No anon or authenticated policies means ONLY Security Definer triggers can read this

INSERT INTO public.forum_secrets (key, value) VALUES
  ('RESEND_API_KEY', 're_PASTE_YOUR_RESEND_API_KEY_HERE'),
  ('SENDER_EMAIL', 'Camino Henro Courtyard <courtyard@caminohenro.blog>'),
  ('FORUM_URL', 'https://caminohenro.blog/forum')
ON CONFLICT (key) DO NOTHING;

-- 3. Create Private Subscriptions Table (Zero Public Access)
CREATE TABLE IF NOT EXISTS public.forum_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  subscriber_email text NOT NULL,
  subscriber_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, subscriber_email)
);
ALTER TABLE public.forum_subscriptions ENABLE ROW LEVEL SECURITY;
-- No anon policies ensures emails are completely hidden from scrapers

-- 4. Add notify_replies toggle to incoming payloads
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS notify_replies boolean NOT NULL DEFAULT true;
ALTER TABLE public.forum_replies ADD COLUMN IF NOT EXISTS notify_replies boolean NOT NULL DEFAULT true;

-- 5. Update BEFORE INSERT Trigger (Merges 8A Auth with 8C Subscriptions)
CREATE OR REPLACE FUNCTION public.verify_and_claim_forum_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alias_key text;
  v_existing_role text;
  v_existing_hash text;
  v_admin_hash text;
  v_target_thread_id uuid;
BEGIN
  v_alias_key := lower(trim(NEW.author_name));

  -- Step 1: Anti-Impersonation & Auth Verification
  IF v_alias_key LIKE '%henro%' OR v_alias_key LIKE '%admin%' OR v_alias_key LIKE '%カミノ遍路%' THEN
    SELECT passcode_hash INTO v_admin_hash FROM public.forum_users WHERE alias_key = 'henro';
    IF NEW.author_passcode IS NULL OR crypt(NEW.author_passcode, v_admin_hash) <> v_admin_hash THEN
       RAISE EXCEPTION 'ALIAS_PROTECTED: The name Henro is reserved. Please enter Henro''s secret passcode to post under this name.';
    END IF;
    NEW.author_role := 'admin';
  ELSE
    SELECT role, passcode_hash INTO v_existing_role, v_existing_hash FROM public.forum_users WHERE alias_key = v_alias_key;
    IF FOUND THEN
       IF NEW.author_passcode IS NULL OR crypt(NEW.author_passcode, v_existing_hash) <> v_existing_hash THEN
          RAISE EXCEPTION 'ALIAS_PROTECTED: This pilgrim alias is already claimed and protected. Please enter its passcode to post, or choose a different alias.';
       END IF;
       NEW.author_role := v_existing_role;
       IF NEW.author_email IS NOT NULL AND NEW.author_email LIKE '%@%' THEN
          UPDATE public.forum_users SET email = lower(trim(NEW.author_email)) WHERE alias_key = v_alias_key;
       END IF;
    ELSE
       IF NEW.author_passcode IS NOT NULL AND length(trim(NEW.author_passcode)) >= 3 THEN
          INSERT INTO public.forum_users (alias_key, display_name, email, passcode_hash, role)
          VALUES (v_alias_key, trim(NEW.author_name), lower(trim(NEW.author_email)), crypt(NEW.author_passcode, gen_salt('bf')), 'verified');
          NEW.author_role := 'verified';
       ELSE
          NEW.author_role := 'guest';
       END IF;
    END IF;
  END IF;

  -- Step 2: Auto-Subscribe logic
  IF NEW.author_email IS NOT NULL AND NEW.author_email LIKE '%@%' AND NEW.notify_replies = true THEN
    IF TG_TABLE_NAME = 'forum_threads' THEN
      v_target_thread_id := NEW.id;
    ELSE
      v_target_thread_id := NEW.thread_id;
    END IF;

    INSERT INTO public.forum_subscriptions (thread_id, subscriber_email, subscriber_name)
    VALUES (v_target_thread_id, lower(trim(NEW.author_email)), NEW.author_name)
    ON CONFLICT (thread_id, subscriber_email) DO NOTHING;
  END IF;

  -- Step 3: Privacy Scrubbing (so passwords and emails never hit public API)
  NEW.author_email := NULL;
  NEW.author_passcode := NULL;

  RETURN NEW;
END;
$$;

-- Note: The trigger binding itself was done in 8A, but replacing the function applies it instantly.

-- 6. Create AFTER INSERT Trigger for Email Dispatches via pg_net
CREATE OR REPLACE FUNCTION public.notify_thread_subscribers_on_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key text;
  v_sender text;
  v_url text;
  v_thread_title text;
  sub_record RECORD;
  v_payload jsonb;
  v_request_id bigint;
BEGIN
  -- 1. Fetch credentials safely
  SELECT value INTO v_api_key FROM public.forum_secrets WHERE key = 'RESEND_API_KEY';
  SELECT value INTO v_sender FROM public.forum_secrets WHERE key = 'SENDER_EMAIL';
  SELECT value INTO v_url FROM public.forum_secrets WHERE key = 'FORUM_URL';

  -- Exit silently if API key is not configured, allowing replies to still save!
  IF v_api_key IS NULL OR v_api_key = '' OR v_api_key = 're_PASTE_YOUR_RESEND_API_KEY_HERE' THEN
    RETURN NEW;
  END IF;

  -- 2. Fetch the parent thread's title for the email subject
  SELECT title INTO v_thread_title FROM public.forum_threads WHERE id = NEW.thread_id;

  -- 3. Loop over subscribers (excluding the current replier by name)
  FOR sub_record IN
    SELECT subscriber_email, subscriber_name FROM public.forum_subscriptions
    WHERE thread_id = NEW.thread_id
      AND subscriber_name <> NEW.author_name
  LOOP
    -- Build clean HTML email payload
    v_payload := jsonb_build_object(
      'from', v_sender,
      'to', sub_record.subscriber_email,
      'subject', 'New reply in: ' || v_thread_title,
      'html', '<div style="font-family: Georgia, serif; color: #1C1A17; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #F4F1EA; border: 1px solid #D8CEB8;">' ||
              '<h2 style="color: #6E2B25; font-family: serif; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">広場 • The Pilgrim''s Courtyard</h2>' ||
              '<p>Dear ' || sub_record.subscriber_name || ',</p>' ||
              '<p><strong>' || NEW.author_name || '</strong> has inscribed a new response in the thread: <em>' || v_thread_title || '</em></p>' ||
              '<blockquote style="border-left: 3px solid #6E2B25; padding-left: 15px; margin: 20px 0; font-style: italic; color: #5A534A;">' ||
              left(NEW.body, 200) || CASE WHEN length(NEW.body) > 200 THEN '...' ELSE '' END ||
              '</blockquote>' ||
              '<p><a href="' || v_url || '" style="color: #6E2B25; text-decoration: none; font-weight: bold; font-family: monospace;">➔ READ FULL RESPONSE AND REPLY</a></p>' ||
              '</div>'
    );

    -- Dispatch async HTTP POST to Resend using pg_net
    SELECT net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
      body := v_payload
    ) INTO v_request_id;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_subscribers ON public.forum_replies;
CREATE TRIGGER trg_notify_subscribers
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_thread_subscribers_on_reply();
