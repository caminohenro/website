import fs from 'fs';
import path from 'path';

const root = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ Wrote ' + relPath);
}

// ============================================================================
// 1. EXTRACTED PAGE TEXT JSON FILES (src/data/pages/*.json)
// ============================================================================

const globalUiJson = {
  header: {
    home: 'Home',
    blog: 'Blog',
    faq: 'FAQ',
    credits: 'Credits',
    comingSoon: 'Coming Soon',
    map: 'Map',
    inventory: 'Inventory',
    finances: 'Finances',
    gallery: 'Gallery',
    forum: 'Forum',
    donateBtn: 'Donate 印',
    languageMenuAria: 'Select Language'
  },
  footer: {
    scrollFootHint: '↓ Scroll down past the bottom roller to reveal the road beneath ↓'
  },
  newsletter: {
    eyebrow: '書簡 • DISPATCHES',
    heading: 'Pilgrimage Newsletter',
    copy: 'No noise, no algorithms—only a quiet note in your inbox whenever a new dispatch is written from the trail. Sent via MailerLite.',
    placeholder: 'Your email address...',
    emailAriaLabel: 'Email Address',
    submitBtn: 'Subscribe to Dispatches 印',
    msgInvalidEmail: 'Please enter a valid email address.',
    msgSuccess: '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm.',
    msgError: 'Unable to reach the dispatch ledger right now. Please try again shortly.',
    msgPreviewMode: '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm. (Local Preview Mode)'
  },
  scrollUi: {
    clickToUnfurl: 'Click to unfurl',
    clickToUnfurlAria: 'Click to unfurl the scroll',
    openScrollAria: 'Open the scroll',
    closeScrollAria: 'Close the scroll'
  }
};

const homeJson = {
  eyebrow: 'Finisterra, Spain → Shikoku, Japan',
  heading: 'CAMINO HENRO',
  subtitle: 'From the End of the Earth to the Land of the Rising Sun',
  manifestoDivider: "哲学の道 • THE PILGRIM'S MANIFESTO",
  manifestoQuoteLine1: 'A boy and a hat set out on a journey to cross a continent and discover a world(view) where money, jobs and human society are simply another part of Nature.',
  manifestoQuoteLine2: "We have never left Nature — we've merely forgotten that everything is, inevitably, Nature. ☯️",
  manifestoQuoteLine3: 'For the hat, a homecoming — its very own Odyssey.',
  manifestoQuoteLine4: 'For the boy, a rite of initiation, and the beginning of a journey into manhood.',
  manifestoBodyHtml: 'Modern life surrounds us with financial instruments, insurance policies, and digital vaults—yet anxiety over basic survival remains sharper than ever. <strong>Camino Henro</strong> is a cross-continental philosophical pilgrimage on foot from Finisterra, Spain to Shikoku, Japan, investigating a single foundational question: <em>What is the true philosophical foundation for building a sense of material security in life?</em>',
  essaysDivider: '随筆 • LATEST PHILOSOPHICAL ESSAYS',
  essayNumberPrefix: 'Essay No.',
  unrollEssayLink: 'Unroll Essay Scroll ➔',
  viewArchiveBtn: 'View Full Essay Archive (/essays) ➔',
  courtyardDivider: "広場 • FROM THE PILGRIM'S COURTYARD",
  spotlightLabel: 'COMMUNITY DIALOGUE SPOTLIGHT',
  mostPopularTab: '★ Most Popular',
  latestInquiryTab: '✦ Latest Inquiry',
  enterCourtyardLink: "Enter the Pilgrim's Courtyard (/forum) ➔",
  replySingular: '1 Reply',
  replyPluralSuffix: 'Replies',
  recentFallbackDate: 'Recent',
  fallbackPopular: {
    category: 'Philosophy & Ethos',
    author_name: 'Steppenwolf',
    created_at: '2026-10-18T10:00:00Z',
    reply_count: 14,
    title: 'On Sufficiency vs. Surplus: Where Does Preparation End and Fear Begin?',
    content: 'When walking across a continent with everything on your back, every extra ounce is a physical confession of a fear you have not yet made peace with. How do we distinguish wise stewardship from anxiety?'
  },
  fallbackLatest: {
    category: 'Trail Craft & Gear',
    author_name: 'Kūkai_Walker',
    created_at: '2026-10-27T18:30:00Z',
    reply_count: 5,
    title: 'On Sufficiency vs. Surplus: Footcare and Cold-Weather Layering Past the Pyrenees',
    content: 'As the autumn frost settles over the stone paths, what minimalist wool and rain shell combinations have proven resilient without burdening the pack beyond six kilograms?'
  }
};

const donateJson = {
  metaTitle: 'Offer Osettai (Donate) | CAMINO HENRO',
  metaDescription: 'Support the Camino Henro pilgrimage from Spain to Japan in the traditional spirit of Shikoku Osettai and Camino donativo.',
  eyebrow: 'お接待 • Pilgrimage Alms',
  heading: 'Offer Osettai',
  subtitle: 'Sustaining the digital scroll, off-trail archiving, and the future printed book of essays',
  kanji: '志',
  introBody: '<body>',
  tiersHeading: 'Suggested Osettai Offerings',
  tiersJp: '喜捨の目安',
  selectOfferingCta: 'Select Offering via Stripe →',
  primaryStripeCta: 'Offer Osettai via Stripe →',
  ledgerLinkText: 'Every euro received is logged openly in the Financial Ledger →',
  tiers: [
    {
      title: 'A Hot Meal on a Rainy Day — €10',
      amount: '€10',
      jp: '一椀の糧',
      description: '<body>'
    },
    {
      title: "A Night's Pilgrim Bunk — €20",
      amount: '€20',
      jp: '一夜の宿',
      description: '<body>'
    },
    {
      title: 'A Pair of Trail Socks / Gear Repair — €35',
      amount: '€35',
      jp: '草鞋と修繕',
      description: '<body>'
    },
    {
      title: 'Custom Osettai Offering — Any Amount',
      amount: 'Open',
      jp: '随意のお接待',
      description: '<body>'
    }
  ]
};

const creditsUiJson = {
  metaTitle: 'Credits & Gratitude | CAMINO HENRO',
  metaDescription: 'Roll of Gratitude honoring the trail hosts, roadside angels, Osettai patrons, and collaborators walking alongside this pilgrimage.',
  eyebrow: '感謝芳名録 • Roll of Gratitude',
  heading: 'Credits',
  subtitle: 'Honoring the trail hosts, roadside angels, Osettai patrons, and collaborators who sustain this road',
  kanji: '縁',
  bookPrefix: 'Book 0',
  emptySectionText: 'Entries for this section will be inscribed as the road unfolds.',
  calloutJp: 'お接待の記録',
  calloutHeading: 'Walk With This Pilgrimage',
  calloutBody: '<body>',
  offerOsettaiBtn: 'Offer Osettai →',
  viewLedgerBtn: 'View Financial Ledger'
};

const faqUiJson = {
  metaTitle: 'FAQ | CAMINO HENRO',
  metaDescription: 'Frequently asked questions regarding the overland pilgrimage route from Spain to Japan, philosophical inquiry, and daily trail life.',
  eyebrow: '問答 • Inquiries Along the Way',
  heading: 'Frequently Asked Questions',
  subtitle: 'On the overland route across Eurasia, the philosophy of sufficiency, and daily life on foot',
  kanji: '問',
  bottomHeading: 'Walk Alongside the Dispatches',
  bottomBody: 'Explore the long-form philosophical essays written directly from the trail.',
  bottomBtn: 'Read Trail Dispatches →'
};

const essaysUiJson = {
  archiveMetaTitle: 'Essays & Dispatches | CAMINO HENRO',
  archiveMetaDescription: 'Chronological philosophical dispatches written on foot from Finisterra, Spain toward Shikoku, Japan.',
  eyebrow: '随筆・思索の記録 • Pilgrimage Dispatches',
  heading: 'Dispatches from the Road',
  subtitle: 'Long-form reflections on material security, reciprocity, and the quiet continuity between human society and Nature',
  kanji: '筆',
  kmPrefix: 'KM',
  readFullDispatchBtn: 'Read Full Dispatch →',
  backToDispatches: '← Back to All Dispatches',
  shareEyebrow: 'Pass the Scroll Along',
  shareHeading: 'Share This Dispatch',
  copyLinkBtn: 'Copy Direct Link',
  linkCopiedBtn: '✓ Link Copied',
  nativeShareBtn: 'Share...',
  shareEmailBodyPrefix: 'Read this dispatch from Camino Henro: ',
  osettaiPrompt: 'If these words offered quiet company today, you may support the walk and archive in the tradition of pilgrimage alms.',
  offerOsettaiBtn: 'Offer Osettai (Support the Walk) 印',
  prevDispatchLabel: '← Previous Dispatch',
  startOfTrailLabel: 'Start of the Trail',
  firstDispatchText: 'First Recorded Dispatch',
  nextDispatchLabel: 'Next Dispatch →',
  currentHorizonLabel: 'Current Horizon',
  latestDispatchText: 'Latest Recorded Dispatch',
  communityReflectionsSummary: 'Community Reflections & Roadside Notes (Click to Expand)'
};

const comingSoonJson = {
  sharedHeading: 'Coming soon',
  sharedMessageHtml: 'Henro is currently working on this page. <br />The road will be shorter than the path to Japan, but patience is still required.',
  sneakPreviewBeforeLink: 'Want a ',
  sneakPreviewLinkText: 'sneak preview',
  sneakPreviewAfterLink: ' of this page?',
  pages: {
    finances: {
      title: 'Finances — Coming Soon',
      plansHtml: "Plans for this page: Here you'll be able to see how your money is being put to good use."
    },
    forum: {
      title: 'Forum — Coming Soon',
      plansHtml: 'Plans for this page: A full-fledged forum where the community can discuss topics and ask questions related to the pilgrimage.'
    },
    gallery: {
      title: 'Gallery — Coming Soon',
      plansHtml: "Plans for this page: Here you'll be able to submit your photos of or with Henro."
    },
    inventory: {
      title: 'Inventory — Coming Soon',
      plansHtml: "Plans for this page: A full <b>RPG-style inventory menu</b>, with clickable item thumbnails that open a 'details' window about the item"
    },
    map: {
      title: 'Map — Coming Soon',
      plansHtml: "Plans for this page: A world map showing Henro's current location and walked path."
    }
  }
};

writeFile('src/data/pages/global-ui.json', JSON.stringify(globalUiJson, null, 2) + '\n');
writeFile('src/data/pages/home.json', JSON.stringify(homeJson, null, 2) + '\n');
writeFile('src/data/pages/donate.json', JSON.stringify(donateJson, null, 2) + '\n');
writeFile('src/data/pages/credits-ui.json', JSON.stringify(creditsUiJson, null, 2) + '\n');
writeFile('src/data/pages/faq-ui.json', JSON.stringify(faqUiJson, null, 2) + '\n');
writeFile('src/data/pages/essays-ui.json', JSON.stringify(essaysUiJson, null, 2) + '\n');
writeFile('src/data/pages/coming-soon.json', JSON.stringify(comingSoonJson, null, 2) + '\n');

// Create the dedicated Translations Staging Inbox JSON file for Pages CMS
const inboxPath = path.join(root, 'src/data/translation-inbox.json');
if (!fs.existsSync(inboxPath)) {
  const initialInbox = {
    notice: 'When you create or edit an English essay or page text, it automatically appears in the Staging Inbox list below. Set Action to "Translate Now" and save to trigger AI translation into European Portuguese (pt-PT), Spanish, French, and Japanese. Set Action to "Ignore" to dismiss minor typo edits without re-translating.',
    items: []
  };
  writeFile('src/data/translation-inbox.json', JSON.stringify(initialInbox, null, 2) + '\n');
}

// Ensure i18n output directories exist for pt, es, fr, ja
for (const lang of ['pt', 'es', 'fr', 'ja']) {
  const dir = path.join(root, 'src/data/i18n', lang, 'essays');
  fs.mkdirSync(dir, { recursive: true });
}

// ============================================================================
// 2. CREATE src/utils/i18n.ts (Unified Loader, Deep Fallback & URL Helpers)
// ============================================================================

const i18nTsContent = `import fs from 'node:fs';
import path from 'node:path';
import globalUiEn from '../data/pages/global-ui.json';
import homeEn from '../data/pages/home.json';
import donateEn from '../data/pages/donate.json';
import creditsUiEn from '../data/pages/credits-ui.json';
import faqUiEn from '../data/pages/faq-ui.json';
import essaysUiEn from '../data/pages/essays-ui.json';
import comingSoonEn from '../data/pages/coming-soon.json';
import faqDataEn from '../data/faq.json';
import creditsDataEn from '../data/credits.json';

export const SUPPORTED_LOCALES = ['en', 'pt', 'es', 'fr', 'ja'] as const;
export const NON_DEFAULT_LOCALES = ['pt', 'es', 'fr', 'ja'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_OPTIONS: Array<{ code: Locale; label: string; shortLabel: string; flag: string; bcp47: string }> = [
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧', bcp47: 'en-US' },
  { code: 'pt', label: 'Português (PT)', shortLabel: 'PT', flag: '🇵🇹', bcp47: 'pt-PT' },
  { code: 'es', label: 'Español', shortLabel: 'ES', flag: '🇪🇸', bcp47: 'es-ES' },
  { code: 'fr', label: 'Français', shortLabel: 'FR', flag: '🇫🇷', bcp47: 'fr-FR' },
  { code: 'ja', label: '日本語', shortLabel: 'JA', flag: '🇯🇵', bcp47: 'ja-JP' },
];

const EN_SOURCES: Record<string, any> = {
  'global-ui': globalUiEn,
  'home': homeEn,
  'donate': donateEn,
  'credits-ui': creditsUiEn,
  'faq-ui': faqUiEn,
  'essays-ui': essaysUiEn,
  'coming-soon': comingSoonEn,
  'faq': faqDataEn,
  'credits': creditsDataEn,
};

export function getLocaleFromPathname(pathname: string): Locale {
  const clean = (pathname || '/').trim();
  const segments = clean.split('/').filter(Boolean);
  const first = segments[0]?.toLowerCase();
  if (first && (NON_DEFAULT_LOCALES as readonly string[]).includes(first)) {
    return first as Locale;
  }
  return 'en';
}

export function stripLocalePrefix(pathname: string): string {
  const clean = (pathname || '/').trim();
  const replaced = clean.replace(/^\\/(pt|es|fr|ja)(?=\\/|$)/i, '');
  if (!replaced) return '/';
  return replaced.startsWith('/') ? replaced : '/' + replaced;
}

export function localizePath(href: string, locale: Locale): string {
  if (!href) return '/';
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  const base = stripLocalePrefix(href);
  if (locale === 'en') return base;
  if (base === '/') return '/' + locale;
  return '/' + locale + (base.startsWith('/') ? base : '/' + base);
}

export function getDateLocaleTag(locale: Locale): string {
  const found = LOCALE_OPTIONS.find((item) => item.code === locale);
  return found ? found.bcp47 : 'en-US';
}

function deepMerge<T>(base: T, override: any): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) && override.length > 0 ? override : base) as unknown as T;
  }
  if (typeof base === 'object' && base !== null && typeof override === 'object' && !Array.isArray(override)) {
    const result: any = { ...base };
    for (const key of Object.keys(override)) {
      if (key in result) {
        result[key] = deepMerge(result[key], override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result as T;
  }
  return (typeof override === typeof base && override !== '' ? override : base) as T;
}

export function getPageData<T = any>(pageKey: string, locale: Locale): T {
  const base = EN_SOURCES[pageKey] || {};
  if (locale === 'en') return base as T;

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'i18n', locale, pageKey + '.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return deepMerge(base, parsed);
    }
  } catch (_err) {
    // Fallback to English base if translation file doesn't exist yet
  }
  return base as T;
}

export function getUiStrings(locale: Locale) {
  return getPageData<typeof globalUiEn>('global-ui', locale);
}

export interface EssayTranslationOverlay {
  title?: string;
  subtitle?: string;
  location?: string;
  readingTime?: string;
  excerpt?: string;
  bodyHtml?: string;
}

export function getEssayTranslation(slug: string, locale: Locale): EssayTranslationOverlay | null {
  if (locale === 'en') return null;
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'i18n', locale, 'essays', slug + '.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (_err) {
    return null;
  }
  return null;
}

export function applyEssayTranslation<T extends { slug: string; data: any }>(entry: T, locale: Locale): T & { translatedBodyHtml?: string | null } {
  const overlay = getEssayTranslation(entry.slug, locale);
  if (!overlay) {
    return Object.assign({}, entry, { translatedBodyHtml: null });
  }
  return Object.assign({}, entry, {
    data: {
      ...entry.data,
      title: overlay.title || entry.data.title,
      subtitle: overlay.subtitle ?? entry.data.subtitle,
      location: overlay.location || entry.data.location,
      readingTime: overlay.readingTime || entry.data.readingTime,
      excerpt: overlay.excerpt || entry.data.excerpt,
    },
    translatedBodyHtml: overlay.bodyHtml || null,
  });
}
`;

writeFile('src/utils/i18n.ts', i18nTsContent);

// ============================================================================
// 3. UPDATE src/components/Header.astro & src/styles/global.css
//    (Adds Language Dropdown to the right of Donate 印, shifts tabs slightly)
// ============================================================================

const headerAstroContent = `---
import siteConfig from '../data/siteConfig.json';
import {
  getLocaleFromPathname,
  stripLocalePrefix,
  localizePath,
  getUiStrings,
  LOCALE_OPTIONS,
} from '../utils/i18n';

const pathname = Astro.url.pathname;
const currentLocale = getLocaleFromPathname(pathname);
const normalizedPath = stripLocalePrefix(pathname);
const ui = getUiStrings(currentLocale);
const currentLangMeta =
  LOCALE_OPTIONS.find((item) => item.code === currentLocale) || LOCALE_OPTIONS[0];

const isActive = (href?: string) => {
  if (!href) return false;
  const normPath = normalizedPath.toLowerCase();
  const normHref = stripLocalePrefix(href).toLowerCase();
  if (normHref === '/') return normPath === '/';
  return normPath === normHref || normPath.startsWith(normHref + '/');
};

const isGroupActive = (children?: Array<{ href?: string }>) => {
  if (!Array.isArray(children)) return false;
  return children.some((child) => isActive(child.href));
};

const labelMap: Record<string, string> = {
  'Home': ui.header.home,
  'Blog': ui.header.blog,
  'FAQ': ui.header.faq,
  'Credits': ui.header.credits,
  'Coming Soon': ui.header.comingSoon,
  'Map': ui.header.map,
  'Inventory': ui.header.inventory,
  'Finances': ui.header.finances,
  'Gallery': ui.header.gallery,
  'Forum': ui.header.forum,
};

const translateNavLabel = (rawLabel: string) => labelMap[rawLabel] || rawLabel;

const defaultNavigation = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/essays' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Credits', href: '/credits' },
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
        label: translateNavLabel(item.label),
        children: item.children
          .filter((child: any) => isFeatureEnabled(child.featureFlag))
          .map((child: any) => ({
            ...child,
            label: translateNavLabel(child.label),
            localizedHref: localizePath(child.href, currentLocale),
          })),
      };
    }
    return {
      ...item,
      label: translateNavLabel(item.label),
      localizedHref: localizePath(item.href, currentLocale),
    };
  })
  .filter((item: any) => !Array.isArray(item.children) || item.children.length > 0);
---

<header class="site-header">
  <a href={localizePath('/', currentLocale)} class="header-brand">
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
                href={child.localizedHref}
                class={'nav-dropdown-item' + (isActive(child.href) ? ' active' : '')}
              >
                {child.label}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <a
          href={item.localizedHref}
          class={'nav-btn' + (isActive(item.href) ? ' active' : '')}
        >
          {item.label}
          {item.wip && <span class="wip-dot">•</span>}
        </a>
      )
    )}
    <a
      href={localizePath('/donate', currentLocale)}
      class={'nav-btn donate-btn' + (isActive('/donate') ? ' active' : '')}
    >
      {ui.header.donateBtn}
    </a>

    <!-- Language Selector Dropdown positioned immediately to the right of Donate -->
    <div class="nav-dropdown lang-dropdown">
      <button
        type="button"
        class="nav-btn nav-dropdown-toggle lang-dropdown-toggle"
        aria-expanded="false"
        aria-label={ui.header.languageMenuAria}
      >
        <span class="lang-flag" aria-hidden="true">{currentLangMeta.flag}</span>
        <span>{currentLangMeta.shortLabel}</span>
        <span class="nav-caret">▾</span>
      </button>
      <div class="nav-dropdown-menu lang-dropdown-menu">
        {LOCALE_OPTIONS.map((lang) => (
          <a
            href={localizePath(normalizedPath, lang.code)}
            class={'nav-dropdown-item lang-dropdown-item' + (lang.code === currentLocale ? ' active' : '')}
            hreflang={lang.code}
          >
            <span class="lang-flag" aria-hidden="true">{lang.flag}</span>
            <span>{lang.label}</span>
          </a>
        ))}
      </div>
    </div>
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

        if (currentScroll > lastScroll) {
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

writeFile('src/components/Header.astro', headerAstroContent);

// Append subtle spacing & language dropdown rules to src/styles/global.css
const globalCssPath = path.join(root, 'src/styles/global.css');
if (fs.existsSync(globalCssPath)) {
  let css = fs.readFileSync(globalCssPath, 'utf8');
  if (!css.includes('/* STEP20_LANG_DROPDOWN_START */')) {
    const langCss = `
/* STEP20_LANG_DROPDOWN_START */
nav.site-nav {
  gap: 4px;
}

.nav-btn {
  padding: 7px 9px;
}

.nav-btn.donate-btn {
  margin-left: 6px;
}

.lang-dropdown {
  margin-left: 4px;
}

.lang-dropdown-toggle {
  padding: 6px 9px;
  border: 1px solid rgba(230, 223, 207, 0.2);
  border-radius: 2px;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
}

.lang-dropdown-toggle:hover {
  border-color: rgba(230, 223, 207, 0.45);
}

.lang-dropdown-menu {
  min-width: 162px;
}

.lang-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: none;
  letter-spacing: 0.06em;
  font-size: 0.78rem;
}

.lang-flag {
  font-size: 0.92rem;
  line-height: 1;
}
/* STEP20_LANG_DROPDOWN_END */
`;
    css = css.trimEnd() + '\n' + langCss;
    fs.writeFileSync(globalCssPath, css, 'utf8');
    console.log('✓ Appended language dropdown styles to src/styles/global.css');
  }
}

// ============================================================================
// 4. UPDATE Footer.astro, UnderConstructionLayout.astro, and BaseLayout.astro
// ============================================================================

const footerAstroContent = `---
import { getLocaleFromPathname, getUiStrings } from '../utils/i18n';

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const ui = getUiStrings(currentLocale);
---
<div class="scroll-foot-hint">
  {ui.footer.scrollFootHint}
</div>
`;

writeFile('src/components/Footer.astro', footerAstroContent);

const underConstructionLayoutContent = `---
import Header from '../components/Header.astro';
import siteConfig from '../data/siteConfig.json';
import { getLocaleFromPathname, getPageData } from '../utils/i18n';
import '../styles/global.css';

interface Props {
  title?: string;
  heading?: string;
  message?: string;
  plans?: string;
  previewHref?: string;
}

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const cs = getPageData('coming-soon', currentLocale);

const {
  title = cs.sharedHeading || 'Coming Soon',
  heading = cs.sharedHeading || 'Coming soon',
  message = cs.sharedMessageHtml || 'Henro is currently working on this page.',
  plans = '',
  previewHref = '',
} = Astro.props;
---

<!doctype html>
<html lang={currentLocale}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{siteConfig.siteTitleJp} | {siteConfig.siteTitleEn} — {title}</title>
    <link rel="icon" type="image/png" href="/assets/logo.png" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=block"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+JP:wght@400;600&family=Shippori+Mincho:wght@400;600;700&display=swap"
      rel="stylesheet"
    />

    <style>
      body.uc-body {
        background-color: var(--bg-outer-obsidian, #08090C);
        color: #F4F1EA;
        font-family: 'EB Garamond', Georgia, 'Yu Mincho', serif;
        line-height: 1.85;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        overflow-y: auto;
        min-height: 100vh;
        min-height: 100dvh;
      }

      .construction-content {
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100dvh - 84px);
        text-align: center;
        color: #F4F1EA;
        padding: 40px 20px 84px;
        opacity: 0;
      }

      .construction-content.is-ready {
        animation: stageFadeIn var(--fade-duration, 0.8s) ease-out both;
      }

      .logo-large {
        width: 200px;
        margin-bottom: 20px;
        filter: drop-shadow(0px 4px 8px rgba(253, 252, 252, 0.8));
      }

      .construction-title {
        font-family: 'Dancing Script', cursive;
        font-size: clamp(2.8rem, 8vw, 4rem);
        font-weight: 600;
        margin-bottom: 12px;
        line-height: 1.2;
        text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
      }

      .construction-text {
        font-family: 'EB Garamond', Georgia, 'Yu Mincho', serif;
        font-size: clamp(1.2rem, 3.8vw, 1.5rem);
        color: #dee2e7;
        max-width: 620px;
        line-height: 1.6;
        margin-bottom: 16px;
        text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.85);
      }

      .construction-plans {
        font-family: 'EB Garamond', Georgia, 'Yu Mincho', serif;
        font-size: clamp(1.05rem, 3.4vw, 1.25rem);
        max-width: 600px;
        line-height: 1.65;
        color: rgba(244, 241, 234, 0.9);
        margin-top: 4px;
        margin-bottom: 18px;
        text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.85);
      }

      .construction-preview-prompt {
        font-family: 'EB Garamond', Georgia, serif;
        font-size: 1rem;
        color: rgba(244, 241, 234, 0.78);
        margin-top: 14px;
        letter-spacing: 0.03em;
        text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.85);
      }

      .construction-preview-link {
        color: #eb1906;
        font-weight: 400;
        text-decoration: underline;
        text-underline-offset: 4px;
        text-decoration-color: rgba(219, 30, 13, 0.6);
        transition: color 0.2s ease, text-decoration-color 0.2s ease;
      }

      .construction-preview-link:hover {
        color: var(--color-crimson-light, #8C3B33);
        text-decoration-color: #8C3B33;
      }

      @media (prefers-reduced-motion: reduce) {
        .construction-content,
        .construction-content.is-ready {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    </style>
  </head>
  <body class="uc-body selection:bg-[#6E2B25] selection:text-[#E6DFCF]">
    <div
      class="fixed-backdrop"
      style="background-image: url('/assets/apple-bg.jpeg'), url('/assets/apple-diff.jpg');"
    ></div>
    <div class="backdrop-dimmer"></div>

    <Header />

    <main class="construction-content" id="uc-content">
      <img
        src="/assets/logo.png"
        onerror="this.onerror=null;this.src='/assets/crest.png';"
        alt="Henro Stamp"
        class="logo-large"
      />
      <h1 class="construction-title">{heading}</h1>
      <p class="construction-text" set:html={message} />

      {plans && <p class="construction-plans" set:html={plans} />}

      <slot />

      {previewHref && (
        <p class="construction-preview-prompt">
          {cs.sneakPreviewBeforeLink}<a href={previewHref} class="construction-preview-link">{cs.sneakPreviewLinkText}</a>{cs.sneakPreviewAfterLink}
        </p>
      )}
    </main>

    <script is:inline>
      (function () {
        const content = document.getElementById('uc-content');
        if (!content) return;

        function reveal() {
          content.classList.add('is-ready');
        }

        if (document.fonts && document.fonts.ready) {
          const fallbackTimer = setTimeout(reveal, 250);
          document.fonts.ready.then(function () {
            clearTimeout(fallbackTimer);
            reveal();
          });
        } else {
          reveal();
        }
      })();
    </script>
  </body>
</html>
`;

writeFile('src/layouts/UnderConstructionLayout.astro', underConstructionLayoutContent);

// Surgically update BaseLayout.astro so all remaining English strings come from ui.newsletter and ui.scrollUi
// while preserving 100% of the scroll physics & newsletter scripts untouched.
const baseLayoutPath = path.join(root, 'src/layouts/BaseLayout.astro');
if (fs.existsSync(baseLayoutPath)) {
  let bl = fs.readFileSync(baseLayoutPath, 'utf8');

  // 1. Pass scrollUi data attributes on .scroll-stage
  bl = bl.replace(
    `data-mobile-start-closed={startClosed ? 'true' : 'false'}`,
    `data-mobile-start-closed={startClosed ? 'true' : 'false'}\n      data-label-click-unfurl={ui.scrollUi?.clickToUnfurl || 'Click to unfurl'}\n      data-label-click-unfurl-aria={ui.scrollUi?.clickToUnfurlAria || 'Click to unfurl the scroll'}\n      data-label-open-scroll-aria={ui.scrollUi?.openScrollAria || 'Open the scroll'}\n      data-label-close-scroll-aria={ui.scrollUi?.closeScrollAria || 'Close the scroll'}`
  );

  // 2. Pass newsletter response strings on #global-newsletter-box
  bl = bl.replace(
    `data-form-action={siteConfig.mailerlite?.formActionUrl || ''}`,
    `data-form-action={siteConfig.mailerlite?.formActionUrl || ''}\n        data-msg-invalid={ui.newsletter.msgInvalidEmail}\n        data-msg-success={ui.newsletter.msgSuccess}\n        data-msg-error={ui.newsletter.msgError}\n        data-msg-preview={ui.newsletter.msgPreviewMode}`
  );

  // 3. Localize email input aria-label
  bl = bl.replace(
    `aria-label="Email Address"`,
    `aria-label={ui.newsletter.emailAriaLabel || 'Email Address'}`
  );

  // 4. Localize desktop click hints & aria-labels via stage.dataset
  bl = bl.replace(
    `'<span>Click to unfurl</span>';`,
    `'<span>' + (stage.dataset.labelClickUnfurl || 'Click to unfurl') + '</span>';`
  );
  bl = bl.replace(
    `'Click to unfurl the scroll'`,
    `(stage.dataset.labelClickUnfurlAria || 'Click to unfurl the scroll')`
  );
  bl = bl.replace(
    /closed \|\| closing \? 'Open the scroll' : 'Close the scroll'/g,
    `closed || closing ? (stage.dataset.labelOpenScrollAria || 'Open the scroll') : (stage.dataset.labelCloseScrollAria || 'Close the scroll')`
  );
  bl = bl.replace(
    `'</svg><span>Click to unfurl</span>';`,
    `'</svg><span>' + (stage.dataset.labelClickUnfurl || 'Click to unfurl') + '</span>';`
  );

  // 5. Localize MailerLite feedback messages via box.getAttribute
  bl = bl.replace(
    `msgEl.textContent = 'Please enter a valid email address.';`,
    `msgEl.textContent = box.getAttribute('data-msg-invalid') || 'Please enter a valid email address.';`
  );
  bl = bl.replace(
    `msgEl.textContent =\n                '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm.';`,
    `msgEl.textContent = box.getAttribute('data-msg-success') || '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm.';`
  );
  bl = bl.replace(
    `msgEl.textContent =\n                'Unable to reach the dispatch ledger right now. Please try again shortly.';`,
    `msgEl.textContent = box.getAttribute('data-msg-error') || 'Unable to reach the dispatch ledger right now. Please try again shortly.';`
  );
  bl = bl.replace(
    /msgEl\.textContent =\s*'印 Thank you\. Your address has been inscribed in the dispatch ledger\. Please check your inbox to confirm\. \(Local Preview Mode:[^']*';/,
    `msgEl.textContent = box.getAttribute('data-msg-preview') || '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm.';`
  );

  fs.writeFileSync(baseLayoutPath, bl, 'utf8');
  console.log('✓ Updated src/layouts/BaseLayout.astro (ScrollPhysics 100% untouched)');
}

// ============================================================================
// 5. UPDATE ALL .astro PAGES TO FETCH TEXT FROM JSON
// ============================================================================

const indexAstroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import siteConfig from '../data/siteConfig.json';
import { getCollection } from 'astro:content';
import {
  getLocaleFromPathname,
  localizePath,
  getPageData,
  getDateLocaleTag,
  applyEssayTranslation,
} from '../utils/i18n';

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const page = getPageData('home', currentLocale);
const dateLocaleTag = getDateLocaleTag(currentLocale);

const allEssays = await getCollection('essays', ({ data }) => !data.draft);
const sortedEssays = allEssays
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .map((entry) => applyEssayTranslation(entry, currentLocale));
const recentEssays = sortedEssays.slice(0, 4);

const formatDate = (date: Date) =>
  date.toLocaleDateString(dateLocaleTag, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
---

<BaseLayout title={\`\${siteConfig.siteTitleJp} | \${page.heading}\`} description={page.subtitle}>
  <div class="scroll-title-block">
    <img
      src={siteConfig.crestImage}
      style="width:88px; height:88px; mix-blend-mode:multiply; margin: 0 auto 10px; object-fit:contain;"
      alt="Henro Stamp"
    />
    <div class="scroll-eyebrow">{page.eyebrow}</div>
    <h1 class="page-heading">{page.heading}</h1>
    <div class="page-subtitle">{page.subtitle}</div>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">{page.manifestoDivider}</div>
    <div class="line"></div>
  </div>

  <div class="essay-prose">
    <blockquote>
      "{page.manifestoQuoteLine1}<br/>
      {page.manifestoQuoteLine2}<br/>
      {page.manifestoQuoteLine3}<br/>
      {page.manifestoQuoteLine4}"
    </blockquote>

    <p set:html={page.manifestoBodyHtml} />
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">{page.essaysDivider}</div>
    <div class="line"></div>
  </div>

  <div>
    {recentEssays.map((essay, idx) => (
      <a href={localizePath(\`/essays/\${essay.slug}\`, currentLocale)} class="stream-item">
        <div class="stream-meta">
          {page.essayNumberPrefix} {String(sortedEssays.length - idx).padStart(2, '0')}  •  {essay.data.location}  •  {essay.data.readingTime || formatDate(essay.data.date)}
        </div>
        <div class="stream-title">{essay.data.title}</div>
        <div class="stream-excerpt">{essay.data.excerpt}</div>
        <span class="stream-read-link">{page.unrollEssayLink}</span>
      </a>
    ))}
  </div>

  <div style="text-align:center; margin-top:36px;">
    <a href={localizePath('/essays', currentLocale)} class="ink-action-btn">
      {page.viewArchiveBtn}
    </a>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">{page.courtyardDivider}</div>
    <div class="line"></div>
  </div>

  <section
    id="home-forum-spotlight"
    class="forum-spotlight-section"
    data-supabase-url={siteConfig.supabase?.url || ''}
    data-supabase-key={siteConfig.supabase?.anonKey || ''}
    data-forum-href={localizePath('/forum', currentLocale)}
    data-date-locale={dateLocaleTag}
    data-reply-singular={page.replySingular}
    data-reply-plural-suffix={page.replyPluralSuffix}
    data-recent-label={page.recentFallbackDate}
    data-fallback-popular={JSON.stringify(page.fallbackPopular)}
    data-fallback-latest={JSON.stringify(page.fallbackLatest)}
  >
    <div class="spotlight-header-bar">
      <span class="spotlight-label">{page.spotlightLabel}</span>
      <div class="spotlight-toggle-group" role="tablist" aria-label="Forum Spotlight Mode">
        <button
          type="button"
          class="spotlight-toggle-pill active"
          data-spotlight-mode="popular"
          role="tab"
          aria-selected="true"
        >
          {page.mostPopularTab}
        </button>
        <button
          type="button"
          class="spotlight-toggle-pill"
          data-spotlight-mode="latest"
          role="tab"
          aria-selected="false"
        >
          {page.latestInquiryTab}
        </button>
      </div>
    </div>

    <a href={localizePath('/forum', currentLocale)} id="spotlight-thread-card" class="spotlight-thread-card">
      <div class="spotlight-meta">
        <span class="spotlight-category-badge" id="spotlight-category">{page.fallbackPopular.category}</span>
        <span class="spotlight-meta-sep">•</span>
        <span id="spotlight-author">{page.fallbackPopular.author_name}</span>
        <span class="spotlight-meta-sep">•</span>
        <span id="spotlight-date">Oct 2026</span>
        <span class="spotlight-meta-sep">•</span>
        <span id="spotlight-replies">14 {page.replyPluralSuffix}</span>
      </div>
      <h3 class="spotlight-title" id="spotlight-title">
        {page.fallbackPopular.title}
      </h3>
      <p class="spotlight-excerpt" id="spotlight-excerpt">
        {page.fallbackPopular.content}
      </p>
      <span class="stream-read-link">{page.enterCourtyardLink}</span>
    </a>
  </section>

  <script is:inline>
    (function () {
      const container = document.getElementById('home-forum-spotlight');
      if (!container) return;

      const supabaseUrl = (container.getAttribute('data-supabase-url') || '').trim();
      const supabaseKey = (container.getAttribute('data-supabase-key') || '').trim();
      const forumBaseHref = container.getAttribute('data-forum-href') || '/forum';
      const dateLocale = container.getAttribute('data-date-locale') || 'en-US';
      const replySingular = container.getAttribute('data-reply-singular') || '1 Reply';
      const replyPluralSuffix = container.getAttribute('data-reply-plural-suffix') || 'Replies';
      const recentLabel = container.getAttribute('data-recent-label') || 'Recent';

      let popularFallback = {};
      let latestFallback = {};
      try {
        popularFallback = JSON.parse(container.getAttribute('data-fallback-popular') || '{}');
        latestFallback = JSON.parse(container.getAttribute('data-fallback-latest') || '{}');
      } catch (_e) {}

      const categoryEl = document.getElementById('spotlight-category');
      const authorEl = document.getElementById('spotlight-author');
      const dateEl = document.getElementById('spotlight-date');
      const repliesEl = document.getElementById('spotlight-replies');
      const titleEl = document.getElementById('spotlight-title');
      const excerptEl = document.getElementById('spotlight-excerpt');
      const cardEl = document.getElementById('spotlight-thread-card');
      const toggleButtons = container.querySelectorAll('[data-spotlight-mode]');

      const fallbackThreads = {
        popular: popularFallback,
        latest: latestFallback,
      };

      function formatShortDate(rawDate) {
        if (!rawDate) return recentLabel;
        const parsed = new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) return recentLabel;
        return parsed.toLocaleDateString(dateLocale, {
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
        const title = thread.title || popularFallback.title || '';
        const rawBody = thread.content || thread.body || thread.excerpt || popularFallback.content || '';

        if (categoryEl) categoryEl.textContent = category;
        if (authorEl) authorEl.textContent = author;
        if (dateEl) dateEl.textContent = dateText;
        if (repliesEl) {
          repliesEl.textContent = replies === 1 ? replySingular : replies + ' ' + replyPluralSuffix;
        }
        if (titleEl) titleEl.textContent = title;
        if (excerptEl) excerptEl.textContent = truncateExcerpt(rawBody);
        if (cardEl) {
          cardEl.setAttribute(
            'href',
            thread.id ? forumBaseHref + '?thread=' + encodeURIComponent(thread.id) : forumBaseHref
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
          } catch (_err) {}
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

writeFile('src/pages/index.astro', indexAstroContent);

const donateAstroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import siteConfig from '../data/siteConfig.json';
import { getLocaleFromPathname, localizePath, getPageData } from '../utils/i18n';

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const page = getPageData('donate', currentLocale);
const tiers = Array.isArray(page.tiers) ? page.tiers : [];
---

<BaseLayout
  title={page.metaTitle}
  description={page.metaDescription}
>
  <!-- STANDARDIZED_SCROLL_HEADER_START -->
  <div class="scroll-title-block">
    <div class="scroll-eyebrow">{page.eyebrow}</div>
    <h1 class="page-heading">{page.heading}</h1>
    <div class="page-subtitle">{page.subtitle}</div>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">{page.kanji}</div>
    <div class="line"></div>
  </div>
  <!-- STANDARDIZED_SCROLL_HEADER_END -->

  <section class="py-8 border-b border-[#1C1A17]/15">
    <div class="essay-prose">
      <p>{page.introBody}</p>
    </div>
  </section>

  <section class="py-10 border-b border-[#6E2B25]">
    <div class="flex items-baseline justify-between mb-6">
      <h2 class="font-heading text-2xl sm:text-3xl font-semibold uppercase tracking-wider text-[#1C1A17]">
        {page.tiersHeading}
      </h2>
      <span class="font-jp text-xs text-[#6E2B25] tracking-widest">{page.tiersJp}</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {tiers.map((tier: any) => (
        <a
          href={siteConfig.stripeDonationUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="group block border border-[#1C1A17]/25 hover:border-[#6E2B25] bg-[#D8CEB8]/35 hover:bg-[#D8CEB8]/65 p-6 transition-all"
        >
          <div class="flex items-center justify-between font-mono text-xs text-[#6E2B25] mb-2">
            <span>{tier.jp}</span>
            <span class="px-2 py-0.5 border border-[#6E2B25] group-hover:bg-[#6E2B25] group-hover:text-[#E6DFCF] transition-colors">
              {tier.amount}
            </span>
          </div>

          <h3 class="font-heading text-xl font-bold text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors mb-2">
            {tier.title}
          </h3>

          <p class="font-body text-sm sm:text-base text-[#524D46] leading-relaxed mb-4">
            {tier.description}
          </p>

          <span class="font-mono text-[11px] uppercase tracking-widest text-[#6E2B25] group-hover:underline underline-offset-4">
            {page.selectOfferingCta}
          </span>
        </a>
      ))}
    </div>

    <div class="border border-[#6E2B25] bg-[#D8CEB8]/50 p-6 sm:p-8 text-center">
      <a
        href={siteConfig.stripeDonationUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block w-full sm:w-auto bg-[#6E2B25] hover:bg-[#8C3B33] text-[#E6DFCF] font-mono text-sm uppercase tracking-widest px-8 py-4 transition-colors mb-4"
      >
        {page.primaryStripeCta}
      </a>

      <div class="pt-2">
        <a
          href={localizePath('/finances', currentLocale)}
          class="font-mono text-xs text-[#1C1A17] hover:text-[#6E2B25] underline underline-offset-4 transition-colors"
        >
          {page.ledgerLinkText}
        </a>
      </div>
    </div>
  </section>
</BaseLayout>
`;

writeFile('src/pages/donate.astro', donateAstroContent);

const creditsAstroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getLocaleFromPathname, localizePath, getPageData } from '../utils/i18n';

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const ui = getPageData('credits-ui', currentLocale);
const creditsData = getPageData('credits', currentLocale);
const sections = Array.isArray(creditsData.sections) ? creditsData.sections : [];
---

<BaseLayout
  title={ui.metaTitle}
  description={ui.metaDescription}
>
  <!-- STANDARDIZED_SCROLL_HEADER_START -->
  <div class="scroll-title-block">
    <div class="scroll-eyebrow">{ui.eyebrow}</div>
    <h1 class="page-heading">{ui.heading}</h1>
    <div class="page-subtitle">{ui.subtitle}</div>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">{ui.kanji}</div>
    <div class="line"></div>
  </div>
  <!-- STANDARDIZED_SCROLL_HEADER_END -->

  <div class="py-8 space-y-12">
    {sections.map((section: any, idx: number) => (
      <section>
        <div class="flex items-baseline justify-between pb-3 mb-4 border-b border-[#6E2B25]">
          <h2 class="font-heading text-2xl sm:text-3xl font-semibold tracking-wider uppercase text-[#1C1A17]">
            {section.title}
          </h2>
          <span class="font-mono text-xs text-[#6E2B25] uppercase tracking-widest">
            {ui.bookPrefix}{idx + 1}
          </span>
        </div>

        <div class="divide-y divide-[#1C1A17]/15 border-b border-[#1C1A17]/15">
          {Array.isArray(section.entries) && section.entries.length > 0 ? (
            section.entries.map((entry: any) => (
              <div class="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
                <div class="sm:col-span-5">
                  <h3 class="font-heading text-xl font-bold text-[#1C1A17]">
                    {entry.name}
                  </h3>
                  <div class="font-mono text-xs text-[#6E2B25] mt-0.5">
                    <span>{entry.locationOrRole}</span>
                    {entry.date && (
                      <span class="text-[#524D46]"> · {entry.date}</span>
                    )}
                  </div>
                </div>

                <div class="sm:col-span-7">
                  <p class="font-body text-base text-[#1C1A17]/90 leading-relaxed">
                    {entry.note}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p class="py-6 font-mono text-xs text-[#524D46]">
              {ui.emptySectionText}
            </p>
          )}
        </div>
      </section>
    ))}
  </div>

  <section class="pt-4">
    <div class="border border-[#1C1A17]/20 bg-[#D8CEB8]/40 p-6 sm:p-8 text-center">
      <p class="font-jp text-sm text-[#6E2B25] tracking-widest mb-2">
        {ui.calloutJp}
      </p>
      <h3 class="font-heading text-2xl font-semibold text-[#1C1A17] mb-2">
        {ui.calloutHeading}
      </h3>
      <p class="font-body text-base text-[#524D46] max-w-xl mx-auto mb-6">
        {ui.calloutBody}
      </p>
      <div class="flex flex-wrap justify-center gap-4">
        <a
          href={localizePath('/donate', currentLocale)}
          class="inline-block bg-[#6E2B25] hover:bg-[#8C3B33] text-[#E6DFCF] font-mono text-xs uppercase tracking-widest px-5 py-3 transition-colors"
        >
          {ui.offerOsettaiBtn}
        </a>
        <a
          href={localizePath('/finances', currentLocale)}
          class="inline-block border border-[#1C1A17]/30 hover:border-[#6E2B25] text-[#1C1A17] hover:text-[#6E2B25] font-mono text-xs uppercase tracking-widest px-5 py-3 transition-colors"
        >
          {ui.viewLedgerBtn}
        </a>
      </div>
    </div>
  </section>
</BaseLayout>
`;

writeFile('src/pages/credits.astro', creditsAstroContent);

const faqAstroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getLocaleFromPathname, localizePath, getPageData } from '../utils/i18n';

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const ui = getPageData('faq-ui', currentLocale);
const faqData = getPageData('faq', currentLocale);
const categories = Array.isArray(faqData.categories) ? faqData.categories : [];
---

<BaseLayout
  title={ui.metaTitle}
  description={ui.metaDescription}
>
  <!-- STANDARDIZED_SCROLL_HEADER_START -->
  <div class="scroll-title-block">
    <div class="scroll-eyebrow">{ui.eyebrow}</div>
    <h1 class="page-heading">{ui.heading}</h1>
    <div class="page-subtitle">{ui.subtitle}</div>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">{ui.kanji}</div>
    <div class="line"></div>
  </div>
  <!-- STANDARDIZED_SCROLL_HEADER_END -->

  <div class="py-6 space-y-12">
    {categories.map((category: any, catIndex: number) => (
      <section>
        <div class="flex items-baseline justify-between pb-3 mb-2 border-b border-[#6E2B25]">
          <h2 class="font-heading text-2xl sm:text-3xl font-semibold tracking-wider uppercase text-[#1C1A17]">
            {category.categoryName}
          </h2>
          <span class="font-mono text-xs text-[#6E2B25]">
            0{catIndex + 1}
          </span>
        </div>

        <div class="divide-y divide-[#1C1A17]/15">
          {Array.isArray(category.items) &&
            category.items.map((item: any) => (
              <details class="group border-b border-[#1C1A17]/15 py-4">
                <summary class="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span class="font-heading text-xl sm:text-2xl font-semibold text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors">
                    {item.question}
                  </span>
                  <span class="shrink-0 font-mono text-lg text-[#6E2B25] select-none">
                    <span class="group-open:hidden">+</span>
                    <span class="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <div class="mt-3 pr-6 font-body text-base sm:text-lg text-[#1C1A17]/90 leading-relaxed">
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
        </div>
      </section>
    ))}
  </div>

  <section class="mt-6 pt-8 border-t border-[#6E2B25]">
    <div class="border border-[#1C1A17]/20 bg-[#D8CEB8]/40 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="font-heading text-xl font-semibold text-[#1C1A17] mb-1">
          {ui.bottomHeading}
        </h3>
        <p class="font-body text-sm sm:text-base text-[#524D46]">
          {ui.bottomBody}
        </p>
      </div>
      <a
        href={localizePath('/essays', currentLocale)}
        class="inline-block text-center bg-[#6E2B25] hover:bg-[#8C3B33] text-[#E6DFCF] font-mono text-xs uppercase tracking-widest px-5 py-3 transition-colors shrink-0"
      >
        {ui.bottomBtn}
      </a>
    </div>
  </section>
</BaseLayout>
`;

writeFile('src/pages/faq.astro', faqAstroContent);

const essaysIndexAstroContent = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import {
  getLocaleFromPathname,
  localizePath,
  getPageData,
  getDateLocaleTag,
  applyEssayTranslation,
} from '../../utils/i18n';

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const ui = getPageData('essays-ui', currentLocale);
const dateLocaleTag = getDateLocaleTag(currentLocale);

const allEssays = await getCollection('essays', ({ data }) => !data.draft);
const sortedEssays = allEssays
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .map((entry) => applyEssayTranslation(entry, currentLocale));

const totalDispatches = sortedEssays.length;

const formatDate = (date: Date) =>
  date.toLocaleDateString(dateLocaleTag, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
---

<BaseLayout
  title={ui.archiveMetaTitle}
  description={ui.archiveMetaDescription}
>
  <!-- STANDARDIZED_SCROLL_HEADER_START -->
  <div class="scroll-title-block">
    <div class="scroll-eyebrow">{ui.eyebrow}</div>
    <h1 class="page-heading">{ui.heading}</h1>
    <div class="page-subtitle">{ui.subtitle}</div>
  </div>

  <div class="page-break">
    <div class="line"></div>
    <div class="kanji">{ui.kanji}</div>
    <div class="line"></div>
  </div>
  <!-- STANDARDIZED_SCROLL_HEADER_END -->

  <section class="divide-y divide-[#1C1A17]/15">
    {sortedEssays.map((essay, index) => (
      <article class="py-8">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#524D46] mb-2">
          <span class="text-[#6E2B25] font-medium">
            #{String(totalDispatches - index).padStart(2, '0')}
          </span>
          <span aria-hidden="true">·</span>
          <time datetime={essay.data.date.toISOString()}>
            {formatDate(essay.data.date)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{essay.data.location}</span>
          {typeof essay.data.kilometersWalked === 'number' && (
            <>
              <span aria-hidden="true">·</span>
              <span class="text-[#6E2B25] font-medium">
                {ui.kmPrefix} {essay.data.kilometersWalked}
              </span>
            </>
          )}
          {essay.data.readingTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{essay.data.readingTime}</span>
            </>
          )}
        </div>

        <h2 class="font-heading text-2xl sm:text-3xl font-semibold text-[#1C1A17] mb-1 leading-snug">
          <a
            href={localizePath(\`/essays/\${essay.slug}\`, currentLocale)}
            class="hover:text-[#6E2B25] transition-colors"
          >
            {essay.data.title}
          </a>
        </h2>

        {essay.data.subtitle && (
          <p class="font-body italic text-base sm:text-lg text-[#524D46] mb-3">
            {essay.data.subtitle}
          </p>
        )}

        <p class="font-body text-[#1C1A17]/90 leading-relaxed mb-4">
          {essay.data.excerpt}
        </p>

        <a
          href={localizePath(\`/essays/\${essay.slug}\`, currentLocale)}
          class="inline-block font-mono text-xs uppercase tracking-widest text-[#6E2B25] hover:text-[#8C3B33] font-medium transition-colors"
        >
          {ui.readFullDispatchBtn}
        </a>
      </article>
    ))}
  </section>
</BaseLayout>
`;

writeFile('src/pages/essays/index.astro', essaysIndexAstroContent);

const essaysSlugAstroContent = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import siteConfig from '../../data/siteConfig.json';
import { getCollection } from 'astro:content';
import {
  getLocaleFromPathname,
  localizePath,
  getPageData,
  getDateLocaleTag,
  applyEssayTranslation,
} from '../../utils/i18n';

export async function getStaticPaths() {
  const allEssays = await getCollection('essays', ({ data }) => !data.draft);
  const chronological = allEssays.sort(
    (a, b) => a.data.date.valueOf() - b.data.date.valueOf()
  );

  return chronological.map((entry, index) => ({
    params: { slug: entry.slug },
    props: {
      entry,
      prevEssay: index > 0 ? chronological[index - 1] : null,
      nextEssay: index < chronological.length - 1 ? chronological[index + 1] : null,
    },
  }));
}

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const ui = getPageData('essays-ui', currentLocale);
const dateLocaleTag = getDateLocaleTag(currentLocale);

const { entry: rawEntry, prevEssay: rawPrev, nextEssay: rawNext } = Astro.props;
const entry = applyEssayTranslation(rawEntry, currentLocale);
const prevEssay = rawPrev ? applyEssayTranslation(rawPrev, currentLocale) : null;
const nextEssay = rawNext ? applyEssayTranslation(rawNext, currentLocale) : null;
const { Content } = await rawEntry.render();

const formattedDate = entry.data.date.toLocaleDateString(dateLocaleTag, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const showGiscusDrawer =
  siteConfig.features?.enableForum === true &&
  Boolean(siteConfig.giscus?.repoId && siteConfig.giscus.repoId.trim() !== '');
---

<BaseLayout title={entry.data.title} description={entry.data.excerpt}>
  <nav class="mb-6" aria-label="Breadcrumb">
    <a
      href={localizePath('/essays', currentLocale)}
      class="font-mono text-xs uppercase tracking-widest text-[#524D46] hover:text-[#6E2B25] transition-colors"
    >
      {ui.backToDispatches}
    </a>
  </nav>

  <header class="pb-8 border-b border-[#6E2B25]">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#524D46] mb-4">
      <time datetime={entry.data.date.toISOString()} class="text-[#1C1A17] font-medium">
        {formattedDate}
      </time>
      <span aria-hidden="true">·</span>
      <span>{entry.data.location}</span>
      {typeof entry.data.kilometersWalked === 'number' && (
        <>
          <span aria-hidden="true">·</span>
          <span class="px-1.5 py-0.5 border border-[#6E2B25] text-[#6E2B25] font-medium">
            {ui.kmPrefix} {entry.data.kilometersWalked}
          </span>
        </>
      )}
      {entry.data.readingTime && (
        <>
          <span aria-hidden="true">·</span>
          <span>{entry.data.readingTime}</span>
        </>
      )}
    </div>

    <h1 class="font-heading text-3xl sm:text-5xl font-bold text-[#1C1A17] leading-tight mb-3">
      {entry.data.title}
    </h1>

    {entry.data.subtitle && (
      <p class="font-body italic text-lg sm:text-xl text-[#524D46] leading-relaxed">
        {entry.data.subtitle}
      </p>
    )}
  </header>

  <article class="essay-prose max-w-[65ch] mx-auto my-10">
    {entry.translatedBodyHtml ? (
      <Fragment set:html={entry.translatedBodyHtml} />
    ) : (
      <Content />
    )}
  </article>

  <section class="mt-12 pt-8 border-t border-[#6E2B25]">
    <div class="border border-[#1C1A17]/20 bg-[#D8CEB8]/40 p-6 sm:p-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1C1A17]/15">
        <div>
          <span class="font-mono text-[11px] uppercase tracking-widest text-[#6E2B25] block mb-1">
            {ui.shareEyebrow}
          </span>
          <h2 class="font-heading text-xl sm:text-2xl font-semibold text-[#1C1A17]">
            {ui.shareHeading}
          </h2>
        </div>

        <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            id="copy-link-btn"
            type="button"
            data-copy-label={ui.copyLinkBtn}
            data-copied-label={ui.linkCopiedBtn}
            class="border border-[#1C1A17]/40 bg-[#E6DFCF] hover:border-[#6E2B25] hover:text-[#6E2B25] text-[#1C1A17] px-3 py-2 uppercase tracking-wider transition-colors"
          >
            {ui.copyLinkBtn}
          </button>

          <button
            id="native-share-btn"
            type="button"
            data-title={entry.data.title}
            data-excerpt={entry.data.excerpt}
            class="hidden border border-[#6E2B25] text-[#6E2B25] hover:bg-[#6E2B25] hover:text-[#E6DFCF] px-3 py-2 uppercase tracking-wider transition-colors"
          >
            {ui.nativeShareBtn}
          </button>

          <a
            id="share-x-link"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[#1C1A17]/25 hover:border-[#6E2B25] text-[#524D46] hover:text-[#6E2B25] px-2.5 py-2 uppercase tracking-wider transition-colors"
          >
            X / Twitter
          </a>

          <a
            id="share-reddit-link"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[#1C1A17]/25 hover:border-[#6E2B25] text-[#524D46] hover:text-[#6E2B25] px-2.5 py-2 uppercase tracking-wider transition-colors"
          >
            Reddit
          </a>

          <a
            id="share-email-link"
            href="#"
            data-email-prefix={ui.shareEmailBodyPrefix}
            class="border border-[#1C1A17]/25 hover:border-[#6E2B25] text-[#524D46] hover:text-[#6E2B25] px-2.5 py-2 uppercase tracking-wider transition-colors"
          >
            Email
          </a>
        </div>
      </div>

      <div class="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p class="font-body text-sm sm:text-base text-[#1C1A17]/85 max-w-md">
          {ui.osettaiPrompt}
        </p>
        <a
          href={localizePath('/donate', currentLocale)}
          class="inline-block text-center bg-[#6E2B25] hover:bg-[#8C3B33] text-[#E6DFCF] font-mono text-xs uppercase tracking-widest px-4 py-3 transition-colors shrink-0"
        >
          {ui.offerOsettaiBtn}
        </a>
      </div>
    </div>

    <nav
      class="grid grid-cols-1 sm:grid-cols-2 border-y border-[#1C1A17]/15 mt-8 divide-y sm:divide-y-0 sm:divide-x divide-[#1C1A17]/15"
      aria-label="Adjacent Dispatches"
    >
      <div class="py-5 sm:pr-6">
        {prevEssay ? (
          <a href={localizePath(\`/essays/\${prevEssay.slug}\`, currentLocale)} class="group block">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              {ui.prevDispatchLabel}
            </span>
            <span class="font-heading text-lg sm:text-xl font-semibold text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors">
              {prevEssay.data.title}
            </span>
          </a>
        ) : (
          <div class="opacity-50">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              {ui.startOfTrailLabel}
            </span>
            <span class="font-heading text-lg text-[#524D46]">
              {ui.firstDispatchText}
            </span>
          </div>
        )}
      </div>

      <div class="py-5 sm:pl-6 sm:text-right">
        {nextEssay ? (
          <a href={localizePath(\`/essays/\${nextEssay.slug}\`, currentLocale)} class="group block">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              {ui.nextDispatchLabel}
            </span>
            <span class="font-heading text-lg sm:text-xl font-semibold text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors">
              {nextEssay.data.title}
            </span>
          </a>
        ) : (
          <div class="opacity-50">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              {ui.currentHorizonLabel}
            </span>
            <span class="font-heading text-lg text-[#524D46]">
              {ui.latestDispatchText}
            </span>
          </div>
        )}
      </div>
    </nav>

    {showGiscusDrawer && (
      <details class="mt-8 border border-[#1C1A17]/20 bg-[#D8CEB8]/25 p-5">
        <summary class="cursor-pointer font-mono text-xs uppercase tracking-widest text-[#1C1A17] hover:text-[#6E2B25] select-none">
          {ui.communityReflectionsSummary}
        </summary>
        <div class="mt-6 pt-4 border-t border-[#1C1A17]/15">
          <script
            src="https://giscus.app/client.js"
            data-repo={siteConfig.giscus.repo}
            data-repo-id={siteConfig.giscus.repoId}
            data-category={siteConfig.giscus.category}
            data-category-id={siteConfig.giscus.categoryId}
            data-mapping="pathname"
            data-strict="0"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="top"
            data-theme="light"
            data-lang={currentLocale}
            crossorigin="anonymous"
            async
          ></script>
        </div>
      </details>
    )}
  </section>

  <script is:inline>
    (function () {
      const pageUrl = window.location.href;
      const pageTitle = document.title;

      const copyBtn = document.getElementById('copy-link-btn');
      const nativeShareBtn = document.getElementById('native-share-btn');
      const xLink = document.getElementById('share-x-link');
      const redditLink = document.getElementById('share-reddit-link');
      const emailLink = document.getElementById('share-email-link');

      if (xLink) {
        xLink.setAttribute(
          'href',
          'https://twitter.com/intent/tweet?text=' +
            encodeURIComponent(pageTitle) +
            '&url=' +
            encodeURIComponent(pageUrl)
        );
      }

      if (redditLink) {
        redditLink.setAttribute(
          'href',
          'https://www.reddit.com/submit?url=' +
            encodeURIComponent(pageUrl) +
            '&title=' +
            encodeURIComponent(pageTitle)
        );
      }

      if (emailLink) {
        const prefix = emailLink.getAttribute('data-email-prefix') || 'Read this dispatch from Camino Henro: ';
        emailLink.setAttribute(
          'href',
          'mailto:?subject=' +
            encodeURIComponent(pageTitle) +
            '&body=' +
            encodeURIComponent(prefix + pageUrl)
        );
      }

      if (copyBtn) {
        copyBtn.addEventListener('click', async function () {
          const originalLabel = copyBtn.getAttribute('data-copy-label') || 'Copy Direct Link';
          const copiedLabel = copyBtn.getAttribute('data-copied-label') || '✓ Link Copied';
          try {
            await navigator.clipboard.writeText(window.location.href);
            copyBtn.textContent = copiedLabel;
          } catch (_err) {
            const tempInput = document.createElement('input');
            tempInput.value = window.location.href;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            copyBtn.textContent = copiedLabel;
          }
          setTimeout(function () {
            copyBtn.textContent = originalLabel;
          }, 2500);
        });
      }

      if (nativeShareBtn && typeof navigator.share === 'function') {
        nativeShareBtn.classList.remove('hidden');
        nativeShareBtn.addEventListener('click', function () {
          const title = nativeShareBtn.getAttribute('data-title') || document.title;
          const text = nativeShareBtn.getAttribute('data-excerpt') || '';
          navigator
            .share({
              title: title,
              text: text,
              url: window.location.href,
            })
            .catch(function () {});
        });
      }
    })();
  </script>
</BaseLayout>
`;

writeFile('src/pages/essays/[slug].astro', essaysSlugAstroContent);

// Update the 5 Coming Soon pages (finances, forum, gallery, inventory, map)
const comingSoonPageNames = ['finances', 'forum', 'gallery', 'inventory', 'map'];
for (const pageName of comingSoonPageNames) {
  const csPageContent = `---
import UnderConstructionLayout from '../layouts/UnderConstructionLayout.astro';
import { getLocaleFromPathname, getPageData } from '../utils/i18n';

const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const cs = getPageData('coming-soon', currentLocale);
const pageData = cs.pages?.${pageName} || {};
---
<UnderConstructionLayout
  title={pageData.title}
  plans={pageData.plansHtml}
  previewHref="/preview/${pageName}"
/>
`;
  writeFile(`src/pages/${pageName}.astro`, csPageContent);
}

// ============================================================================
// 6. AUTO-GENERATE MULTI-LANGUAGE ROUTES (src/pages/[lang]/...)
//    Supports /pt/..., /es/..., /fr/..., /ja/... for every page & essay!
// ============================================================================

function adjustRelativeImports(code) {
  return code
    .replace(/from\s+['"]\.\.\/\.\.\//g, "from '../../../")
    .replace(/from\s+['"]\.\.\//g, "from '../../");
}

function createStandardLangRoute(relPagePath) {
  const srcFull = path.join(root, 'src/pages', relPagePath);
  const raw = fs.readFileSync(srcFull, 'utf8');
  const adjusted = adjustRelativeImports(raw);

  const staticPathsBlock = `
export function getStaticPaths() {
  return [
    { params: { lang: 'pt' } },
    { params: { lang: 'es' } },
    { params: { lang: 'fr' } },
    { params: { lang: 'ja' } },
  ];
}
`;

  const withStaticPaths = adjusted.replace(/^---\r?\n/, '---\n' + staticPathsBlock);
  writeFile(path.join('src/pages/[lang]', relPagePath), withStaticPaths);
}

const standardRoutes = [
  'index.astro',
  'donate.astro',
  'credits.astro',
  'faq.astro',
  'finances.astro',
  'forum.astro',
  'gallery.astro',
  'inventory.astro',
  'map.astro',
  'essays/index.astro',
];

for (const route of standardRoutes) {
  createStandardLangRoute(route);
}

// Special handler for src/pages/[lang]/essays/[slug].astro (combines lang x slug)
const rawSlugPage = fs.readFileSync(path.join(root, 'src/pages/essays/[slug].astro'), 'utf8');
const adjustedSlugPage = adjustRelativeImports(rawSlugPage).replace(
  /export async function getStaticPaths\(\) \{[\s\S]*?\n\}/,
  `export async function getStaticPaths() {
  const allEssays = await getCollection('essays', ({ data }) => !data.draft);
  const chronological = allEssays.sort(
    (a, b) => a.data.date.valueOf() - b.data.date.valueOf()
  );
  const langs = ['pt', 'es', 'fr', 'ja'];

  return langs.flatMap((lang) =>
    chronological.map((entry, index) => ({
      params: { lang, slug: entry.slug },
      props: {
        entry,
        prevEssay: index > 0 ? chronological[index - 1] : null,
        nextEssay: index < chronological.length - 1 ? chronological[index + 1] : null,
      },
    }))
  );
}`
);
writeFile('src/pages/[lang]/essays/[slug].astro', adjustedSlugPage);

// ============================================================================
// 7. UPDATE .pages.yml WITH DEDICATED TRANSLATIONS INBOX & PAGE TEXT TABS
// ============================================================================

const pagesYmlPath = path.join(root, '.pages.yml');
if (fs.existsSync(pagesYmlPath)) {
  let yml = fs.readFileSync(pagesYmlPath, 'utf8');

  // Remove any previous translationInbox block if re-running
  yml = yml.replace(/\n  - name: translationInbox[\s\S]*$/, '\n');

  const newYmlTabs = `
  - name: translationInbox
    label: "Translations Staging Inbox"
    type: file
    path: src/data/translation-inbox.json
    format: json
    fields:
      - name: notice
        label: How This Inbox Works
        type: text
      - name: items
        label: Updated Pages & Essays Awaiting Decision
        type: object
        list: true
        fields:
          - name: id
            label: Item ID
            type: string
          - name: title
            label: Page or Essay Name
            type: string
          - name: itemType
            label: Content Type
            type: select
            options:
              values:
                - { label: "Essay", value: "essay" }
                - { label: "Website Page", value: "page" }
          - name: sourcePath
            label: Source File Path
            type: string
          - name: lastModified
            label: Change Detected On
            type: string
          - name: action
            label: Translation Decision
            type: select
            options:
              values:
                - { label: "Pending (Keep in Inbox)", value: "pending" }
                - { label: "Translate Now (PT-PT, ES, FR, JA)", value: "translate" }
                - { label: "Ignore Change (Dismiss from Inbox)", value: "ignore" }

  - name: pageHome
    label: "Page Text: Home Page"
    type: file
    path: src/data/pages/home.json
    format: json
    fields:
      - name: eyebrow
        label: Top Route Eyebrow
        type: string
      - name: heading
        label: Main Heading
        type: string
      - name: subtitle
        label: Tagline Subtitle
        type: string
      - name: manifestoDivider
        label: Manifesto Divider Title
        type: string
      - name: manifestoQuoteLine1
        label: Manifesto Quote (Line 1)
        type: text
      - name: manifestoQuoteLine2
        label: Manifesto Quote (Line 2)
        type: text
      - name: manifestoQuoteLine3
        label: Manifesto Quote (Line 3)
        type: string
      - name: manifestoQuoteLine4
        label: Manifesto Quote (Line 4)
        type: string
      - name: manifestoBodyHtml
        label: Manifesto Body Paragraph (HTML allowed)
        type: text
      - name: essaysDivider
        label: Latest Essays Divider Title
        type: string
      - name: essayNumberPrefix
        label: Essay Number Prefix
        type: string
      - name: unrollEssayLink
        label: Unroll Essay Link Text
        type: string
      - name: viewArchiveBtn
        label: View Archive Button Text
        type: string
      - name: courtyardDivider
        label: Forum Spotlight Divider Title
        type: string
      - name: spotlightLabel
        label: Spotlight Header Label
        type: string
      - name: mostPopularTab
        label: Most Popular Button Label
        type: string
      - name: latestInquiryTab
        label: Latest Inquiry Button Label
        type: string
      - name: enterCourtyardLink
        label: Enter Courtyard Link Text
        type: string

  - name: pageDonate
    label: "Page Text: Donate (Osettai)"
    type: file
    path: src/data/pages/donate.json
    format: json
    fields:
      - name: metaTitle
        label: Browser Tab Title
        type: string
      - name: metaDescription
        label: Meta Description
        type: text
      - name: eyebrow
        label: Top Eyebrow
        type: string
      - name: heading
        label: Page Heading
        type: string
      - name: subtitle
        label: Page Subtitle
        type: string
      - name: introBody
        label: Philosophical Explanation Paragraph
        type: text
      - name: tiersHeading
        label: Tiers Section Heading
        type: string
      - name: selectOfferingCta
        label: Tier Card Link Text
        type: string
      - name: primaryStripeCta
        label: Main Stripe Button Text
        type: string
      - name: ledgerLinkText
        label: Financial Ledger Link Text
        type: string
      - name: tiers
        label: Contribution Tiers
        type: object
        list: true
        fields:
          - name: title
            label: Tier Title
            type: string
          - name: amount
            label: Amount Badge
            type: string
          - name: jp
            label: Japanese Subtitle
            type: string
          - name: description
            label: Tier Description
            type: text

  - name: pageCreditsUi
    label: "Page Text: Credits Page Headers"
    type: file
    path: src/data/pages/credits-ui.json
    format: json
    fields:
      - name: eyebrow
        label: Top Eyebrow
        type: string
      - name: heading
        label: Page Heading
        type: string
      - name: subtitle
        label: Page Subtitle
        type: string
      - name: emptySectionText
        label: Empty Section Fallback Text
        type: string
      - name: calloutHeading
        label: Bottom Callout Heading
        type: string
      - name: calloutBody
        label: Bottom Callout Body
        type: text
      - name: offerOsettaiBtn
        label: Offer Osettai Button Label
        type: string
      - name: viewLedgerBtn
        label: View Ledger Button Label
        type: string

  - name: pageFaqUi
    label: "Page Text: FAQ Page Headers"
    type: file
    path: src/data/pages/faq-ui.json
    format: json
    fields:
      - name: eyebrow
        label: Top Eyebrow
        type: string
      - name: heading
        label: Page Heading
        type: string
      - name: subtitle
        label: Page Subtitle
        type: string
      - name: bottomHeading
        label: Bottom Callout Heading
        type: string
      - name: bottomBody
        label: Bottom Callout Body
        type: text
      - name: bottomBtn
        label: Bottom Callout Button Label
        type: string

  - name: pageEssaysUi
    label: "Page Text: Essays Archive & Reader UI"
    type: file
    path: src/data/pages/essays-ui.json
    format: json
    fields:
      - name: eyebrow
        label: Archive Top Eyebrow
        type: string
      - name: heading
        label: Archive Heading
        type: string
      - name: subtitle
        label: Archive Subtitle
        type: string
      - name: readFullDispatchBtn
        label: Read Full Dispatch Link
        type: string
      - name: backToDispatches
        label: Back to All Dispatches Link
        type: string
      - name: shareEyebrow
        label: Share Box Eyebrow
        type: string
      - name: shareHeading
        label: Share Box Heading
        type: string
      - name: osettaiPrompt
        label: Essay Footer Osettai Prompt
        type: text
      - name: offerOsettaiBtn
        label: Essay Footer Osettai Button
        type: string

  - name: pageComingSoon
    label: "Page Text: Coming Soon Pages"
    type: file
    path: src/data/pages/coming-soon.json
    format: json
    fields:
      - name: sharedHeading
        label: Main Cursive Heading
        type: string
      - name: sharedMessageHtml
        label: Shared Patience Message (HTML allowed)
        type: text
      - name: sneakPreviewBeforeLink
        label: Sneak Preview Text (Before Link)
        type: string
      - name: sneakPreviewLinkText
        label: Sneak Preview Link Text
        type: string
      - name: sneakPreviewAfterLink
        label: Sneak Preview Text (After Link)
        type: string

  - name: pageGlobalUi
    label: "Page Text: Header, Footer & Newsletter"
    type: file
    path: src/data/pages/global-ui.json
    format: json
    fields:
      - name: header
        label: Header Navigation Labels
        type: object
        fields:
          - name: home
            label: Home
            type: string
          - name: blog
            label: Blog
            type: string
          - name: faq
            label: FAQ
            type: string
          - name: credits
            label: Credits
            type: string
          - name: comingSoon
            label: Coming Soon Dropdown
            type: string
          - name: donateBtn
            label: Donate Button
            type: string
      - name: footer
        label: Scroll Footer Hint
        type: object
        fields:
          - name: scrollFootHint
            label: Bottom Roller Hint Text
            type: string
      - name: newsletter
        label: Global Newsletter Footer Box
        type: object
        fields:
          - name: eyebrow
            label: Newsletter Eyebrow
            type: string
          - name: heading
            label: Newsletter Heading
            type: string
          - name: copy
            label: Newsletter Description
            type: text
          - name: placeholder
            label: Email Input Placeholder
            type: string
          - name: submitBtn
            label: Subscribe Button Text
            type: string
`;

  yml = yml.trimEnd() + '\n' + newYmlTabs;
  fs.writeFileSync(pagesYmlPath, yml, 'utf8');
  console.log('✓ Updated .pages.yml with Translations Staging Inbox and Page Text tabs');
}

console.log('\n🎉 Step 20 Complete! Run "npm run dev" to test the Language Dropdown and JSON-backed pages.');