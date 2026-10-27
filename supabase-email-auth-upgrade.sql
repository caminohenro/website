-- ============================================================================
-- CAMINO HENRO FORUM: ALIAS + EMAIL + PASSCODE AUTH & RECOVERY UPGRADE
-- Paste this entire script into the Supabase SQL Editor and click "Run".
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Ensure public.forum_users has an email column and normalized alias index
CREATE TABLE IF NOT EXISTS public.forum_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  email text,
  passcode_hash text NOT NULL,
  role text NOT NULL DEFAULT 'verified',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_users
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_forum_users_alias_key_norm
  ON public.forum_users ((lower(trim(alias_key))));

CREATE INDEX IF NOT EXISTS idx_forum_users_email_norm
  ON public.forum_users ((lower(trim(email))));

-- Ensure transient auth columns exist on forum_threads and forum_replies
ALTER TABLE public.forum_threads
  ADD COLUMN IF NOT EXISTS author_email text,
  ADD COLUMN IF NOT EXISTS author_passcode text,
  ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'guest',
  ADD COLUMN IF NOT EXISTS notify_replies boolean NOT NULL DEFAULT true;

ALTER TABLE public.forum_replies
  ADD COLUMN IF NOT EXISTS author_email text,
  ADD COLUMN IF NOT EXISTS author_passcode text,
  ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'guest',
  ADD COLUMN IF NOT EXISTS notify_replies boolean NOT NULL DEFAULT true;

-- Ensure forum_subscriptions and forum_secrets exist for notifications & reset emails
CREATE TABLE IF NOT EXISTS public.forum_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  subscriber_email text NOT NULL,
  subscriber_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(thread_id, subscriber_email)
);

CREATE TABLE IF NOT EXISTS public.forum_secrets (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- 2. Upgrade BEFORE INSERT trigger function: public.verify_and_claim_forum_alias()
CREATE OR REPLACE FUNCTION public.verify_and_claim_forum_alias()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_alias_key text;
  v_email text;
  v_passcode text;
  v_notify boolean;
  v_target_thread_id uuid;
  admin_user record;
  existing_user record;
BEGIN
  v_alias_key := lower(trim(coalesce(NEW.author_name, '')));
  v_email     := lower(trim(coalesce(NEW.author_email, '')));
  v_passcode  := trim(coalesce(NEW.author_passcode, ''));
  v_notify    := coalesce(NEW.notify_replies, true);

  IF v_alias_key = '' THEN
    RAISE EXCEPTION 'ALIAS_REQUIRED: Please enter a Pilgrim Alias before posting.';
  END IF;

  -- ==========================================================================
  -- RULE 1: Reserved Admin Identity ('henro', 'admin', 'カミノ遍路')
  -- ==========================================================================
  IF v_alias_key IN ('henro', 'admin', 'カミノ遍路') THEN
    SELECT * INTO admin_user
    FROM public.forum_users
    WHERE lower(trim(alias_key)) = 'henro'
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'ALIAS_PROTECTED: The name Henro is reserved. Please enter Henro''s registered email and secret passcode to post.';
    END IF;

    IF v_passcode = '' OR crypt(v_passcode, admin_user.passcode_hash) <> admin_user.passcode_hash THEN
      RAISE EXCEPTION 'ALIAS_PROTECTED: The name Henro is reserved. Please enter Henro''s registered email and secret passcode to post.';
    END IF;

    IF admin_user.email IS NOT NULL AND trim(admin_user.email) <> '' THEN
      IF v_email = '' OR v_email <> lower(trim(admin_user.email)) THEN
        RAISE EXCEPTION 'ALIAS_PROTECTED: The name Henro is reserved. Please enter Henro''s registered email and secret passcode to post.';
      END IF;
    ELSE
      IF v_email LIKE '%@%' THEN
        UPDATE public.forum_users
        SET email = v_email
        WHERE id = admin_user.id;
      END IF;
    END IF;

    NEW.author_role := 'admin';

  -- ==========================================================================
  -- RULE 2: Claimed & Protected Community Aliases (Alias + Email + Passcode)
  -- ==========================================================================
  ELSE
    SELECT * INTO existing_user
    FROM public.forum_users
    WHERE lower(trim(alias_key)) = v_alias_key
    LIMIT 1;

    IF FOUND THEN
      -- Alias already claimed: require valid email + matching passcode
      IF v_email = '' OR position('@' in v_email) = 0 OR v_passcode = '' THEN
        RAISE EXCEPTION 'ALIAS_PROTECTED: This pilgrim alias is protected. Please enter both the registered Email and Passcode for this alias, or choose a different alias.';
      END IF;

      IF crypt(v_passcode, existing_user.passcode_hash) <> existing_user.passcode_hash THEN
        RAISE EXCEPTION 'ALIAS_PROTECTED: This pilgrim alias is protected. Please enter both the registered Email and Passcode for this alias, or choose a different alias.';
      END IF;

      IF existing_user.email IS NOT NULL AND trim(existing_user.email) <> '' THEN
        IF v_email <> lower(trim(existing_user.email)) THEN
          RAISE EXCEPTION 'ALIAS_PROTECTED: This pilgrim alias is protected. Please enter both the registered Email and Passcode for this alias, or choose a different alias.';
        END IF;
      ELSE
        -- Legacy registration had NULL/empty email; bind email upon verified passcode
        UPDATE public.forum_users
        SET email = v_email
        WHERE id = existing_user.id;
      END IF;

      NEW.author_role := coalesce(existing_user.role, 'verified');

    ELSE
      -- Alias does NOT exist yet
      IF length(v_passcode) >= 3 THEN
        IF v_email = '' OR v_email NOT LIKE '%_@_%.__%' THEN
          RAISE EXCEPTION 'EMAIL_REQUIRED_FOR_CLAIM: To claim and protect a pilgrim alias with a passcode, please also provide your email address (kept 100%% private) for authentication and recovery.';
        END IF;

        INSERT INTO public.forum_users (alias_key, display_name, email, passcode_hash, role)
        VALUES (
          v_alias_key,
          trim(NEW.author_name),
          v_email,
          crypt(v_passcode, gen_salt('bf')),
          'verified'
        );

        NEW.author_role := 'verified';
      ELSIF length(v_passcode) > 0 AND length(v_passcode) < 3 THEN
        RAISE EXCEPTION 'PASSCODE_TOO_SHORT: Please choose a passcode of at least 3 characters, or leave it blank to post as an unverified guest.';
      ELSE
        NEW.author_role := 'guest';
      END IF;
    END IF;
  END IF;

  -- ==========================================================================
  -- RULE 3: Reply Notification Subscription & Privacy Scrubbing
  -- ==========================================================================
  IF v_email LIKE '%@%' AND v_notify = true THEN
    IF TG_TABLE_NAME = 'forum_threads' THEN
      IF NEW.id IS NULL THEN
        NEW.id := gen_random_uuid();
      END IF;
      v_target_thread_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'forum_replies' THEN
      v_target_thread_id := NEW.thread_id;
    END IF;

    IF v_target_thread_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.forum_subscriptions (thread_id, subscriber_email, subscriber_name)
        VALUES (v_target_thread_id, v_email, trim(NEW.author_name))
        ON CONFLICT (thread_id, subscriber_email) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- Do not block posting if subscription insert encounters an issue before FK commit
        NULL;
      END;
    END IF;
  END IF;

  -- Scrub transient sensitive fields before row is written
  NEW.author_email := NULL;
  NEW.author_passcode := NULL;

  RETURN NEW;
END;
$$;

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

-- 3. Create SECURITY DEFINER RPC: public.request_alias_passcode_reset(p_alias, p_email)
CREATE OR REPLACE FUNCTION public.request_alias_passcode_reset(p_alias text, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_alias_key text := lower(trim(coalesce(p_alias, '')));
  v_email     text := lower(trim(coalesce(p_email, '')));
  v_user      record;
  v_temp_pass text := '';
  v_chars     text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  v_i         int;
  v_resend_key text;
  v_from_email text;
  v_email_html text;
BEGIN
  IF v_alias_key <> '' AND v_email LIKE '%@%' THEN
    SELECT * INTO v_user
    FROM public.forum_users
    WHERE lower(trim(alias_key)) = v_alias_key
      AND lower(trim(coalesce(email, ''))) = v_email
    LIMIT 1;

    IF FOUND THEN
      -- Generate 8-character alphanumeric temporary passcode
      FOR v_i IN 1..8 LOOP
        v_temp_pass := v_temp_pass || substr(
          v_chars,
          1 + (get_byte(gen_random_bytes(1), 0) % length(v_chars)),
          1
        );
      END LOOP;

      UPDATE public.forum_users
      SET passcode_hash = crypt(v_temp_pass, gen_salt('bf'))
      WHERE id = v_user.id;

      SELECT value INTO v_resend_key
      FROM public.forum_secrets
      WHERE key = 'RESEND_API_KEY'
      LIMIT 1;

      SELECT coalesce(
        (SELECT value FROM public.forum_secrets WHERE key = 'RESEND_FROM_EMAIL' LIMIT 1),
        'Camino Henro Forum <forum@caminohenro.com>'
      ) INTO v_from_email;

      IF v_resend_key IS NOT NULL AND trim(v_resend_key) <> '' THEN
        v_email_html := format(
          '<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2c2520; background: #faf7f2; border: 1px solid #e2d9c8; border-radius: 8px;">' ||
          '<h2 style="margin-top: 0; color: #8c2d19;">Camino Henro Forum 印 Passcode Recovery</h2>' ||
          '<p>Greetings, <strong>%s</strong>,</p>' ||
          '<p>A temporary passcode was requested for your protected Pilgrim Alias. You can use the temporary passcode below together with your registered email address the next time you post:</p>' ||
          '<div style="background: #ffffff; border: 1px dashed #8c2d19; padding: 14px 18px; font-family: monospace; font-size: 18px; letter-spacing: 2px; text-align: center; margin: 20px 0;">%s</div>' ||
          '<p style="font-size: 13px; color: #5c5346;">Buen Camino &amp; Dōgyō Ninin,<br/>Camino Henro Sanctuary</p>' ||
          '</div>',
          v_user.display_name,
          v_temp_pass
        );

        PERFORM net.http_post(
          url := 'https://api.resend.com/emails',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || trim(v_resend_key),
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'from', v_from_email,
            'to', jsonb_build_array(v_email),
            'subject', 'Your Camino Henro Forum Temporary Passcode 印',
            'html', v_email_html
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'message', 'If that Pilgrim Alias and Email match a protected registration, a temporary passcode has been sent to your inbox.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_alias_passcode_reset(text, text) TO anon, authenticated;
