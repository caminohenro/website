import fs from 'node:fs';
import path from 'node:path';

const files = {
  'src/styles/global.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-outer-obsidian: #08090C;
  --bg-header: rgba(10, 12, 16, 0.88);
  --bg-washi-scroll: #E6DFCF;
  --bg-washi-subtle: rgba(28, 26, 23, 0.04);
  --ink-sumi: #1C1A17;
  --ink-muted: #5A534A;
  --header-text: #E6DFCF;
  --header-muted: #A09A8E;
  --accent-indigo: #0A367E;
  --accent-crimson: #6E2B25;
  --border-ink: rgba(28, 26, 23, 0.15);
  --color-washi: #E6DFCF;
  --color-washi-dark: #D8CEB8;
  --color-sumi: #1C1A17;
  --color-sumi-muted: #5A534A;
  --color-crimson: #6E2B25;
  --color-crimson-light: #8C3B33;
}

html {
  background-color: var(--bg-outer-obsidian);
  color: var(--ink-sumi);
  font-family: 'EB Garamond', Georgia, 'Yu Mincho', serif;
  scroll-behavior: smooth;
}

body {
  background-color: var(--bg-outer-obsidian);
  color: var(--ink-sumi);
  font-family: 'EB Garamond', Georgia, 'Yu Mincho', serif;
  line-height: 1.85;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ==========================================================================
   LAYER 1: STATIC BACKGROUND (The Road & Hidden Apple)
   ========================================================================== */
.fixed-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center 84%;
  background-repeat: no-repeat;
  pointer-events: none;
}

.backdrop-dimmer {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
    circle at 50% 72%,
    rgba(8, 9, 12, var(--center-dim, 0.58)) 0%,
    rgba(8, 9, 12, var(--edge-dim, 0.84)) 100%
  );
  transition: background 0.35s ease;
  pointer-events: none;
}

/* ==========================================================================
   PERSISTENT WEBSITE HEADER (Outside the Scroll)
   ========================================================================== */
header.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-header);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(230, 223, 207, 0.16);
  padding: 12px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  text-decoration: none;
}

.header-logo-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-washi-scroll);
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  transition: all 0.25s ease;
}

.header-logo-badge img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.header-titles {
  display: flex;
  flex-direction: column;
}

.header-jp {
  font-size: 0.72rem;
  letter-spacing: 0.25em;
  color: var(--header-muted);
  line-height: 1.3;
}

.header-en {
  font-size: 1.2rem;
  letter-spacing: 0.14em;
  color: var(--header-text);
  font-weight: normal;
  line-height: 1.2;
}

nav.site-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--header-muted);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.76rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  padding: 7px 11px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  text-decoration: none;
}

.nav-btn:hover {
  color: var(--header-text);
}

.nav-btn.active {
  color: var(--header-text);
  border-bottom: 2px solid var(--accent-crimson);
}

.nav-btn.donate-btn {
  background: var(--accent-crimson);
  color: #F4F1EA;
  padding: 7px 15px;
  margin-left: 8px;
  border-radius: 2px;
  border-bottom: none;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.nav-btn.donate-btn:hover {
  filter: brightness(1.12);
  color: #F4F1EA;
}

/* ==========================================================================
   LAYER 2: SEPARATE PAGE SCROLL & WOODEN ROLLERS
   ========================================================================== */
.scroll-stage {
  position: relative;
  z-index: 10;
  width: 100%;
  padding-top: 28px;
  margin-bottom: 10vh;
}

.scroll-roller-top,
.scroll-roller-bottom {
  max-width: 776px;
  width: 96vw;
  height: 20px;
  margin: 0 auto;
  background: linear-gradient(180deg, #3A2618 0%, #1F130B 55%, #0F0905 100%);
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.9);
  position: relative;
  z-index: 12;
}

.scroll-roller-top::before,
.scroll-roller-top::after,
.scroll-roller-bottom::before,
.scroll-roller-bottom::after {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 14px;
  background: linear-gradient(180deg, #9C7A44, #59411E);
  border-radius: 3px;
}

.scroll-roller-top::before,
.scroll-roller-bottom::before {
  left: 0;
}

.scroll-roller-top::after,
.scroll-roller-bottom::after {
  right: 0;
}

.washi-scroll {
  max-width: 740px;
  width: 92vw;
  margin: 0 auto;
  background-color: var(--bg-washi-scroll);
  background-image:
    linear-gradient(90deg, rgba(160, 145, 118, 0.28) 0%, transparent 6%, transparent 94%, rgba(160, 145, 118, 0.28) 100%),
    repeating-linear-gradient(0deg, rgba(28, 26, 23, 0.015) 0px, rgba(28, 26, 23, 0.015) 1px, transparent 1px, transparent 3px);
  box-shadow:
    0 20px 70px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(28, 26, 23, 0.25);
  padding: 52px 64px 64px;
  min-height: 72vh;
  position: relative;
  animation: unfurl 0.28s ease-out;
}

@keyframes unfurl {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 680px) {
  header.site-header { padding: 10px 16px; }
  .washi-scroll { padding: 36px 24px 48px; }
}

/* ==========================================================================
   TYPOGRAPHY & CONTAINERLESS DIVIDERS INSIDE EACH SCROLL
   ========================================================================== */
.scroll-title-block {
  text-align: center;
  margin-bottom: 36px;
}

.scroll-eyebrow {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.73rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent-crimson);
  margin-bottom: 8px;
}

h1.page-heading {
  font-size: 2rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  color: var(--ink-sumi);
  line-height: 1.3;
  margin-bottom: 8px;
}

.page-subtitle {
  font-style: italic;
  font-size: 0.96rem;
  color: var(--ink-muted);
}

.page-break {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin: 44px 0;
}

.page-break .line {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, transparent, var(--accent-crimson), transparent);
  opacity: 0.55;
}

.page-break .kanji {
  font-size: 0.85rem;
  letter-spacing: 0.26em;
  color: var(--accent-crimson);
  text-transform: uppercase;
}

.stream-item {
  display: block;
  padding: 22px 12px;
  border-bottom: 1px solid var(--border-ink);
  text-decoration: none;
  transition: background 0.2s;
}

.stream-item:hover {
  background: var(--bg-washi-subtle);
}

.stream-item:last-child {
  border-bottom: none;
}

.stream-meta {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  color: var(--accent-crimson);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stream-title {
  font-size: 1.32rem;
  color: var(--ink-sumi);
  margin-bottom: 6px;
  font-weight: normal;
}

.stream-excerpt {
  font-size: 0.98rem;
  color: var(--ink-muted);
  margin-bottom: 8px;
}

.stream-read-link {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-crimson);
  font-weight: 600;
}

.ink-action-btn {
  display: inline-block;
  background: transparent;
  border: 1px solid var(--accent-crimson);
  color: var(--accent-crimson);
  padding: 10px 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.ink-action-btn:hover {
  background: var(--accent-crimson);
  color: #F4F1EA;
}

.scroll-foot-hint {
  text-align: center;
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--border-ink);
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: var(--ink-muted);
  text-transform: uppercase;
}

/* ==========================================================================
   BOTTOM SURPRISE REVEAL CAPTION (Below the wooden roller on every page)
   ========================================================================== */
.apple-reveal-stage {
  position: relative;
  z-index: 5;
  height: 82vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 6vh;
  pointer-events: none;
}

.apple-whisper {
  font-family: 'EB Garamond', Georgia, serif;
  color: #F4F1EA;
  text-align: center;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.95);
  background: rgba(8, 9, 12, 0.6);
  padding: 12px 28px;
  border-top: 1px solid rgba(244, 241, 234, 0.25);
  border-bottom: 1px solid rgba(244, 241, 234, 0.25);
  letter-spacing: 0.14em;
  font-size: 0.95rem;
}

/* Editorial Essay Typography */
.essay-prose {
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 1.1rem;
  line-height: 1.85;
  color: var(--ink-sumi);
}

.essay-prose p {
  margin-top: 0;
  margin-bottom: 22px;
  text-align: justify;
}

.essay-prose > p:first-of-type::first-letter {
  float: left;
  font-size: 3.3rem;
  line-height: 0.82;
  padding-top: 4px;
  padding-right: 12px;
  color: var(--accent-crimson);
}

.essay-prose blockquote {
  margin: 30px 0;
  padding-left: 20px;
  border-left: 2px solid var(--accent-crimson);
  font-style: italic;
  font-size: 1.12rem;
  color: var(--ink-sumi);
}
`,

  'src/components/Header.astro': `---
import siteConfig from '../data/siteConfig.json';

const pathname = Astro.url.pathname;

const isActive = (href: string) => {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
};

const navLinks = [
  { label: 'Home', href: '/', show: true },
  { label: 'Essays (Blog)', href: '/essays', show: true },
  { label: 'Finances', href: '/finances', show: true },
  { label: 'FAQ', href: '/faq', show: true },
  { label: 'Credits', href: '/credits', show: true },
  { label: 'Map', href: '/map', show: siteConfig.features?.enableMap === true },
  { label: 'Inventory', href: '/inventory', show: siteConfig.features?.enableInventory === true },
  { label: 'Forum', href: '/forum', show: siteConfig.features?.enableForum === true },
].filter((item) => item.show);
---

<header class="site-header">
  <a href="/" class="header-brand">
    <div class="header-logo-badge">
      <img src={siteConfig.crestImage} alt="Henro Stamp Crest" />
    </div>
    <div class="header-titles">
      <span class="header-jp">{siteConfig.siteTitleJp} ・ 同行二人</span>
      <span class="header-en">{siteConfig.siteTitleEn}</span>
    </div>
  </a>

  <nav class="site-nav" aria-label="Primary Navigation">
    {navLinks.map((link) => (
      <a
        href={link.href}
        class={'nav-btn' + (isActive(link.href) ? ' active' : '')}
      >
        {link.label}
      </a>
    ))}
    <a href="/donate" class="nav-btn donate-btn">
      Donate 印
    </a>
  </nav>
</header>
`,

  'src/components/Footer.astro': `---
---
<div class="scroll-foot-hint">
  ↓ Scroll down past the bottom roller to reveal the road beneath ↓
</div>
`,

  'src/layouts/BaseLayout.astro': `---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import siteConfig from '../data/siteConfig.json';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
}

const {
  title = siteConfig.siteTitleJp + ' | ' + siteConfig.siteTitleEn,
  description = siteConfig.tagline,
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href={siteConfig.crestImage} />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+JP:wght@400;600&family=Shippori+Mincho:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="selection:bg-[#6E2B25] selection:text-[#E6DFCF]">
    <!-- LAYER 1: Fixed Road & Apple Background -->
    <div
      class="fixed-backdrop"
      style="background-image: url('/assets/apple-bg.jpeg'), url('/assets/apple-bg.svg');"
    ></div>
    <div class="backdrop-dimmer" id="dimmer"></div>

    <!-- PERSISTENT WEBSITE HEADER (Outside the Scroll) -->
    <Header />

    <!-- LAYER 2: THE INDIVIDUAL PAGE SCROLL WITH WOODEN ROLLERS -->
    <div class="scroll-stage">
      <div class="scroll-roller-top"></div>
      <main class="washi-scroll">
        <slot />
        <Footer />
      </main>
      <div class="scroll-roller-bottom"></div>
    </div>

    <!-- THE SURPRISE REVEAL AT THE BOTTOM OF EVERY PAGE -->
    <div class="apple-reveal-stage" aria-hidden="true">
      <div class="apple-whisper">
        お接待 • <em>Osettai</em> — The simplest gift of the road is enough.
      </div>
    </div>

    <script is:inline>
      // Gently brighten the road & apple as the user scrolls past the bottom roller
      window.addEventListener('scroll', function () {
        const dimmer = document.getElementById('dimmer');
        if (!dimmer) return;
        const scrollBottom = window.scrollY + window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const revealProgress = Math.max(0, Math.min(1, (scrollBottom - (docHeight - window.innerHeight * 0.85)) / (window.innerHeight * 0.6)));
        const centerAlpha = (0.58 - revealProgress * 0.48).toFixed(2);
        const edgeAlpha = (0.84 - revealProgress * 0.35).toFixed(2);
        dimmer.style.setProperty('--center-dim', centerAlpha);
        dimmer.style.setProperty('--edge-dim', edgeAlpha);
      });
    </script>
  </body>
</html>
`,

  'src/pages/index.astro': `---
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
      style="width:76px; height:76px; mix-blend-mode:multiply; margin: 0 auto 10px; object-fit:contain;"
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
</BaseLayout>
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated: ' + relativePath);
}

console.log('\\nDesign updated! Refresh http://localhost:4321 to see the persistent header, wooden scroll rollers, and updated Home scroll.');