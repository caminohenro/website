import fs from 'node:fs';
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
  const replaced = clean.replace(/^\/(pt|es|fr|ja)(?=\/|$)/i, '');
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
