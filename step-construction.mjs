import fs from 'node:fs';
import path from 'node:path';

// 1. Back up existing pages into src/pages/_saved/ so no prior work is lost
const pagesToBackup = ['forum.astro', 'inventory.astro', 'map.astro', 'finances.astro'];
const backupDir = path.resolve(process.cwd(), 'src/pages/_saved');
fs.mkdirSync(backupDir, { recursive: true });

for (const pageFile of pagesToBackup) {
  const srcPath = path.resolve(process.cwd(), 'src/pages', pageFile);
  const destPath = path.resolve(backupDir, pageFile);
  if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Backed up existing ' + pageFile + ' -> src/pages/_saved/' + pageFile);
  }
}

// 2. Update src/data/siteConfig.json so all feature flags and image paths are active
const siteConfigPath = path.resolve(process.cwd(), 'src/data/siteConfig.json');
let siteConfig = {
  siteTitleJp: 'カミノ遍路',
  siteTitleEn: 'CAMINO HENRO',
  tagline: 'From the End of the Earth to the Land of the Rising Sun',
  pilgrimAlias: 'Henro',
  routeSummary: 'Finisterra, Spain → Shikoku, Japan',
  currentLocation: 'Finisterra, Galicia, Spain',
  crestImage: '/assets/logo.png',
  backgroundImage: '/assets/apple-bg.jpeg',
  stripeDonationUrl: 'https://buy.stripe.com/test_placeholder',
  features: {
    enableGallery: true,
    enableInventory: true,
    enableMap: true,
    enableForum: true,
  },
};

if (fs.existsSync(siteConfigPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'));
    siteConfig = {
      ...existing,
      crestImage: existing.crestImage || '/assets/logo.png',
      backgroundImage: existing.backgroundImage || '/assets/apple-bg.jpeg',
      features: {
        ...(existing.features || {}),
        enableGallery: true,
        enableInventory: true,
        enableMap: true,
        enableForum: true,
      },
    };
  } catch (e) {
    console.warn('Could not parse existing siteConfig.json, writing clean config.');
  }
}
fs.mkdirSync(path.dirname(siteConfigPath), { recursive: true });
fs.writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, 2) + '\n', 'utf8');
console.log('Updated: src/data/siteConfig.json');

// 3. Write functional Header component, UnderConstructionLayout, and the 5 pages
const files = {
  'src/components/Header.astro': `---
import siteConfig from '../data/siteConfig.json';

const pathname = Astro.url.pathname;

const isActive = (href: string) => {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
};

const navLinks = [
  { label: 'Home', href: '/', wip: false },
  { label: 'Essays (Blog)', href: '/essays', wip: false },
  { label: 'Finances', href: '/finances', wip: true },
  { label: 'Gallery', href: '/gallery', wip: true },
  { label: 'FAQ', href: '/faq', wip: false },
  { label: 'Credits', href: '/credits', wip: false },
  { label: 'Map', href: '/map', wip: true },
  { label: 'Inventory', href: '/inventory', wip: true },
  { label: 'Forum', href: '/forum', wip: true },
];
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
    {navLinks.map((link) => (
      <a
        href={link.href}
        class={'nav-btn' + (isActive(link.href) ? ' active' : '')}
      >
        {link.label}
        {link.wip && <span class="wip-dot">•</span>}
      </a>
    ))}
    <a
      href="/donate"
      class={'nav-btn donate-btn' + (isActive('/donate') ? ' active' : '')}
    >
      Donate 印
    </a>
  </nav>
</header>
`,

  'src/layouts/UnderConstructionLayout.astro': `---
import Header from '../components/Header.astro';
import siteConfig from '../data/siteConfig.json';
import '../styles/global.css';

interface Props {
  title?: string;
  message?: string;
}

const {
  title = 'Under Construction',
  message = 'Henro is currently working on the website. The road will be shorter than the path to Japan, but patience is still required.',
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{siteConfig.siteTitleJp} | {siteConfig.siteTitleEn} — {title}</title>
    <link rel="icon" type="image/png" href="/assets/logo.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Cormorant+Garamond:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+JP:wght@400;600&family=Shippori+Mincho:wght@400;600;700&display=swap"
      rel="stylesheet"
    />

    <style>
      :root {
        --bg-outer-obsidian: #08090C;
        --bg-header: rgba(10, 12, 16, 0.88);
        --bg-washi-scroll: #E6DFCF;
        --ink-sumi: #1C1A17;
        --header-text: #E6DFCF;
        --header-muted: #A09A8E;
        --accent-crimson: #6E2B25;
        --font-serif: 'Georgia', 'Yu Mincho', 'Hiragino Mincho ProN', serif;
        --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        --font-cursive: 'Dancing Script', cursive;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body.uc-body {
        background-color: var(--bg-outer-obsidian);
        color: var(--ink-sumi);
        font-family: var(--font-serif);
        line-height: 1.85;
        overflow: hidden;
        height: 100vh;
      }

      .uc-fixed-backdrop {
        position: fixed;
        inset: 0;
        z-index: 0;
        background-image: url('/assets/apple-bg.jpeg'), url('/assets/apple-bg.svg');
        background-size: cover;
        background-position: center 84%;
        background-repeat: no-repeat;
      }

      .uc-backdrop-dimmer {
        position: fixed;
        inset: 0;
        z-index: 1;
        background: radial-gradient(
          circle at 50% 72%,
          rgba(8, 9, 12, 0.58) 0%,
          rgba(8, 9, 12, 0.84) 100%
        );
        pointer-events: none;
      }

      /* Ensure Header styles always work even if global.css differs */
      :global(header.site-header) {
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

      :global(.header-brand) {
        display: flex;
        align-items: center;
        gap: 14px;
        cursor: pointer;
        text-decoration: none;
      }

      :global(.header-logo-badge) {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--bg-washi-scroll);
        padding: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
      }

      :global(.header-logo-badge img) {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      :global(.header-titles) {
        display: flex;
        flex-direction: column;
      }

      :global(.header-jp) {
        font-size: 0.72rem;
        letter-spacing: 0.25em;
        color: var(--header-muted);
      }

      :global(.header-en) {
        font-size: 1.2rem;
        letter-spacing: 0.14em;
        color: var(--header-text);
        font-weight: normal;
      }

      :global(nav.site-nav) {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
      }

      :global(.nav-btn) {
        background: transparent;
        border: none;
        color: var(--header-muted);
        font-family: var(--font-sans);
        font-size: 0.76rem;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        padding: 7px 11px;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
        text-decoration: none;
      }

      :global(.nav-btn:hover) {
        color: var(--header-text);
      }

      :global(.nav-btn.active) {
        color: var(--header-text);
        border-bottom: 2px solid var(--accent-crimson);
      }

      :global(.nav-btn .wip-dot) {
        font-size: 0.62rem;
        opacity: 0.6;
        margin-left: 3px;
      }

      :global(.nav-btn.donate-btn) {
        background: var(--accent-crimson);
        color: #F4F1EA;
        padding: 7px 15px;
        margin-left: 8px;
        border-radius: 2px;
        border-bottom: none;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      }

      :global(.nav-btn.donate-btn:hover) {
        filter: brightness(1.12);
      }

      .construction-content {
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 80vh;
        text-align: center;
        color: #F4F1EA;
        padding: 0 20px;
      }

      .logo-large {
        width: 150px;
        margin-bottom: 20px;
        filter: drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.6));
      }

      .construction-title {
        font-family: var(--font-cursive);
        font-size: 4rem;
        margin-bottom: 10px;
        text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
      }

      .construction-text {
        font-family: var(--font-serif);
        font-size: 1.5rem;
        max-width: 600px;
        line-height: 1.6;
        text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.8);
      }
    </style>
  </head>
  <body class="uc-body">
    <!-- LAYER 1: Fixed Road & Apple Background -->
    <div class="uc-fixed-backdrop"></div>
    <div class="uc-backdrop-dimmer"></div>

    <!-- PERSISTENT CLICKABLE WEBSITE HEADER -->
    <Header />

    <!-- UNDER CONSTRUCTION CONTENT -->
    <main class="construction-content">
      <img
        src="/assets/logo.png"
        onerror="this.onerror=null;this.src='/assets/crest.png';"
        alt="Henro Stamp"
        class="logo-large"
      />
      <h1 class="construction-title">Under construction</h1>
      <p class="construction-text">{message}</p>
    </main>
  </body>
</html>
`,

  'src/pages/forum.astro': `---
import UnderConstructionLayout from '../layouts/UnderConstructionLayout.astro';
---
<UnderConstructionLayout title="Forum — Under Construction" />
`,

  'src/pages/inventory.astro': `---
import UnderConstructionLayout from '../layouts/UnderConstructionLayout.astro';
---
<UnderConstructionLayout title="Inventory — Under Construction" />
`,

  'src/pages/gallery.astro': `---
import UnderConstructionLayout from '../layouts/UnderConstructionLayout.astro';
---
<UnderConstructionLayout title="Gallery — Under Construction" />
`,

  'src/pages/map.astro': `---
import UnderConstructionLayout from '../layouts/UnderConstructionLayout.astro';
---
<UnderConstructionLayout title="Map — Under Construction" />
`,

  'src/pages/finances.astro': `---
import UnderConstructionLayout from '../layouts/UnderConstructionLayout.astro';
---
<UnderConstructionLayout title="Finances — Under Construction" />
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated: ' + relativePath);
}

console.log('\nAll 5 pages (/forum, /inventory, /gallery, /map, /finances) now use the Under Construction template with working Header navigation!');