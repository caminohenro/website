import fs from 'node:fs';
import path from 'node:path';

const files = {
  'src/styles/global.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-washi: #E6DFCF;
  --color-washi-dark: #D8CEB8;
  --color-sumi: #1C1A17;
  --color-sumi-muted: #524D46;
  --color-crimson: #6E2B25;
  --color-crimson-light: #8C3B33;
}

html {
  background-color: #141210;
  color: var(--color-sumi);
  font-family: 'EB Garamond', Georgia, serif;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background-color: transparent;
  color: var(--color-sumi);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Layer 1: Stationary Background Landscape */
.fixed-landscape {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
}

.fixed-landscape-overlay {
  position: absolute;
  inset: 0;
  background: rgba(28, 26, 23, 0.22);
}

/* Layer 2: Central Tactile Washi Scroll Column */
.washi-scroll-column {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 46rem;
  margin: 0 auto;
  background-color: #E6DFCF;
  color: #1C1A17;
  border-left: 1px solid rgba(28, 26, 23, 0.18);
  border-right: 1px solid rgba(28, 26, 23, 0.18);
  border-radius: 0;
  box-shadow: none;
}

.washi-scroll-column::before {
  content: "";
  pointer-events: none;
  opacity: 0.04;
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='washiNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23washiNoise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 180px;
}

.washi-scroll-column > * {
  position: relative;
  z-index: 1;
}

/* Layer 3: Bottom Reveal Window for the Centered Road Apple */
.apple-reveal-window {
  height: 90vh;
  width: 100%;
  background: transparent;
  pointer-events: none;
  position: relative;
  z-index: 1;
}

/* Editorial Essay Typography */
.essay-prose {
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 1.125rem;
  line-height: 1.85;
  color: var(--color-sumi);
}

@media (min-width: 768px) {
  .essay-prose {
    font-size: 1.2rem;
  }
}

.essay-prose p {
  margin-top: 0;
  margin-bottom: 1.65em;
}

.essay-prose > p:first-of-type {
  @apply first-letter:float-left first-letter:text-5xl first-letter:font-heading first-letter:text-[#6E2B25] first-letter:pr-3 first-letter:leading-none;
}

.essay-prose > p:first-of-type::first-letter {
  float: left;
  font-size: 3rem;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  color: #6E2B25;
  padding-right: 0.75rem;
  padding-top: 0.15rem;
  line-height: 1;
}

.essay-prose blockquote {
  margin: 2.25rem 0;
  padding: 0.25rem 0 0.25rem 1.25rem;
  border-left: 2px solid #6E2B25;
  color: #524D46;
  font-style: italic;
}

.essay-prose blockquote p:last-child {
  margin-bottom: 0;
}

.essay-prose h2,
.essay-prose h3 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #1C1A17;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

.essay-prose h2 {
  font-size: 1.65rem;
}

.essay-prose h3 {
  font-size: 1.35rem;
}

.essay-prose a {
  color: #6E2B25;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.essay-prose a:hover {
  color: #8C3B33;
}

.essay-prose hr {
  border: 0;
  border-top: 1px solid rgba(110, 43, 37, 0.3);
  margin: 2.5rem auto;
  width: 6rem;
}
`,

  'src/components/Header.astro': `---
import siteConfig from '../data/siteConfig.json';

const pathname = Astro.url.pathname;

const isActive = (href: string) => {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(href + '/');
};

const navLinks = [
  { label: 'Home', href: '/', show: true },
  { label: 'Essays', href: '/essays', show: true },
  { label: 'Finances', href: '/finances', show: true },
  { label: 'FAQ', href: '/faq', show: true },
  { label: 'Credits', href: '/credits', show: true },
  { label: 'Inventory', href: '/inventory', show: siteConfig.features?.enableInventory === true },
  { label: 'Map', href: '/map', show: siteConfig.features?.enableMap === true },
  { label: 'Forum', href: '/forum', show: siteConfig.features?.enableForum === true },
].filter((item) => item.show);

const isDonateActive = isActive('/donate');
---

<header class="w-full border-b border-[#1C1A17]/15 px-6 sm:px-12 py-5">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <a href="/" class="group inline-flex items-center gap-3 text-left focus:outline-none">
      <img
        src={siteConfig.crestImage}
        alt={siteConfig.siteTitleEn + ' Crest'}
        class="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-105"
      />
      <div class="flex flex-col">
        <span class="font-jp text-xs tracking-[0.22em] text-[#524D46] leading-tight">
          {siteConfig.siteTitleJp}
        </span>
        <span class="font-heading text-lg sm:text-xl font-semibold tracking-[0.14em] text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors leading-tight">
          {siteConfig.siteTitleEn}
        </span>
      </div>
    </a>

    <nav aria-label="Primary Navigation" class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-mono">
      {navLinks.map((link) => {
        const active = isActive(link.href);
        return (
          <a
            href={link.href}
            aria-current={active ? 'page' : undefined}
            class={
              active
                ? 'text-[#6E2B25] font-medium border-b border-[#6E2B25] pb-0.5 transition-colors'
                : 'text-[#524D46] hover:text-[#1C1A17] pb-0.5 transition-colors'
            }
          >
            {link.label}
          </a>
        );
      })}

      <a
        href="/donate"
        aria-current={isDonateActive ? 'page' : undefined}
        class={
          isDonateActive
            ? 'border border-[#6E2B25] bg-[#6E2B25] text-[#E6DFCF] px-2.5 py-1 transition-colors font-medium'
            : 'border border-[#6E2B25] text-[#6E2B25] hover:bg-[#6E2B25] hover:text-[#E6DFCF] px-2.5 py-1 transition-colors'
        }
      >
        Osettai / Donate
      </a>
    </nav>
  </div>
</header>
`,

  'src/components/Footer.astro': `---
import siteConfig from '../data/siteConfig.json';
---

<footer class="w-full border-t border-[#1C1A17]/15 px-6 sm:px-12 pt-8 pb-10 mt-12 text-[#524D46]">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-[#1C1A17]/10">
    <div class="space-y-1">
      <p class="font-jp text-xs tracking-[0.2em] text-[#6E2B25]">
        {siteConfig.siteTitleJp} ・ 同行二人
      </p>
      <p class="font-heading text-base font-semibold tracking-[0.08em] text-[#1C1A17]">
        {siteConfig.routeSummary}
      </p>
      <p class="font-mono text-xs text-[#524D46]">
        Current Stage: {siteConfig.currentLocation}
      </p>
    </div>

    <nav aria-label="Footer Quick Links" class="flex flex-wrap items-center gap-5 font-mono text-xs">
      <a href="/essays" class="text-[#524D46] hover:text-[#6E2B25] underline underline-offset-4 transition-colors">
        Essays
      </a>
      <a href="/finances" class="text-[#524D46] hover:text-[#6E2B25] underline underline-offset-4 transition-colors">
        Finances
      </a>
      <a href="/donate" class="text-[#6E2B25] hover:text-[#8C3B33] font-medium underline underline-offset-4 transition-colors">
        Osettai / Donate
      </a>
    </nav>
  </div>

  <div class="pt-6 text-center">
    <p class="font-mono text-xs tracking-[0.14em] text-[#524D46] select-none">
      ↓ Scroll past the scroll's end / <span class="font-jp">巻末の林檎</span>
    </p>
  </div>
</footer>
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
  <body class="antialiased selection:bg-[#6E2B25] selection:text-[#E6DFCF]">
    <div
      class="fixed-landscape"
      style="background-image: url('/assets/apple-bg.jpeg'), url('/assets/apple-bg.svg');"
    >
      <div class="fixed-landscape-overlay"></div>
    </div>

    <div class="washi-scroll-column min-h-screen flex flex-col">
      <Header />
      <main class="flex-1 px-6 sm:px-12 py-10">
        <slot />
      </main>
      <Footer />
    </div>

    <div class="apple-reveal-window" aria-hidden="true"></div>
  </body>
</html>
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created: ' + relativePath);
}

console.log('\\nStep 1C complete! Global CSS, Header, Footer, and BaseLayout are ready.');