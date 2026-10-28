import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

// ============================================================================
// 1. UPDATE src/data/siteConfig.json
// ============================================================================
const siteConfigPath = path.join(rootDir, 'src', 'data', 'siteConfig.json');
let siteConfig = {};

if (fs.existsSync(siteConfigPath)) {
  const rawConfig = fs.readFileSync(siteConfigPath, 'utf8');
  siteConfig = JSON.parse(rawConfig);
}

siteConfig.mailerlite = {
  formActionUrl:
    siteConfig.mailerlite?.formActionUrl ||
    'https://assets.mailerlite.com/jsonp/YOUR_ACCOUNT_ID/forms/YOUR_FORM_ID/subscribe',
  apiKey: siteConfig.mailerlite?.apiKey || 'YOUR_MAILERLITE_API_KEY_OPTIONAL',
  groupId: siteConfig.mailerlite?.groupId || 'YOUR_MAILERLITE_GROUP_ID_OPTIONAL',
};

siteConfig.navigation = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/essays' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Credits', href: '/Credits' },
  {
    label: 'Coming Soon',
    children: [
      { label: 'Map', href: '/map', featureFlag: 'enableMap' },
      { label: 'Inventory', href: '/inventory', featureFlag: 'enableInventory' },
      { label: 'Finances', href: '/finances' },
      { label: 'Gallery', href: '/gallery', featureFlag: 'enableGallery' },
      { label: 'Forum', href: '/forum', featureFlag: 'enableForum' },
    ],
  },
];

fs.mkdirSync(path.dirname(siteConfigPath), { recursive: true });
fs.writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, 2) + '\n', 'utf8');
console.log('✓ Updated src/data/siteConfig.json with mailerlite and navigation settings.');

// ============================================================================
// 2. UPDATE src/components/Header.astro
// ============================================================================
const headerPath = path.join(rootDir, 'src', 'components', 'Header.astro');
const headerContent = `---
import siteConfig from '../data/siteConfig.json';

const pathname = Astro.url.pathname;

const isActive = (href?: string) => {
  if (!href) return false;
  const normPath = pathname.toLowerCase();
  const normHref = href.toLowerCase();
  if (normHref === '/') return normPath === '/';
  return normPath === normHref || normPath.startsWith(normHref + '/');
};

const isGroupActive = (children?: Array<{ href?: string }>) => {
  if (!Array.isArray(children)) return false;
  return children.some((child) => isActive(child.href));
};

const defaultNavigation = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/essays' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Credits', href: '/Credits' },
  {
    label: 'Coming Soon',
    children: [
      { label: 'Map', href: '/map', featureFlag: 'enableMap' },
      { label: 'Inventory', href: '/inventory', featureFlag: 'enableInventory' },
      { label: 'Finances', href: '/finances' },
      { label: 'Gallery', href: '/gallery', featureFlag: 'enableGallery' },
      { label: 'Forum', href: '/forum', featureFlag: 'enableForum' },
    ],
  },
];

const features: Record<string, boolean> = siteConfig.features || {};
const rawNavigation =
  Array.isArray(siteConfig.navigation) && siteConfig.navigation.length > 0
    ? siteConfig.navigation
    : defaultNavigation;

const isFeatureEnabled = (flag?: string) => {
  if (!flag) return true;
  return features[flag] !== false;
};

const navItems = rawNavigation
  .filter((item: any) => isFeatureEnabled(item.featureFlag))
  .map((item: any) => {
    if (Array.isArray(item.children)) {
      return {
        ...item,
        children: item.children.filter((child: any) => isFeatureEnabled(child.featureFlag)),
      };
    }
    return item;
  })
  .filter((item: any) => !Array.isArray(item.children) || item.children.length > 0);
---

<header class="site-header">
  <a href="/" class="header-brand">
    <div class="header-logo-badge">
      <img
        src="/assets/logo.png"
        onerror="this.onerror=null;this.src='/assets/crest.png';"
        alt="Henro Stamp Crest"
      />
    </div>
    <div class="header-titles">
      <span class="header-jp">{siteConfig.siteTitleJp} ・ 同行二人</span>
      <span class="header-en">{siteConfig.siteTitleEn}</span>
    </div>
  </a>

  <nav class="site-nav" aria-label="Primary Navigation">
    {navItems.map((item: any) =>
      Array.isArray(item.children) ? (
        <div class="nav-dropdown">
          <button
            type="button"
            class={'nav-btn nav-dropdown-toggle' + (isGroupActive(item.children) ? ' active' : '')}
            aria-expanded="false"
          >
            {item.label} <span class="nav-caret">▾</span>
          </button>
          <div class="nav-dropdown-menu">
            {item.children.map((child: any) => (
              <a
                href={child.href}
                class={'nav-dropdown-item' + (isActive(child.href) ? ' active' : '')}
              >
                {child.label}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <a
          href={item.href}
          class={'nav-btn' + (isActive(item.href) ? ' active' : '')}
        >
          {item.label}
          {item.wip && <span class="wip-dot">•</span>}
        </a>
      )
    )}
    <a
      href="/donate"
      class={'nav-btn donate-btn' + (isActive('/donate') ? ' active' : '')}
    >
      Donate 印
    </a>
  </nav>
</header>

<script is:inline>
  (function() {
    let lastScroll = 0;
    const header = document.querySelector('header.site-header');

    if (header) {
      window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll <= 0) {
          header.classList.remove('is-hidden');
          lastScroll = currentScroll;
          return;
        }

        if (currentScroll > lastScroll && currentScroll > 50) {
          header.classList.add('is-hidden');
        } else if (currentScroll < lastScroll) {
          header.classList.remove('is-hidden');
        }

        lastScroll = currentScroll;
      }, { passive: true });
    }

    const dropdowns = document.querySelectorAll('.nav-dropdown');

    function closeAllDropdowns(exceptDropdown) {
      dropdowns.forEach((dropdown) => {
        if (dropdown !== exceptDropdown) {
          dropdown.classList.remove('open');
          const btn = dropdown.querySelector('.nav-dropdown-toggle');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    dropdowns.forEach((dropdown) => {
      const toggleBtn = dropdown.querySelector('.nav-dropdown-toggle');
      if (!toggleBtn) return;

      toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        closeAllDropdowns(dropdown);
        dropdown.classList.toggle('open', !isOpen);
        toggleBtn.setAttribute('aria-expanded', String(!isOpen));
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.nav-dropdown')) {
        closeAllDropdowns(null);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAllDropdowns(null);
      }
    });
  })();
</script>
`;

fs.mkdirSync(path.dirname(headerPath), { recursive: true });
fs.writeFileSync(headerPath, headerContent, 'utf8');
console.log('✓ Updated src/components/Header.astro with configurable dropdown navigation.');

// ============================================================================
// 3. UPDATE src/pages/index.astro
// ============================================================================
const indexPath = path.join(rootDir, 'src', 'pages', 'index.astro');
const indexContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import siteConfig from '../data/siteConfig.json';
import { getCollection } from 'astro:content';

const allEssays = await getCollection('essays', ({ data }) => !data.draft);
const sortedEssays = allEssays.sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
);
const recentEssays = sortedEssays.slice(0, 4);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
---

<BaseLayout title={\`\${siteConfig.siteTitleJp} | \${siteConfig.siteTitleEn}\`} description={siteConfig.tagline}>
  <div class="scroll-title-block">
    <img
      src={siteConfig.crestImage}
      style="width:88px; height:88px; mix-blend-mode:multiply; margin: 0 auto 10px; object-fit:contain;"
      alt="Henro Stamp"
    />
    <div class="scroll-eyebrow">{siteConfig.routeSummary}</div>
    <h1 class="page-heading">{siteConfig.siteTitleEn}</h1>
    <div class="page-subtitle">{siteConfig.tagline}</div>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">哲学の道 • THE PILGRIM'S MANIFESTO</div>
    <div class="line"></div>
  </div>

  <div class="essay-prose">
    <blockquote>
      "A boy and a hat set out on a journey to cross a continent and discover a world(view) where money, jobs and human society are simply another part of Nature.<br/>
      We have never left Nature — we've merely forgotten that everything is, inevitably, Nature. ☯️<br/>
      For the hat, a homecoming — its very own Odyssey.<br/>
      For the boy, a rite of initiation, and the beginning of a journey into manhood."
    </blockquote>

    <p>
      Modern life surrounds us with financial instruments, insurance policies, and digital vaults—yet anxiety over basic survival remains sharper than ever. <strong>Camino Henro</strong> is a cross-continental philosophical pilgrimage on foot from Finisterra, Spain to Shikoku, Japan, investigating a single foundational question: <em>What is the true philosophical foundation for building a sense of material security in life?</em>
    </p>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">随筆 • LATEST PHILOSOPHICAL ESSAYS</div>
    <div class="line"></div>
  </div>

  <div>
    {recentEssays.map((essay, idx) => (
      <a href={\`/essays/\${essay.slug}\`} class="stream-item">
        <div class="stream-meta">
          Essay No. {String(sortedEssays.length - idx).padStart(2, '0')}  •  {essay.data.location}  •  {essay.data.readingTime || formatDate(essay.data.date)}
        </div>
        <div class="stream-title">{essay.data.title}</div>
        <div class="stream-excerpt">{essay.data.excerpt}</div>
        <span class="stream-read-link">Unroll Essay Scroll ➔</span>
      </a>
    ))}
  </div>

  <div style="text-align:center; margin-top:36px;">
    <a href="/essays" class="ink-action-btn">
      View Full Essay Archive (/essays) ➔
    </a>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">広場 • FROM THE PILGRIM'S COURTYARD</div>
    <div class="line"></div>
  </div>

  <section
    id="home-forum-spotlight"
    class="forum-spotlight-section"
    data-supabase-url={siteConfig.supabase?.url || ''}
    data-supabase-key={siteConfig.supabase?.anonKey || ''}
  >
    <div class="spotlight-header-bar">
      <span class="spotlight-label">COMMUNITY DIALOGUE SPOTLIGHT</span>
      <div class="spotlight-toggle-group" role="tablist" aria-label="Forum Spotlight Mode">
        <button
          type="button"
          class="spotlight-toggle-pill active"
          data-spotlight-mode="popular"
          role="tab"
          aria-selected="true"
        >
          ★ Most Popular
        </button>
        <button
          type="button"
          class="spotlight-toggle-pill"
          data-spotlight-mode="latest"
          role="tab"
          aria-selected="false"
        >
          ✦ Latest Inquiry
        </button>
      </div>
    </div>

    <a href="/forum" id="spotlight-thread-card" class="spotlight-thread-card">
      <div class="spotlight-meta">
        <span class="spotlight-category-badge" id="spotlight-category">Philosophy &amp; Ethos</span>
        <span class="spotlight-meta-sep">•</span>
        <span id="spotlight-author">Steppenwolf</span>
        <span class="spotlight-meta-sep">•</span>
        <span id="spotlight-date">Oct 2026</span>
        <span class="spotlight-meta-sep">•</span>
        <span id="spotlight-replies">14 Replies</span>
      </div>
      <h3 class="spotlight-title" id="spotlight-title">
        On Sufficiency vs. Surplus: Where Does Preparation End and Fear Begin?
      </h3>
      <p class="spotlight-excerpt" id="spotlight-excerpt">
        When walking across a continent with everything on your back, every extra ounce is a physical confession of a fear you have not yet made peace with. How do we distinguish wise stewardship from anxiety?
      </p>
      <span class="stream-read-link">Enter the Pilgrim's Courtyard (/forum) ➔</span>
    </a>
  </section>

  <script is:inline>
    (function () {
      const container = document.getElementById('home-forum-spotlight');
      if (!container) return;

      const supabaseUrl = (container.getAttribute('data-supabase-url') || '').trim();
      const supabaseKey = (container.getAttribute('data-supabase-key') || '').trim();

      const categoryEl = document.getElementById('spotlight-category');
      const authorEl = document.getElementById('spotlight-author');
      const dateEl = document.getElementById('spotlight-date');
      const repliesEl = document.getElementById('spotlight-replies');
      const titleEl = document.getElementById('spotlight-title');
      const excerptEl = document.getElementById('spotlight-excerpt');
      const cardEl = document.getElementById('spotlight-thread-card');
      const toggleButtons = container.querySelectorAll('[data-spotlight-mode]');

      const fallbackThreads = {
        popular: {
          id: '',
          category: 'Philosophy & Ethos',
          author_name: 'Steppenwolf',
          created_at: '2026-10-18T10:00:00Z',
          reply_count: 14,
          title: 'On Sufficiency vs. Surplus: Where Does Preparation End and Fear Begin?',
          content:
            'When walking across a continent with everything on your back, every extra ounce is a physical confession of a fear you have not yet made peace with. How do we distinguish wise stewardship from anxiety?',
        },
        latest: {
          id: '',
          category: 'Trail Craft & Gear',
          author_name: 'Kūkai_Walker',
          created_at: '2026-10-27T18:30:00Z',
          reply_count: 5,
          title: 'On Sufficiency vs. Surplus: Footcare and Cold-Weather Layering Past the Pyrenees',
          content:
            'As the autumn frost settles over the stone paths, what minimalist wool and rain shell combinations have proven resilient without burdening the pack beyond six kilograms?',
        },
      };

      function formatShortDate(rawDate) {
        if (!rawDate) return 'Recent';
        const parsed = new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) return 'Recent';
        return parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
      }

      function truncateExcerpt(text) {
        const clean = String(text || '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (clean.length <= 200) return clean;
        return clean.slice(0, 197).trimEnd() + '...';
      }

      function renderThread(thread) {
        const category = thread.category || thread.topic || 'Courtyard Dialogue';
        const author = thread.author_name || thread.author || 'Anonymous Pilgrim';
        const dateText = formatShortDate(thread.created_at || thread.date);
        const replies = Number(thread.reply_count ?? thread.replies_count ?? 0);
        const title =
          thread.title ||
          'On Sufficiency vs. Surplus: Where Does Preparation End and Fear Begin?';
        const rawBody =
          thread.content ||
          thread.body ||
          thread.excerpt ||
          fallbackThreads.popular.content;

        if (categoryEl) categoryEl.textContent = category;
        if (authorEl) authorEl.textContent = author;
        if (dateEl) dateEl.textContent = dateText;
        if (repliesEl) {
          repliesEl.textContent = replies === 1 ? '1 Reply' : replies + ' Replies';
        }
        if (titleEl) titleEl.textContent = title;
        if (excerptEl) excerptEl.textContent = truncateExcerpt(rawBody);
        if (cardEl) {
          cardEl.setAttribute(
            'href',
            thread.id ? '/forum?thread=' + encodeURIComponent(thread.id) : '/forum'
          );
        }
      }

      async function loadSpotlight(mode) {
        const fallback = fallbackThreads[mode] || fallbackThreads.popular;

        if (
          !supabaseUrl ||
          !supabaseKey ||
          supabaseUrl.includes('YOUR_') ||
          supabaseKey.includes('YOUR_')
        ) {
          renderThread(fallback);
          return;
        }

        const orderQuery =
          mode === 'latest'
            ? 'created_at.desc'
            : 'reply_count.desc.nullslast,created_at.desc';

        const endpoints = [
          supabaseUrl.replace(/\\/$/, '') +
            '/rest/v1/forum_threads?select=*&order=' +
            encodeURIComponent(orderQuery) +
            '&limit=1',
          supabaseUrl.replace(/\\/$/, '') +
            '/rest/v1/threads?select=*&order=' +
            encodeURIComponent(orderQuery) +
            '&limit=1',
        ];

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              headers: {
                apikey: supabaseKey,
                Authorization: 'Bearer ' + supabaseKey,
                Accept: 'application/json',
              },
            });

            if (!response.ok) continue;

            const rows = await response.json();
            if (Array.isArray(rows) && rows.length > 0 && rows[0]) {
              renderThread(rows[0]);
              return;
            }
          } catch (_err) {
            // Fall through to next endpoint or static fallback
          }
        }

        renderThread(fallback);
      }

      toggleButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-spotlight-mode') || 'popular';
          toggleButtons.forEach((other) => {
            const active = other === btn;
            other.classList.toggle('active', active);
            other.setAttribute('aria-selected', String(active));
          });
          loadSpotlight(mode);
        });
      });

      loadSpotlight('popular');
    })();
  </script>
</BaseLayout>
`;

fs.mkdirSync(path.dirname(indexPath), { recursive: true });
fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✓ Updated src/pages/index.astro with Home Page Forum Spotlight.');

// ============================================================================
// 4. UPDATE src/layouts/BaseLayout.astro
// ============================================================================
const baseLayoutPath = path.join(rootDir, 'src', 'layouts', 'BaseLayout.astro');

if (fs.existsSync(baseLayoutPath)) {
  let baseLayoutContent = fs.readFileSync(baseLayoutPath, 'utf8');

  const newsletterRevealStageHtml = `<!-- THE SURPRISE REVEAL AT THE BOTTOM OF EVERY PAGE -->
    <div class="apple-reveal-stage">
      <div class="spacer-for-apple"></div>
      <div
        class="global-newsletter-box"
        id="global-newsletter-box"
        data-form-action={siteConfig.mailerlite?.formActionUrl || ''}
      >
        <div class="newsletter-eyebrow">書簡 • DISPATCHES</div>
        <h2 class="newsletter-heading">Pilgrimage Newsletter</h2>
        <p class="newsletter-copy">
          No noise, no algorithms—only a quiet note in your inbox whenever a new dispatch is written from the trail. Sent via MailerLite.
        </p>
        <form
          class="newsletter-form"
          id="global-newsletter-form"
          action={siteConfig.mailerlite?.formActionUrl || '#'}
          method="post"
          novalidate
        >
          <input
            type="email"
            name="fields[email]"
            class="newsletter-input"
            placeholder="Enter your email address..."
            required
            aria-label="Email Address"
          />
          <div style="position:absolute; left:-5000px;" aria-hidden="true">
            <input
              type="text"
              name="confirm_email_honeypot"
              tabindex="-1"
              value=""
              autocomplete="off"
            />
          </div>
          <input type="hidden" name="ml-submit" value="1" />
          <input type="hidden" name="anticsrf" value="true" />
          <button type="submit" class="newsletter-submit-btn">
            Subscribe to Dispatches 印
          </button>
        </form>
        <div
          class="newsletter-response-msg"
          id="global-newsletter-msg"
          role="status"
          aria-live="polite"
          hidden
        ></div>
      </div>
    </div>`;

  // Replace existing .apple-reveal-stage block (whether original or previously updated)
  const revealStageRegex =
    /<!-- THE SURPRISE REVEAL AT THE BOTTOM OF EVERY PAGE -->[\s\S]*?<\/div>\s*<\/div>(?:\s*<\/div>)?/;

  if (revealStageRegex.test(baseLayoutContent)) {
    // Carefully replace from the comment up to just before the dimmer script
    baseLayoutContent = baseLayoutContent.replace(
      /<!-- THE SURPRISE REVEAL AT THE BOTTOM OF EVERY PAGE -->[\s\S]*?(?=<script is:inline>\s*\/\/ Gently brighten the road)/,
      newsletterRevealStageHtml + '\n\n    '
    );
  }

  const mailerliteScriptBlock = `<!-- STEP13_MAILERLITE_SCRIPT_START -->
    <script is:inline>
      (function () {
        const form = document.getElementById('global-newsletter-form');
        const box = document.getElementById('global-newsletter-box');
        const msgEl = document.getElementById('global-newsletter-msg');

        if (!form || !box || !msgEl) return;

        form.addEventListener('submit', async function (event) {
          event.preventDefault();

          const honeypot = form.querySelector('input[name="confirm_email_honeypot"]');
          if (honeypot && honeypot.value) {
            return;
          }

          const emailInput = form.querySelector('input[name="fields[email]"]');
          const email = emailInput ? emailInput.value.trim() : '';

          if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
            msgEl.hidden = false;
            msgEl.className = 'newsletter-response-msg is-error';
            msgEl.textContent = 'Please enter a valid email address.';
            return;
          }

          const formActionUrl = (box.getAttribute('data-form-action') || '').trim();
          const submitBtn = form.querySelector('.newsletter-submit-btn');
          if (submitBtn) submitBtn.disabled = true;

          const isConfigured =
            formActionUrl &&
            !formActionUrl.includes('YOUR_ACCOUNT_ID') &&
            !formActionUrl.includes('YOUR_FORM_ID') &&
            formActionUrl !== '#';

          if (isConfigured) {
            try {
              const formData = new FormData(form);
              await fetch(formActionUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors',
              });
              form.reset();
              msgEl.hidden = false;
              msgEl.className = 'newsletter-response-msg is-success';
              msgEl.textContent =
                '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm.';
            } catch (_err) {
              msgEl.hidden = false;
              msgEl.className = 'newsletter-response-msg is-error';
              msgEl.textContent =
                'Unable to reach the dispatch ledger right now. Please try again shortly.';
            } finally {
              if (submitBtn) submitBtn.disabled = false;
            }
          } else {
            form.reset();
            if (submitBtn) submitBtn.disabled = false;
            msgEl.hidden = false;
            msgEl.className = 'newsletter-response-msg is-success';
            msgEl.textContent =
              '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm. (Local Preview Mode: To enable live subscriptions, paste your MailerLite Form Action URL into "mailerlite.formActionUrl" inside src/data/siteConfig.json.)';
          }
        });
      })();
    </script>
    <!-- STEP13_MAILERLITE_SCRIPT_END -->`;

  if (baseLayoutContent.includes('<!-- STEP13_MAILERLITE_SCRIPT_START -->')) {
    baseLayoutContent = baseLayoutContent.replace(
      /<!-- STEP13_MAILERLITE_SCRIPT_START -->[\s\S]*?<!-- STEP13_MAILERLITE_SCRIPT_END -->/,
      mailerliteScriptBlock
    );
  } else {
    baseLayoutContent = baseLayoutContent.replace(
      /<\/body>/i,
      `  ${mailerliteScriptBlock}\n  </body>`
    );
  }

  fs.writeFileSync(baseLayoutPath, baseLayoutContent, 'utf8');
  console.log('✓ Updated src/layouts/BaseLayout.astro with Washi MailerLite Newsletter Footer.');
}

// ============================================================================
// 5. UPDATE src/styles/global.css
// ============================================================================
const globalCssPath = path.join(rootDir, 'src', 'styles', 'global.css');

if (fs.existsSync(globalCssPath)) {
  let globalCss = fs.readFileSync(globalCssPath, 'utf8');

  const step13CssBlock = `/* STEP13_HEADER_SPOTLIGHT_NEWSLETTER_START */
:root {
  --ink-primary: #1C1A17;
}

/* 1. Configurable Header Dropdown Menu */
.nav-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.nav-dropdown-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.nav-caret {
  font-size: 0.68rem;
  line-height: 1;
  transition: transform 0.2s ease;
}

.nav-dropdown:hover .nav-caret,
.nav-dropdown.open .nav-caret {
  transform: rotate(180deg);
}

.nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 176px;
  padding: 6px 0;
  background: rgba(10, 12, 16, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(230, 223, 207, 0.2);
  border-top: 2px solid var(--accent-crimson);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
  z-index: 150;
}

.nav-dropdown::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 10px;
}

.nav-dropdown:hover .nav-dropdown-menu,
.nav-dropdown.open .nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.nav-dropdown-item {
  display: block;
  padding: 9px 16px;
  color: var(--header-muted);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.74rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.nav-dropdown-item:hover {
  color: var(--header-text);
  background: rgba(230, 223, 207, 0.06);
  border-left-color: rgba(110, 43, 37, 0.65);
}

.nav-dropdown-item.active {
  color: var(--header-text);
  background: rgba(110, 43, 37, 0.18);
  border-left-color: var(--accent-crimson);
}

/* 2. Home Page Forum Spotlight */
.forum-spotlight-section {
  margin-top: 8px;
}

.spotlight-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.spotlight-label {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.spotlight-toggle-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.spotlight-toggle-pill {
  background: rgba(28, 26, 23, 0.05);
  border: 1px solid rgba(28, 26, 23, 0.2);
  color: var(--ink-muted);
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  padding: 5px 11px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.spotlight-toggle-pill:hover {
  color: var(--ink-sumi);
  border-color: var(--accent-crimson);
}

.spotlight-toggle-pill.active {
  background: var(--accent-crimson);
  border-color: var(--accent-crimson);
  color: #F4F1EA;
}

.spotlight-thread-card {
  display: block;
  background: rgba(216, 206, 184, 0.45);
  border: 1px solid rgba(28, 26, 23, 0.22);
  border-left: 3px solid var(--accent-crimson);
  padding: 24px 26px;
  text-decoration: none;
  color: var(--ink-sumi);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.spotlight-thread-card:hover {
  background: rgba(216, 206, 184, 0.68);
  box-shadow: 0 6px 20px rgba(28, 26, 23, 0.08);
}

.spotlight-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.71rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-bottom: 10px;
}

.spotlight-category-badge {
  background: rgba(110, 43, 37, 0.12);
  border: 1px solid rgba(110, 43, 37, 0.35);
  color: var(--accent-crimson);
  padding: 2px 8px;
  border-radius: 2px;
  font-weight: 500;
}

.spotlight-meta-sep {
  opacity: 0.55;
}

.spotlight-title {
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 1.4rem;
  font-weight: normal;
  line-height: 1.35;
  color: var(--ink-sumi);
  margin: 0 0 10px;
}

.spotlight-excerpt {
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--ink-muted);
  margin: 0 0 14px;
}

/* 3. Global Washi Newsletter Footer Outside the Scroll */
.apple-reveal-stage {
  height: auto;
  min-height: 82vh;
  padding-left: 16px;
  padding-right: 16px;
  box-sizing: border-box;
  pointer-events: auto;
}

.spacer-for-apple {
  width: 100%;
  height: 55vh;
  min-height: 400px;
  pointer-events: none;
}

.global-newsletter-box {
  width: 100%;
  max-width: 480px;
  margin: 0 auto 40px;
  padding: 32px;
  background: rgba(216, 206, 184, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(28, 26, 23, 0.2);
  border-radius: 4px;
  text-align: center;
  color: var(--ink-primary);
  box-sizing: border-box;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65);
  pointer-events: auto;
}

.newsletter-eyebrow {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent-crimson);
  margin-bottom: 6px;
}

.newsletter-heading {
  font-family: 'Cormorant Garamond', 'EB Garamond', Georgia, serif;
  font-size: 1.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink-primary);
  margin: 0 0 10px;
}

.newsletter-copy {
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 0.98rem;
  line-height: 1.65;
  color: var(--ink-sumi);
  margin: 0 0 20px;
}

.newsletter-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.newsletter-input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  background: rgba(244, 241, 234, 0.85);
  border: 1px solid rgba(28, 26, 23, 0.28);
  border-radius: 2px;
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 1rem;
  color: var(--ink-primary);
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.newsletter-input::placeholder {
  color: var(--ink-muted);
}

.newsletter-input:focus {
  border-color: var(--accent-crimson);
  background: #F4F1EA;
}

.newsletter-submit-btn {
  width: 100%;
  padding: 11px 20px;
  background: var(--accent-crimson);
  color: #F4F1EA;
  border: 1px solid var(--accent-crimson);
  border-radius: 2px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.newsletter-submit-btn:hover {
  filter: brightness(1.12);
}

.newsletter-submit-btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.newsletter-response-msg {
  margin-top: 14px;
  padding: 10px 12px;
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 0.94rem;
  line-height: 1.55;
  border-radius: 2px;
}

.newsletter-response-msg.is-success {
  background: rgba(28, 26, 23, 0.08);
  border-left: 3px solid var(--accent-crimson);
  color: var(--ink-primary);
}

.newsletter-response-msg.is-error {
  background: rgba(110, 43, 37, 0.14);
  border-left: 3px solid var(--accent-crimson);
  color: var(--accent-crimson);
}
/* STEP13_HEADER_SPOTLIGHT_NEWSLETTER_END */`;

  if (globalCss.includes('/* STEP13_HEADER_SPOTLIGHT_NEWSLETTER_START */')) {
    globalCss = globalCss.replace(
      /\/\* STEP13_HEADER_SPOTLIGHT_NEWSLETTER_START \*\/[\s\S]*?\/\* STEP13_HEADER_SPOTLIGHT_NEWSLETTER_END \*\//,
      step13CssBlock
    );
  } else {
    globalCss = globalCss.trimEnd() + '\n\n' + step13CssBlock + '\n';
  }

  fs.writeFileSync(globalCssPath, globalCss, 'utf8');
  console.log('✓ Updated src/styles/global.css with dropdown, spotlight, and newsletter styles.');
}

console.log('\n🎉 Step 13 upgrades applied successfully!');