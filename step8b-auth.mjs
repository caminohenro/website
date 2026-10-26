import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// 1. Write supabase-auth-upgrade.sql in the project root
// ============================================================================
const upgradeSqlPath = path.resolve(process.cwd(), 'supabase-auth-upgrade.sql');

const upgradeSqlContent = `-- ============================================================================
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
`;

fs.writeFileSync(upgradeSqlPath, upgradeSqlContent, 'utf8');
console.log('Created: supabase-auth-upgrade.sql');

// ============================================================================
// 2. Update src/pages/forum.astro with Inline Alias Passcode & Identity Memory
// ============================================================================
const forumAstroPath = path.resolve(process.cwd(), 'src/pages/forum.astro');

const forumAstroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import siteConfig from '../data/siteConfig.json';

const supabaseUrl = siteConfig.supabase?.url?.trim() || "";
const supabaseAnonKey = siteConfig.supabase?.anonKey?.trim() || "";

const categories = [
  "All Topics",
  "Philosophy & Sufficiency",
  "Osettai & Hospitality",
  "Community & Book Initiatives",
  "Notes for the Road"
];
---

<BaseLayout
  title="The Philosophical Forum | CAMINO HENRO"
  description="Community dialogues on material security, Osettai, and the pilgrimage across Eurasia."
>
  <div
    id="forum-root"
    data-supabase-url={supabaseUrl}
    data-supabase-key={supabaseAnonKey}
  >
    <!-- Scroll Title Header Block -->
    <header class="scroll-title-block">
      <div class="scroll-eyebrow">広場 • The Pilgrim's Courtyard</div>
      <h1 class="page-heading">The Philosophical Forum</h1>
      <p class="page-subtitle">
        Community dialogues on material security, Osettai, and the pilgrimage
      </p>
    </header>

    <!-- Ornamental Kanji Divider -->
    <div class="page-break" aria-hidden="true">
      <div class="line"></div>
      <div class="kanji">語</div>
      <div class="line"></div>
    </div>

    <!-- Category Filter Bar + "+ Inscribe New Topic" Action Button -->
    <section class="forum-toolbar" aria-label="Forum Categories and Actions">
      <div class="forum-Toolbar-row">
        <div class="category-filter-bar" role="tablist" aria-label="Filter discussions by category">
          {categories.map((cat, idx) => (
            <button
              type="button"
              role="tab"
              aria-selected={idx === 0 ? "true" : "false"}
              data-category={cat}
              class={\`ink-action-btn category-filter-btn \${idx === 0 ? "is-active" : ""}\`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          id="toggle-new-topic-btn"
          class="ink-action-btn crimson-filled-btn"
          aria-expanded="false"
          aria-controls="new-topic-drawer"
        >
          + Inscribe New Topic 印
        </button>
      </div>

      <!-- Status & Mode Indicator Strip -->
      <div class="forum-status-bar">
        <span id="forum-status-indicator" class="forum-status-text">
          {supabaseUrl && supabaseAnonKey
            ? "● Connected to the Open Courtyard Ledger (Alias Protection Active)"
            : "○ Local Preview Mode (Demo Alias Protection: Henro passcode is 'henro')"}
        </span>
        <span id="forum-count-indicator" class="forum-count-text">
          Showing All Topics
        </span>
      </div>
    </section>

    <!-- Collapsible "New Discussion Topic" Washi Form -->
    <section
      id="new-topic-drawer"
      class="forum-form-panel hidden-view"
      aria-labelledby="new-topic-heading"
    >
      <div class="forum-form-header">
        <div>
          <span class="forum-form-eyebrow">新規の問い • INSCRIBE A NEW INQUIRY</span>
          <h2 id="new-topic-heading" class="forum-form-title">
            Start a New Discussion Topic
          </h2>
        </div>
        <button
          type="button"
          id="close-new-topic-btn"
          class="ink-action-btn forum-close-btn"
        >
          Close ✕
        </button>
      </div>

      <p class="forum-form-note">
        No account wall is required. Post immediately as a guest, or enter an optional passcode in one step to claim and protect your pilgrim alias from impersonation.
      </p>

      <form id="new-topic-form" class="washi-form" novalidate>
        <!-- Honeypot field to silently block automated spam bots -->
        <div class="honeypot-field" aria-hidden="true">
          <label for="topic-website-url">Website URL (Leave empty)</label>
          <input
            type="text"
            id="topic-website-url"
            name="website_url"
            tabindex="-1"
            autocomplete="off"
          />
        </div>

        <div class="form-grid-row">
          <div class="form-field">
            <label for="topic-category">Category *</label>
            <select id="topic-category" name="category" required>
              <option value="Philosophy & Sufficiency">Philosophy &amp; Sufficiency</option>
              <option value="Osettai & Hospitality">Osettai &amp; Hospitality</option>
              <option value="Community & Book Initiatives">Community &amp; Book Initiatives</option>
              <option value="Notes for the Road">Notes for the Road</option>
            </select>
          </div>

          <div class="form-field">
            <label for="topic-author">Your Name or Pilgrim Alias *</label>
            <input
              type="text"
              id="topic-author"
              name="author_name"
              required
              minlength="1"
              maxlength="60"
              placeholder="e.g. Clara (Porto) or A Fellow Walker"
            />
          </div>

          <div class="form-field">
            <label for="topic-email">Optional Email (Kept Private)</label>
            <input
              type="email"
              id="topic-email"
              name="author_email"
              maxlength="120"
              placeholder="Private — never shown on the site"
            />
          </div>

          <div class="form-field">
            <label for="topic-passcode">Optional Alias Passcode (Claim or Unlock Name)</label>
            <input
              type="password"
              id="topic-passcode"
              name="author_passcode"
              maxlength="120"
              autocomplete="current-password"
              placeholder="Set or enter passcode to protect your name"
            />
            <span class="field-helper-caption">
              First time using a name with a passcode claims it. Next time, enter the same passcode to post under your name.
            </span>
          </div>
        </div>

        <div class="remember-identity-row">
          <label class="remember-checkbox-label" for="topic-remember-identity">
            <input
              type="checkbox"
              id="topic-remember-identity"
              name="remember_identity"
              checked
            />
            <span>Remember my alias, email &amp; passcode on this device</span>
          </label>
        </div>

        <div class="form-field">
          <label for="topic-title">Topic Title *</label>
          <input
            type="text"
            id="topic-title"
            name="title"
            required
            minlength="3"
            maxlength="160"
            placeholder="Summarize your philosophical question, story, or initiative..."
          />
        </div>

        <div class="form-field">
          <label for="topic-body">Your Reflection / Question *</label>
          <textarea
            id="topic-body"
            name="body"
            rows="6"
            required
            minlength="5"
            maxlength="5000"
            placeholder="Write your thoughts in full. Paragraph breaks are preserved..."
          ></textarea>
        </div>

        <div id="new-topic-feedback" class="form-feedback" role="status" aria-live="polite"></div>

        <div class="form-actions">
          <button
            type="button"
            id="cancel-new-topic-btn"
            class="ink-action-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="submit-new-topic-btn"
            class="ink-action-btn crimson-filled-btn"
          >
            Inscribe Topic into Scroll 印
          </button>
        </div>
      </form>
    </section>

    <!-- ================================================================== -->
    <!-- MAIN VIEW 1: THREAD LIST VIEW (#forum-list-view)                   -->
    <!-- ================================================================== -->
    <section id="forum-list-view" aria-label="Discussion Threads">
      <div id="threads-stream-container" class="threads-stream">
        <div class="stream-item loading-placeholder">
          <div class="stream-meta">UNROLLING COURTYARD LEDGER...</div>
          <h3 class="stream-title">Gathering community dialogues...</h3>
          <p class="stream-excerpt">
            Please wait a moment while the latest reflections are retrieved.
          </p>
        </div>
      </div>
    </section>

    <!-- ================================================================== -->
    <!-- MAIN VIEW 2: SINGLE THREAD & REPLIES VIEW (#forum-thread-view)     -->
    <!-- ================================================================== -->
    <section
      id="forum-thread-view"
      class="hidden-view"
      aria-label="Selected Discussion Thread and Replies"
    >
      <div class="thread-nav-bar">
        <button
          type="button"
          id="back-to-list-btn"
          class="ink-action-btn"
        >
          ← Back to All Forum Topics
        </button>
      </div>

      <!-- Full Original Topic Article -->
      <article id="active-thread-article" class="active-thread-box">
        <div id="active-thread-meta" class="stream-meta"></div>
        <h2 id="active-thread-title" class="active-thread-heading"></h2>
        <div id="active-thread-body" class="active-thread-prose"></div>
      </article>

      <!-- Divider between OP and Replies -->
      <div class="page-break" aria-hidden="true">
        <div class="line"></div>
        <div class="kanji">響</div>
        <div class="line"></div>
      </div>

      <!-- Chronological Replies Section -->
      <div class="replies-section">
        <div class="replies-header">
          <h3 class="replies-heading">Voices in Response</h3>
          <span id="active-thread-reply-count" class="replies-badge">0 Replies</span>
        </div>

        <div id="replies-list-container" class="replies-list"></div>
      </div>

      <!-- Post a Reply to This Thread Form -->
      <div class="reply-form-box">
        <div class="forum-form-header">
          <div>
            <span class="forum-form-eyebrow">返答 • ADD YOUR VOICE</span>
            <h3 class="forum-form-title">Post a Reply to This Thread</h3>
          </div>
          <span class="kanji-seal">印</span>
        </div>

        <form id="new-reply-form" class="washi-form" novalidate>
          <!-- Honeypot field -->
          <div class="honeypot-field" aria-hidden="true">
            <label for="reply-website-url">Website URL (Leave empty)</label>
            <input
              type="text"
              id="reply-website-url"
              name="website_url"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <div class="form-grid-row">
            <div class="form-field">
              <label for="reply-author">Your Name or Pilgrim Alias *</label>
              <input
                type="text"
                id="reply-author"
                name="author_name"
                required
                minlength="1"
                maxlength="60"
                placeholder="e.g. Kenji (Matsuyama)"
              />
            </div>

            <div class="form-field">
              <label for="reply-email">Optional Email (Kept Private)</label>
              <input
                type="email"
                id="reply-email"
                name="author_email"
                maxlength="120"
                placeholder="Never displayed publicly"
              />
            </div>

            <div class="form-field">
              <label for="reply-passcode">Optional Alias Passcode (Claim or Unlock Name)</label>
              <input
                type="password"
                id="reply-passcode"
                name="author_passcode"
                maxlength="120"
                autocomplete="current-password"
                placeholder="Set or enter passcode to protect your name"
              />
              <span class="field-helper-caption">
                First time using a name with a passcode claims it. Next time, enter the same passcode to post under your name.
              </span>
            </div>
          </div>

          <div class="remember-identity-row">
            <label class="remember-checkbox-label" for="reply-remember-identity">
              <input
                type="checkbox"
                id="reply-remember-identity"
                name="remember_identity"
                checked
              />
              <span>Remember my alias, email &amp; passcode on this device</span>
            </label>
          </div>

          <div class="form-field">
            <label for="reply-body">Reply Message *</label>
            <textarea
              id="reply-body"
              name="body"
              rows="4"
              required
              minlength="2"
              maxlength="3000"
              placeholder="Offer your reflection, answer, or roadside encouragement..."
            ></textarea>
          </div>

          <div id="new-reply-feedback" class="form-feedback" role="status" aria-live="polite"></div>

          <div class="form-actions">
            <button
              type="submit"
              id="submit-new-reply-btn"
              class="ink-action-btn crimson-filled-btn"
            >
              Inscribe Reply 印
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- ================================================================== -->
    <!-- 3-STEP SUPABASE ACTIVATION GUIDE (Shown when supabaseUrl is empty) -->
    <!-- ================================================================== -->
    {(!supabaseUrl || !supabaseAnonKey) && (
      <>
        <div class="page-break" aria-hidden="true">
          <div class="line"></div>
          <div class="kanji">印</div>
          <div class="line"></div>
        </div>

        <aside class="supabase-setup-box" aria-labelledby="supabase-setup-heading">
          <div class="supabase-setup-header">
            <span class="supabase-setup-eyebrow">開門の手引き • COURTYARD DATABASE ACTIVATION</span>
            <span class="supabase-setup-badge">LOCAL DEMO MODE ACTIVE</span>
          </div>

          <h2 id="supabase-setup-heading" class="supabase-setup-title">
            3-Step Supabase Activation Guide
          </h2>

          <p class="supabase-setup-intro">
            The forum above is currently running in <strong>Interactive Local Preview Mode</strong> so you can test browsing categories, unrolling threads, and testing the new <strong>Anti-Impersonation Alias Passcode</strong> right now (try posting as <code>Henro</code> without a passcode to see the protection block, or enter demo passcode <code>henro</code> to unlock it). Follow these three quick steps to connect your live cloud database:
          </p>

          <ol class="supabase-steps-list">
            <li class="supabase-step-card">
              <div class="supabase-step-num">STEP 01 // CREATE FREE SUPABASE PROJECT</div>
              <p>
                Visit <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">https://supabase.com</a>, sign in, and click <strong>New Project</strong>. Give your project a name (such as <code>camino-henro</code>), set any database password, and wait ~60 seconds for it to initialize.
              </p>
            </li>

            <li class="supabase-step-card">
              <div class="supabase-step-num">STEP 02 // RUN supabase-setup.sql &amp; supabase-auth-upgrade.sql</div>
              <p>
                In your Supabase left sidebar, click <strong>SQL Editor</strong> → <strong>New query</strong>. Run <code>supabase-setup.sql</code> first (if you haven't already), then paste the contents of <code>supabase-auth-upgrade.sql</code>, edit your secret Henro passcode at the top, and click <strong>Run</strong>.
              </p>
            </li>

            <li class="supabase-step-card">
              <div class="supabase-step-num">STEP 03 // PASTE URL &amp; ANON KEY INTO siteConfig.json</div>
              <p>
                In Supabase, go to <strong>Project Settings (gear icon) → API</strong>. Copy your <strong>Project URL</strong> and your <strong>anon / public</strong> key, and paste them into <code>src/data/siteConfig.json</code> under the <code>"supabase"</code> block:
              </p>
              <pre class="supabase-code-snippet"><code>"supabase": &#123;
  "url": "https://YOUR_PROJECT_ID.supabase.co",
  "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
&#125;</code></pre>
            </li>
          </ol>
        </aside>
      </>
    )}
  </div>
</BaseLayout>

<style is:global>
  :root {
    --washi-bg: #E6DFCF;
    --washi-dark: #D8CEB8;
    --ink-sumi: #1C1A17;
    --ink-muted: #5A534A;
    --accent-crimson: #6E2B25;
    --accent-crimson-light: #8C3B33;
    --parchment-light: #F4F1EA;
  }

  /* Scroll Header & Dividers (matching Camino_Henro_Apple_Scroll_Preview-v2.html) */
  .scroll-title-block {
    text-align: center;
    padding: 0.5rem 0 1.25rem;
  }

  .scroll-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--accent-crimson);
    margin-bottom: 0.65rem;
  }

  .page-heading {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(2.15rem, 4.5vw, 3.1rem);
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--ink-sumi);
    line-height: 1.15;
    margin: 0 0 0.6rem;
  }

  .page-subtitle {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: 1.15rem;
    color: var(--ink-muted);
    max-width: 38rem;
    margin: 0 auto;
    line-height: 1.6;
  }

  .page-break {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin: 2rem 0;
    user-select: none;
  }

  .page-break .line {
    flex: 1;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(110, 43, 37, 0.45) 20%,
      rgba(110, 43, 37, 0.45) 80%,
      transparent 100%
    );
  }

  .page-break .kanji {
    font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
    font-size: 0.95rem;
    color: var(--accent-crimson);
    padding: 0.2rem 0.5rem;
    border: 1px solid rgba(110, 43, 37, 0.35);
    background-color: rgba(216, 206, 184, 0.45);
    line-height: 1;
  }

  /* Buttons (.ink-action-btn & filled crimson variant) */
  .ink-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.55rem 0.95rem;
    border: 1px solid rgba(28, 26, 23, 0.35);
    background-color: rgba(216, 206, 184, 0.35);
    color: var(--ink-sumi);
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    line-height: 1.2;
  }

  .ink-action-btn:hover {
    border-color: var(--accent-crimson);
    color: var(--accent-crimson);
    background-color: rgba(216, 206, 184, 0.75);
  }

  .ink-action-btn.is-active {
    border-color: var(--accent-crimson);
    background-color: var(--washi-dark);
    color: var(--accent-crimson);
    font-weight: 600;
    box-shadow: inset 0 -2px 0 var(--accent-crimson);
  }

  .ink-action-btn.crimson-filled-btn {
    background: var(--accent-crimson);
    color: #F4F1EA;
    border-color: var(--accent-crimson);
    font-weight: 500;
  }

  .ink-action-btn.crimson-filled-btn:hover {
    background: var(--accent-crimson-light);
    border-color: var(--accent-crimson-light);
    color: #F4F1EA;
  }

  .ink-action-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  /* Forum Toolbar & Filter Bar */
  .forum-toolbar {
    margin-bottom: 1.75rem;
  }

  .forum-Toolbar-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(28, 26, 23, 0.16);
  }

  .category-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .forum-status-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-top: 0.65rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--ink-muted);
    letter-spacing: 0.06em;
  }

  .forum-status-text {
    color: var(--accent-crimson);
  }

  /* Stream Item styling (matching Camino_Henro_Apple_Scroll_Preview-v2.html) */
  .threads-stream {
    display: flex;
    flex-direction: column;
  }

  .stream-item {
    padding: 1.6rem 1.25rem;
    border-bottom: 1px solid rgba(28, 26, 23, 0.15);
    transition: background-color 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
    position: relative;
  }

  .stream-item:first-child {
    border-top: 1px solid rgba(28, 26, 23, 0.15);
  }

  .stream-item:hover {
    background-color: rgba(216, 206, 184, 0.45);
  }

  .stream-item.is-pinned-item {
    border-left: 3px solid var(--accent-crimson);
    background-color: rgba(216, 206, 184, 0.28);
  }

  .stream-item.is-pinned-item:hover {
    background-color: rgba(216, 206, 184, 0.55);
  }

  .stream-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem 0.65rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-muted);
    margin-bottom: 0.55rem;
  }

  .pinned-stamp {
    color: var(--accent-crimson);
    font-weight: 700;
    border: 1px solid rgba(110, 43, 37, 0.45);
    background-color: rgba(110, 43, 37, 0.08);
    padding: 0.1rem 0.4rem;
  }

  .category-tag {
    color: var(--ink-sumi);
    background-color: rgba(216, 206, 184, 0.7);
    border: 1px solid rgba(28, 26, 23, 0.2);
    padding: 0.1rem 0.45rem;
  }

  .reply-count-tag {
    margin-left: auto;
    color: var(--accent-crimson);
    font-weight: 600;
  }

  .stream-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.55rem;
    font-weight: 700;
    color: var(--ink-sumi);
    margin: 0 0 0.5rem;
    line-height: 1.25;
    transition: color 0.2s ease;
  }

  .stream-item:hover .stream-title {
    color: var(--accent-crimson);
  }

  .stream-excerpt {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.08rem;
    line-height: 1.65;
    color: var(--ink-muted);
    margin: 0 0 0.85rem;
  }

  .stream-read-link {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent-crimson);
    font-weight: 600;
    text-decoration: none;
  }

  .stream-item:hover .stream-read-link {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  /* Forms & Drawers */
  .hidden-view {
    display: none !important;
  }

  .honeypot-field {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }

  .forum-form-panel,
  .reply-form-box {
    border: 1px solid var(--accent-crimson);
    background-color: rgba(216, 206, 184, 0.48);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .forum-form-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.85rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(110, 43, 37, 0.25);
  }

  .forum-form-eyebrow {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--accent-crimson);
    margin-bottom: 0.2rem;
  }

  .forum-form-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--ink-sumi);
    margin: 0;
  }

  .forum-form-note {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1rem;
    color: var(--ink-muted);
    margin: 0 0 1.2rem;
    line-height: 1.55;
  }

  .washi-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-grid-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 1rem;
  }

  .form-grid-two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-field label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-sumi);
    font-weight: 600;
  }

  .form-field input,
  .form-field select,
  .form-field textarea {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.05rem;
    color: var(--ink-sumi);
    background-color: var(--washi-bg);
    border: 1px solid rgba(28, 26, 23, 0.3);
    padding: 0.6rem 0.75rem;
    border-radius: 0;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .form-field input:focus,
  .form-field select:focus,
  .form-field textarea:focus {
    border-color: var(--accent-crimson);
    box-shadow: 0 0 0 1px var(--accent-crimson);
  }

  .field-helper-caption {
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: 0.88rem;
    line-height: 1.35;
    color: var(--ink-muted);
    margin-top: 0.1rem;
  }

  .remember-identity-row {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: rgba(230, 223, 207, 0.6);
    border: 1px dashed rgba(110, 43, 37, 0.35);
  }

  .remember-checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--ink-sumi);
    letter-spacing: 0.04em;
    user-select: none;
  }

  .remember-checkbox-label input[type="checkbox"] {
    accent-color: var(--accent-crimson);
    width: 0.95rem;
    height: 0.95rem;
    cursor: pointer;
  }

  .form-feedback {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    min-height: 1.2rem;
  }

  .form-feedback.is-error {
    color: #8B1E1E;
    font-weight: 600;
    background-color: rgba(139, 30, 30, 0.08);
    border-left: 3px solid #8B1E1E;
    padding: 0.55rem 0.75rem;
  }

  .form-feedback.is-success {
    color: var(--accent-crimson);
    font-weight: 600;
  }

  .form-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.4rem;
  }

  /* Single Thread & Replies View */
  .thread-nav-bar {
    margin-bottom: 1.5rem;
  }

  .active-thread-box {
    border: 1px solid rgba(28, 26, 23, 0.25);
    border-left: 3px solid var(--accent-crimson);
    background-color: rgba(216, 206, 184, 0.35);
    padding: 1.75rem;
  }

  .active-thread-heading {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(1.75rem, 3.5vw, 2.35rem);
    font-weight: 700;
    color: var(--ink-sumi);
    line-height: 1.2;
    margin: 0.35rem 0 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(28, 26, 23, 0.15);
  }

  .active-thread-prose {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.15rem;
    line-height: 1.8;
    color: var(--ink-sumi);
  }

  .active-thread-prose p {
    margin: 0 0 1.1rem;
  }

  .active-thread-prose p:last-child {
    margin-bottom: 0;
  }

  .replies-section {
    margin-bottom: 2.25rem;
  }

  .replies-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(110, 43, 37, 0.35);
  }

  .replies-heading {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-sumi);
    margin: 0;
  }

  .replies-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent-crimson);
    font-weight: 600;
  }

  .replies-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .reply-card {
    border: 1px solid rgba(28, 26, 23, 0.18);
    background-color: rgba(230, 223, 207, 0.75);
    padding: 1.25rem 1.4rem;
  }

  .reply-card-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--ink-muted);
    margin-bottom: 0.65rem;
    padding-bottom: 0.45rem;
    border-bottom: 1px dashed rgba(28, 26, 23, 0.15);
  }

  .reply-author-name {
    color: var(--accent-crimson);
    font-weight: 600;
  }

  .reply-card-body {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.08rem;
    line-height: 1.7;
    color: var(--ink-sumi);
  }

  .reply-card-body p {
    margin: 0 0 0.75rem;
  }

  .reply-card-body p:last-child {
    margin-bottom: 0;
  }

  .empty-replies-box {
    border: 1px dashed rgba(28, 26, 23, 0.25);
    padding: 1.5rem;
    text-align: center;
    font-family: 'EB Garamond', Georgia, serif;
    font-style: italic;
    font-size: 1.05rem;
    color: var(--ink-muted);
  }

  .kanji-seal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: 1px solid var(--accent-crimson);
    color: var(--accent-crimson);
    font-family: 'Shippori Mincho', serif;
    font-size: 0.85rem;
  }

  /* 3-Step Supabase Activation Box */
  .supabase-setup-box {
    border: 2px solid var(--accent-crimson);
    background-color: var(--washi-dark);
    padding: 1.75rem;
    margin-top: 1rem;
  }

  .supabase-setup-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(110, 43, 37, 0.35);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
  }

  .supabase-setup-eyebrow {
    color: var(--accent-crimson);
    font-weight: 700;
  }

  .supabase-setup-badge {
    background-color: var(--accent-crimson);
    color: #F4F1EA;
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
  }

  .supabase-setup-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink-sumi);
    margin: 0 0 0.65rem;
  }

  .supabase-setup-intro {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.05rem;
    line-height: 1.65;
    color: var(--ink-sumi);
    margin: 0 0 1.25rem;
  }

  .supabase-steps-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .supabase-step-card {
    border: 1px solid rgba(28, 26, 23, 0.2);
    background-color: var(--washi-bg);
    padding: 1rem 1.2rem;
  }

  .supabase-step-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent-crimson);
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
  }

  .supabase-step-card p {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--ink-sumi);
    margin: 0;
  }

  .supabase-step-card a {
    color: var(--accent-crimson);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .supabase-step-card code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    background-color: var(--washi-dark);
    padding: 0.1rem 0.35rem;
  }

  .supabase-code-snippet {
    margin: 0.75rem 0 0;
    padding: 0.85rem;
    background-color: var(--ink-sumi);
    color: var(--washi-bg);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    overflow-x: auto;
    line-height: 1.5;
  }

  .supabase-code-snippet code {
    background: transparent;
    padding: 0;
    color: inherit;
  }
</style>

<script is:inline>
  (function () {
    const rootEl = document.getElementById('forum-root');
    if (!rootEl) return;

    const rawUrl = (rootEl.getAttribute('data-supabase-url') || '').trim();
    const supabaseUrl = rawUrl.replace(/\\/+$/, '');
    const supabaseAnonKey = (rootEl.getAttribute('data-supabase-key') || '').trim();
    const isLiveSupabase = Boolean(supabaseUrl && supabaseAnonKey);

    const STORAGE_KEY = 'camino_henro_forum_identity';

    // Starter Philosophical Threads for Local Preview / Demo Mode
    const demoStarterThreads = [
      {
        id: 'demo-thread-1',
        category: 'Philosophy & Sufficiency',
        title: 'On Sufficiency vs. Surplus: What Does It Require to Feel Secure?',
        author_name: 'Henro (Pilgrim)',
        author_role: 'admin',
        body: 'Where do we draw the boundary between what is genuinely required to feel safe in the world and what we accumulate merely out of habit or fear?\\n\\nWalking eastward from the Atlantic cliffs with only what fits inside a small pack strips the question down to bone and breath: water, bread, dry shelter at nightfall, and the quiet trust that human society is not separate from Nature, but one of its living expressions.\\n\\nHave you experienced a moment in your own life when carrying or owning less unexpectedly deepened your sense of material security? Share your reflections below.',
        is_pinned: true,
        reply_count: 1,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'demo-thread-2',
        category: 'Osettai & Hospitality',
        title: 'Traditions of Hospitality: Bridging Osettai (お接待) and Donativo',
        author_name: 'Henro (Pilgrim)',
        author_role: 'admin',
        body: 'Both the European Camino de Santiago and the Shikoku Henro pilgrimage rest upon an ancient economy of trust. In Spain, hospitaleros welcome foot-weary strangers under the spirit of donativo; in Shikoku, locals offer green tea, citrus, or lodging as Osettai (お接待)—freely given alms offered in good faith so that giver and walker travel forward together in spirit (Dōgyō Ninin / 同行二人).\\n\\nHow can we preserve and practice uncalculated hospitality inside a modern commercial world that prices every interaction? Have you encountered or offered Osettai in unexpected places?',
        is_pinned: true,
        reply_count: 0,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'demo-thread-3',
        category: 'Community & Book Initiatives',
        title: 'Deliberating Future Works & Community Initiatives for the Archive',
        author_name: 'Henro (Pilgrim)',
        author_role: 'admin',
        body: 'While daily subsistence on the trail comes solely from the road itself, Osettai contributions made through this digital scroll are dedicated to sustaining the archive, preparing a future printed edition of these philosophical dispatches, and supporting community-aligned initiatives.\\n\\nAs this courtyard grows, how would you like to see our shared platform evolve? Are there specific philosophical inquiries, translations, or physical book formats you feel we should prioritize when the time comes?',
        is_pinned: true,
        reply_count: 0,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    const demoStarterReplies = {
      'demo-thread-1': [
        {
          id: 'demo-reply-101',
          thread_id: 'demo-thread-1',
          author_name: 'Mateo (Galicia)',
          author_role: 'guest',
          body: 'Buen Camino from Finisterra. For me, the realization came during a winter storm in O Cebreiro: security was never the weight of my wallet, but the warmth of a shared stove and a stranger handing over a bowl of caldo gallego without asking my name.',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ],
    };

    // Simulated users registry for Local Preview / Demo Mode
    const demoUsersRegistry = {
      henro: {
        display_name: 'Henro (Pilgrim)',
        passcode: 'henro',
        role: 'admin',
      },
    };

    // State
    let allThreads = [];
    let currentCategory = 'All Topics';
    let activeThreadId = null;

    // DOM References
    const categoryBtns = document.querySelectorAll('.category-filter-btn');
    const toggleNewTopicBtn = document.getElementById('toggle-new-topic-btn');
    const closeNewTopicBtn = document.getElementById('close-new-topic-btn');
    const cancelNewTopicBtn = document.getElementById('cancel-new-topic-btn');
    const newTopicDrawer = document.getElementById('new-topic-drawer');
    const newTopicForm = document.getElementById('new-topic-form');
    const newTopicFeedback = document.getElementById('new-topic-feedback');
    const submitNewTopicBtn = document.getElementById('submit-new-topic-btn');

    const topicAuthorInput = document.getElementById('topic-author');
    const topicEmailInput = document.getElementById('topic-email');
    const topicPasscodeInput = document.getElementById('topic-passcode');
    const topicRememberCheckbox = document.getElementById('topic-remember-identity');

    const countIndicator = document.getElementById('forum-count-indicator');
    const listView = document.getElementById('forum-list-view');
    const threadsStreamContainer = document.getElementById('threads-stream-container');

    const threadView = document.getElementById('forum-thread-view');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const activeThreadMeta = document.getElementById('active-thread-meta');
    const activeThreadTitle = document.getElementById('active-thread-title');
    const activeThreadBody = document.getElementById('active-thread-body');
    const activeThreadReplyCount = document.getElementById('active-thread-reply-count');
    const repliesListContainer = document.getElementById('replies-list-container');

    const newReplyForm = document.getElementById('new-reply-form');
    const newReplyFeedback = document.getElementById('new-reply-feedback');
    const submitNewReplyBtn = document.getElementById('submit-new-reply-btn');

    const replyAuthorInput = document.getElementById('reply-author');
    const replyEmailInput = document.getElementById('reply-email');
    const replyPasscodeInput = document.getElementById('reply-passcode');
    const replyRememberCheckbox = document.getElementById('reply-remember-identity');

    // Helpers
    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatDate(isoString) {
      if (!isoString) return '';
      const d = new Date(isoString);
      if (Number.isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    }

    function makeExcerpt(text, maxLen) {
      const clean = String(text || '').replace(/\\s+/g, ' ').trim();
      if (clean.length <= maxLen) return clean;
      return clean.slice(0, maxLen).trim() + '…';
    }

    function renderParagraphs(text) {
      const paragraphs = String(text || '')
        .split(/\\n{2,}|\\r\\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (paragraphs.length === 0) {
        return '<p>' + escapeHtml(text) + '</p>';
      }

      return paragraphs
        .map((p) => '<p>' + escapeHtml(p).replace(/\\n/g, '<br />') + '</p>')
        .join('');
    }

    // Load & Save Identity in localStorage
    function loadSavedIdentity() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;

        const savedName = parsed.author_name || '';
        const savedEmail = parsed.author_email || '';
        const savedPasscode = parsed.author_passcode || '';
        const remember = parsed.remember !== false;

        if (topicRememberCheckbox) topicRememberCheckbox.checked = remember;
        if (replyRememberCheckbox) replyRememberCheckbox.checked = remember;

        if (remember) {
          if (topicAuthorInput && !topicAuthorInput.value) topicAuthorInput.value = savedName;
          if (topicEmailInput && !topicEmailInput.value) topicEmailInput.value = savedEmail;
          if (topicPasscodeInput && !topicPasscodeInput.value) topicPasscodeInput.value = savedPasscode;

          if (replyAuthorInput && !replyAuthorInput.value) replyAuthorInput.value = savedName;
          if (replyEmailInput && !replyEmailInput.value) replyEmailInput.value = savedEmail;
          if (replyPasscodeInput && !replyPasscodeInput.value) replyPasscodeInput.value = savedPasscode;
        }
      } catch (err) {
        // Ignore storage errors in private browsing modes
      }
    }

    function handleIdentityPersistence(author_name, author_email, author_passcode, shouldRemember) {
      try {
        if (topicRememberCheckbox) topicRememberCheckbox.checked = Boolean(shouldRemember);
        if (replyRememberCheckbox) replyRememberCheckbox.checked = Boolean(shouldRemember);

        if (shouldRemember) {
          const payload = {
            author_name: author_name || '',
            author_email: author_email || '',
            author_passcode: author_passcode || '',
            remember: true,
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

          if (topicAuthorInput) topicAuthorInput.value = payload.author_name;
          if (topicEmailInput) topicEmailInput.value = payload.author_email;
          if (topicPasscodeInput) topicPasscodeInput.value = payload.author_passcode;

          if (replyAuthorInput) replyAuthorInput.value = payload.author_name;
          if (replyEmailInput) replyEmailInput.value = payload.author_email;
          if (replyPasscodeInput) replyPasscodeInput.value = payload.author_passcode;
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        // Ignore storage errors
      }
    }

    // Keep both "Remember me" checkboxes synchronized
    if (topicRememberCheckbox && replyRememberCheckbox) {
      topicRememberCheckbox.addEventListener('change', function () {
        replyRememberCheckbox.checked = topicRememberCheckbox.checked;
        if (!topicRememberCheckbox.checked) {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch (e) {}
        }
      });
      replyRememberCheckbox.addEventListener('change', function () {
        topicRememberCheckbox.checked = replyRememberCheckbox.checked;
        if (!replyRememberCheckbox.checked) {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch (e) {}
        }
      });
    }

    // Extract friendly error message when Supabase raises ALIAS_PROTECTED
    function extractFriendlyErrorMessage(rawError, fallbackMessage) {
      const text = String(rawError?.message || rawError || '');
      if (text.includes('ALIAS_PROTECTED')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.message && parsed.message.includes('ALIAS_PROTECTED')) {
            return '🔒 ' + parsed.message;
          }
        } catch (e) {
          // Not JSON, extract directly from string
        }
        const idx = text.indexOf('ALIAS_PROTECTED');
        return '🔒 ' + text.slice(idx).replace(/["}]+$/, '');
      }
      return fallbackMessage;
    }

    // Simulate PostgreSQL verify_and_claim_forum_alias() in Local Preview / Demo Mode
    function verifyDemoAlias(author_name, author_passcode) {
      const aliasKey = String(author_name || '').trim().toLowerCase();
      const pass = String(author_passcode || '').trim();

      if (
        aliasKey.includes('henro') ||
        aliasKey.includes('admin') ||
        aliasKey.includes('カミノ遍路')
      ) {
        if (pass !== demoUsersRegistry.henro.passcode) {
          throw new Error(
            "ALIAS_PROTECTED: The name Henro is reserved. Please enter Henro's secret passcode to post under this name. (In Local Demo Mode, use passcode: henro)"
          );
        }
        return 'admin';
      }

      if (demoUsersRegistry[aliasKey]) {
        if (!pass || pass !== demoUsersRegistry[aliasKey].passcode) {
          throw new Error(
            'ALIAS_PROTECTED: This pilgrim alias is already claimed and protected. Please enter its passcode to post, or choose a different alias.'
          );
        }
        return demoUsersRegistry[aliasKey].role;
      }

      if (pass.length > 0) {
        if (pass.length < 3) {
          throw new Error(
            'ALIAS_PROTECTED: To claim and protect a new pilgrim alias, please enter a passcode of at least 3 characters (or leave the passcode blank to post as a guest).'
          );
        }
        demoUsersRegistry[aliasKey] = {
          display_name: String(author_name).trim(),
          passcode: pass,
          role: 'verified',
        };
        return 'verified';
      }

      return 'guest';
    }

    // Drawer Toggle
    function setNewTopicDrawerOpen(isOpen) {
      if (!newTopicDrawer || !toggleNewTopicBtn) return;
      if (isOpen) {
        newTopicDrawer.classList.remove('hidden-view');
        toggleNewTopicBtn.setAttribute('aria-expanded', 'true');
        loadSavedIdentity();
        if (topicAuthorInput && !topicAuthorInput.value) {
          topicAuthorInput.focus();
        } else {
          const titleInput = document.getElementById('topic-title');
          if (titleInput) titleInput.focus();
        }
      } else {
        newTopicDrawer.classList.add('hidden-view');
        toggleNewTopicBtn.setAttribute('aria-expanded', 'false');
        if (newTopicFeedback) {
          newTopicFeedback.textContent = '';
          newTopicFeedback.className = 'form-feedback';
        }
      }
    }

    if (toggleNewTopicBtn) {
      toggleNewTopicBtn.addEventListener('click', function () {
        const isCurrentlyHidden = newTopicDrawer.classList.contains('hidden-view');
        setNewTopicDrawerOpen(isCurrentlyHidden);
      });
    }
    if (closeNewTopicBtn) {
      closeNewTopicBtn.addEventListener('click', function () {
        setNewTopicDrawerOpen(false);
      });
    }
    if (cancelNewTopicBtn) {
      cancelNewTopicBtn.addEventListener('click', function () {
        setNewTopicDrawerOpen(false);
      });
    }

    // Fetch Threads from Supabase or Demo Mode
    async function loadThreads() {
      if (!isLiveSupabase) {
        allThreads = demoStarterThreads.slice();
        renderThreadList();
        return;
      }

      try {
        const endpoint = \`\${supabaseUrl}/rest/v1/forum_threads?select=id,category,title,author_name,body,is_pinned,reply_count,created_at&order=is_pinned.desc,created_at.desc\`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: \`Bearer \${supabaseAnonKey}\`,
          },
        });

        if (!response.ok) {
          throw new Error(\`Supabase HTTP \${response.status}\`);
        }

        const data = await response.json();
        allThreads = Array.isArray(data) ? data : [];
        renderThreadList();
      } catch (err) {
        console.error('Error loading threads from Supabase:', err);
        allThreads = demoStarterThreads.slice();
        renderThreadList();
      }
    }

    // Render Thread List View (#forum-list-view)
    function renderThreadList() {
      if (!threadsStreamContainer) return;

      const filtered =
        currentCategory === 'All Topics'
          ? allThreads
          : allThreads.filter((t) => t.category === currentCategory);

      if (countIndicator) {
        const label = currentCategory === 'All Topics' ? 'All Topics' : currentCategory;
        countIndicator.textContent = \`\${label} (\${filtered.length} \${filtered.length === 1 ? 'Thread' : 'Threads'})\`;
      }

      if (filtered.length === 0) {
        threadsStreamContainer.innerHTML = \`
          <div class="stream-item">
            <div class="stream-meta">EMPTY COURTYARD SECTION</div>
            <h3 class="stream-title">No discussions inscribed in "\${escapeHtml(currentCategory)}" yet</h3>
            <p class="stream-excerpt">
              Be the first pilgrim to open a dialogue in this category by clicking "+ Inscribe New Topic 印" above.
            </p>
          </div>
        \`;
        return;
      }

      threadsStreamContainer.innerHTML = filtered
        .map((thread) => {
          const pinnedBadge = thread.is_pinned
            ? '<span class="pinned-stamp">[PINNED 印]</span>'
            : '';
          const replyCount = Number(thread.reply_count || 0);
          const replyLabel = replyCount === 1 ? '1 Reply' : \`\${replyCount} Replies\`;
          const excerpt = makeExcerpt(thread.body, 180);

          return \`
            <article
              class="stream-item \${thread.is_pinned ? 'is-pinned-item' : ''}"
              data-thread-id="\${escapeHtml(thread.id)}"
              tabindex="0"
              role="button"
              aria-label="Open discussion: \${escapeHtml(thread.title)}"
            >
              <div class="stream-meta">
                \${pinnedBadge}
                <span class="category-tag">\${escapeHtml(thread.category)}</span>
                <span>BY \${escapeHtml(thread.author_name)}</span>
                <span>•</span>
                <time datetime="\${escapeHtml(thread.created_at)}">\${escapeHtml(formatDate(thread.created_at))}</time>
                <span class="reply-count-tag">💬 \${escapeHtml(replyLabel)}</span>
              </div>
              <h3 class="stream-title">\${escapeHtml(thread.title)}</h3>
              <p class="stream-excerpt">\${escapeHtml(excerpt)}</p>
              <span class="stream-read-link">Unroll Discussion ➔</span>
            </article>
          \`;
        })
        .join('');

      // Attach click & keyboard listeners to each .stream-item
      const items = threadsStreamContainer.querySelectorAll('.stream-item[data-thread-id]');
      items.forEach((item) => {
        item.addEventListener('click', function () {
          const id = item.getAttribute('data-thread-id');
          if (id) openThreadView(id);
        });
        item.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const id = item.getAttribute('data-thread-id');
            if (id) openThreadView(id);
          }
        });
      });
    }

    // Category Filter Buttons
    categoryBtns.forEach((btn) => {
      btn.addEventListener('click', function () {
        const selectedCat = btn.getAttribute('data-category') || 'All Topics';
        currentCategory = selectedCat;

        categoryBtns.forEach((b) => {
          const isMatch = b.getAttribute('data-category') === selectedCat;
          b.classList.toggle('is-active', isMatch);
          b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });

        if (activeThreadId !== null) {
          closeThreadView();
        }
        renderThreadList();
      });
    });

    // Open Single Thread & Replies View (#forum-thread-view)
    async function openThreadView(threadId) {
      const thread = allThreads.find((t) => String(t.id) === String(threadId));
      if (!thread) return;

      activeThreadId = thread.id;

      if (activeThreadMeta) {
        const pinnedHtml = thread.is_pinned ? '<span class="pinned-stamp">[PINNED 印]</span>' : '';
        activeThreadMeta.innerHTML = \`
          \${pinnedHtml}
          <span class="category-tag">\${escapeHtml(thread.category)}</span>
          <span>INSCRIBED BY <strong>\${escapeHtml(thread.author_name)}</strong></span>
          <span>•</span>
          <time datetime="\${escapeHtml(thread.created_at)}">\${escapeHtml(formatDate(thread.created_at))}</time>
        \`;
      }
      if (activeThreadTitle) {
        activeThreadTitle.textContent = thread.title;
      }
      if (activeThreadBody) {
        activeThreadBody.innerHTML = renderParagraphs(thread.body);
      }

      if (listView) listView.classList.add('hidden-view');
      if (threadView) threadView.classList.remove('hidden-view');

      if (newReplyFeedback) {
        newReplyFeedback.textContent = '';
        newReplyFeedback.className = 'form-feedback';
      }

      loadSavedIdentity();
      await loadRepliesForThread(thread.id);
    }

    function closeThreadView() {
      activeThreadId = null;
      if (threadView) threadView.classList.add('hidden-view');
      if (listView) listView.classList.remove('hidden-view');
      renderThreadList();
    }

    if (backToListBtn) {
      backToListBtn.addEventListener('click', function () {
        closeThreadView();
      });
    }

    // Fetch Replies for a Thread
    async function loadRepliesForThread(threadId) {
      if (!repliesListContainer) return;

      repliesListContainer.innerHTML = \`
        <div class="empty-replies-box">Unrolling responses...</div>
      \`;

      if (!isLiveSupabase) {
        const list = demoStarterReplies[threadId] || [];
        renderRepliesList(list);
        return;
      }

      try {
        const endpoint = \`\${supabaseUrl}/rest/v1/forum_replies?thread_id=eq.\${encodeURIComponent(threadId)}&select=id,author_name,body,created_at&order=created_at.asc\`;
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: \`Bearer \${supabaseAnonKey}\`,
          },
        });

        if (!response.ok) {
          throw new Error(\`Supabase HTTP \${response.status}\`);
        }

        const replies = await response.json();
        renderRepliesList(Array.isArray(replies) ? replies : []);
      } catch (err) {
        console.error('Error fetching replies:', err);
        const fallback = demoStarterReplies[threadId] || [];
        renderRepliesList(fallback);
      }
    }

    function renderRepliesList(replies) {
      if (!repliesListContainer) return;

      if (activeThreadReplyCount) {
        const count = replies.length;
        activeThreadReplyCount.textContent = count === 1 ? '1 Reply' : \`\${count} Replies\`;
      }

      if (replies.length === 0) {
        repliesListContainer.innerHTML = \`
          <div class="empty-replies-box">
            No replies have been inscribed yet. Be the first to respond below.
          </div>
        \`;
        return;
      }

      repliesListContainer.innerHTML = replies
        .map((reply) => {
          return \`
            <div class="reply-card">
              <div class="reply-card-meta">
                <span class="reply-author-name">印 \${escapeHtml(reply.author_name)}</span>
                <time datetime="\${escapeHtml(reply.created_at)}">\${escapeHtml(formatDate(reply.created_at))}</time>
              </div>
              <div class="reply-card-body">
                \${renderParagraphs(reply.body)}
              </div>
            </div>
          \`;
        })
        .join('');
    }

    // Reset only message fields while keeping saved identity pre-filled
    function clearTopicMessageFieldsOnly() {
      const titleEl = document.getElementById('topic-title');
      const bodyEl = document.getElementById('topic-body');
      if (titleEl) titleEl.value = '';
      if (bodyEl) bodyEl.value = '';
      if (topicRememberCheckbox && !topicRememberCheckbox.checked) {
        if (topicAuthorInput) topicAuthorInput.value = '';
        if (topicEmailInput) topicEmailInput.value = '';
        if (topicPasscodeInput) topicPasscodeInput.value = '';
      }
    }

    function clearReplyMessageFieldOnly() {
      const bodyEl = document.getElementById('reply-body');
      if (bodyEl) bodyEl.value = '';
      if (replyRememberCheckbox && !replyRememberCheckbox.checked) {
        if (replyAuthorInput) replyAuthorInput.value = '';
        if (replyEmailInput) replyEmailInput.value = '';
        if (replyPasscodeInput) replyPasscodeInput.value = '';
      }
    }

    // Handle "New Discussion Topic" Form Submission
    if (newTopicForm) {
      newTopicForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const honeypot = document.getElementById('topic-website-url');
        if (honeypot && honeypot.value.trim() !== '') {
          newTopicForm.reset();
          setNewTopicDrawerOpen(false);
          return;
        }

        const categoryEl = document.getElementById('topic-category');
        const titleEl = document.getElementById('topic-title');
        const bodyEl = document.getElementById('topic-body');

        const category = categoryEl ? categoryEl.value.trim() : 'Philosophy & Sufficiency';
        const author_name = topicAuthorInput ? topicAuthorInput.value.trim() : '';
        const author_email = topicEmailInput ? topicEmailInput.value.trim() : '';
        const author_passcode = topicPasscodeInput ? topicPasscodeInput.value.trim() : '';
        const rememberIdentity = topicRememberCheckbox ? topicRememberCheckbox.checked : true;
        const title = titleEl ? titleEl.value.trim() : '';
        const body = bodyEl ? bodyEl.value.trim() : '';

        if (author_name.length < 1 || author_name.length > 60) {
          newTopicFeedback.textContent = 'Please enter your Name or Pilgrim Alias (1–60 characters).';
          newTopicFeedback.className = 'form-feedback is-error';
          return;
        }
        if (title.length < 3 || title.length > 160) {
          newTopicFeedback.textContent = 'Please enter a Topic Title between 3 and 160 characters.';
          newTopicFeedback.className = 'form-feedback is-error';
          return;
        }
        if (body.length < 5 || body.length > 5000) {
          newTopicFeedback.textContent = 'Please write a Reflection between 5 and 5,000 characters.';
          newTopicFeedback.className = 'form-feedback is-error';
          return;
        }

        submitNewTopicBtn.disabled = true;
        submitNewTopicBtn.textContent = 'Verifying & Inscribing...';
        newTopicFeedback.textContent = '';
        newTopicFeedback.className = 'form-feedback';

        if (!isLiveSupabase) {
          try {
            const verifiedRole = verifyDemoAlias(author_name, author_passcode);
            handleIdentityPersistence(author_name, author_email, author_passcode, rememberIdentity);

            const createdDemoThread = {
              id: 'demo-thread-' + Date.now(),
              category: category,
              title: title,
              author_name: author_name,
              author_role: verifiedRole,
              body: body,
              is_pinned: false,
              reply_count: 0,
              created_at: new Date().toISOString(),
            };
            allThreads.unshift(createdDemoThread);
            demoStarterReplies[createdDemoThread.id] = [];
            clearTopicMessageFieldsOnly();
            setNewTopicDrawerOpen(false);
            renderThreadList();
            openThreadView(createdDemoThread.id);
          } catch (demoErr) {
            newTopicFeedback.textContent = extractFriendlyErrorMessage(
              demoErr,
              'Could not inscribe topic.'
            );
            newTopicFeedback.className = 'form-feedback is-error';
          } finally {
            submitNewTopicBtn.disabled = false;
            submitNewTopicBtn.textContent = 'Inscribe Topic into Scroll 印';
          }
          return;
        }

        try {
          const endpoint = \`\${supabaseUrl}/rest/v1/forum_threads?select=id,category,title,author_name,body,is_pinned,reply_count,created_at\`;
          const payload = {
            category: category,
            title: title,
            author_name: author_name,
            author_email: author_email || null,
            author_passcode: author_passcode || null,
            body: body,
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: \`Bearer \${supabaseAnonKey}\`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || \`HTTP \${response.status}\`);
          }

          handleIdentityPersistence(author_name, author_email, author_passcode, rememberIdentity);

          const inserted = await response.json();
          const newThread = Array.isArray(inserted) && inserted[0] ? inserted[0] : null;

          clearTopicMessageFieldsOnly();
          setNewTopicDrawerOpen(false);

          await loadThreads();
          if (newThread && newThread.id) {
            openThreadView(newThread.id);
          }
        } catch (err) {
          console.error('Failed to post new topic:', err);
          newTopicFeedback.textContent = extractFriendlyErrorMessage(
            err,
            'Could not inscribe topic. Please verify your Supabase connection or try again.'
          );
          newTopicFeedback.className = 'form-feedback is-error';
        } finally {
          submitNewTopicBtn.disabled = false;
          submitNewTopicBtn.textContent = 'Inscribe Topic into Scroll 印';
        }
      });
    }

    // Handle "Post a Reply to This Thread" Form Submission
    if (newReplyForm) {
      newReplyForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!activeThreadId) return;

        const honeypot = document.getElementById('reply-website-url');
        if (honeypot && honeypot.value.trim() !== '') {
          newReplyForm.reset();
          return;
        }

        const bodyEl = document.getElementById('reply-body');

        const author_name = replyAuthorInput ? replyAuthorInput.value.trim() : '';
        const author_email = replyEmailInput ? replyEmailInput.value.trim() : '';
        const author_passcode = replyPasscodeInput ? replyPasscodeInput.value.trim() : '';
        const rememberIdentity = replyRememberCheckbox ? replyRememberCheckbox.checked : true;
        const body = bodyEl ? bodyEl.value.trim() : '';

        if (author_name.length < 1 || author_name.length > 60) {
          newReplyFeedback.textContent = 'Please enter your Name or Pilgrim Alias (1–60 characters).';
          newReplyFeedback.className = 'form-feedback is-error';
          return;
        }
        if (body.length < 2 || body.length > 3000) {
          newReplyFeedback.textContent = 'Please enter a reply between 2 and 3,000 characters.';
          newReplyFeedback.className = 'form-feedback is-error';
          return;
        }

        submitNewReplyBtn.disabled = true;
        submitNewReplyBtn.textContent = 'Verifying & Inscribing...';
        newReplyFeedback.textContent = '';
        newReplyFeedback.className = 'form-feedback';

        if (!isLiveSupabase) {
          try {
            const verifiedRole = verifyDemoAlias(author_name, author_passcode);
            handleIdentityPersistence(author_name, author_email, author_passcode, rememberIdentity);

            const demoReply = {
              id: 'demo-reply-' + Date.now(),
              thread_id: activeThreadId,
              author_name: author_name,
              author_role: verifiedRole,
              body: body,
              created_at: new Date().toISOString(),
            };
            if (!demoStarterReplies[activeThreadId]) {
              demoStarterReplies[activeThreadId] = [];
            }
            demoStarterReplies[activeThreadId].push(demoReply);

            const parentThread = allThreads.find((t) => String(t.id) === String(activeThreadId));
            if (parentThread) {
              parentThread.reply_count = Number(parentThread.reply_count || 0) + 1;
            }

            renderRepliesList(demoStarterReplies[activeThreadId]);
            clearReplyMessageFieldOnly();
            newReplyFeedback.textContent = '✓ Reply inscribed into the thread.';
            newReplyFeedback.className = 'form-feedback is-success';
          } catch (demoErr) {
            newReplyFeedback.textContent = extractFriendlyErrorMessage(
              demoErr,
              'Could not post reply.'
            );
            newReplyFeedback.className = 'form-feedback is-error';
          } finally {
            submitNewReplyBtn.disabled = false;
            submitNewReplyBtn.textContent = 'Inscribe Reply 印';
          }
          return;
        }

        try {
          const endpoint = \`\${supabaseUrl}/rest/v1/forum_replies?select=id,author_name,body,created_at\`;
          const payload = {
            thread_id: activeThreadId,
            author_name: author_name,
            author_email: author_email || null,
            author_passcode: author_passcode || null,
            body: body,
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: \`Bearer \${supabaseAnonKey}\`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || \`HTTP \${response.status}\`);
          }

          handleIdentityPersistence(author_name, author_email, author_passcode, rememberIdentity);

          const parentThread = allThreads.find((t) => String(t.id) === String(activeThreadId));
          if (parentThread) {
            parentThread.reply_count = Number(parentThread.reply_count || 0) + 1;
          }

          clearReplyMessageFieldOnly();
          await loadRepliesForThread(activeThreadId);
          newReplyFeedback.textContent = '✓ Your reply has been inscribed into the thread.';
          newReplyFeedback.className = 'form-feedback is-success';
        } catch (err) {
          console.error('Failed to post reply:', err);
          newReplyFeedback.textContent = extractFriendlyErrorMessage(
            err,
            'Could not post reply. Please verify your connection and try again.'
          );
          newReplyFeedback.className = 'form-feedback is-error';
        } finally {
          submitNewReplyBtn.disabled = false;
          submitNewReplyBtn.textContent = 'Inscribe Reply 印';
        }
      });
    }

    // Initialize saved identity and load forum threads on page load
    loadSavedIdentity();
    loadThreads();
  })();
</script>
`;

fs.mkdirSync(path.dirname(forumAstroPath), { recursive: true });
fs.writeFileSync(forumAstroPath, forumAstroContent, 'utf8');
console.log('Updated: src/pages/forum.astro (Added inline Alias Passcode & localStorage identity memory)');

console.log('\nStep 8A (Forum Anti-Impersonation & Inline Alias Protection) complete!');