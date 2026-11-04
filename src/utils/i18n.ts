import siteConfig from '../data/siteConfig.json';
import enUiStrings from '../data/uiStrings.json';

const localeUiModules = import.meta.glob('../data/i18n/*/uiStrings.json', { eager: true });
const localeDataModules = import.meta.glob('../data/i18n/*/*.json', { eager: true });
const rootDataModules = import.meta.glob('../data/*.json', { eager: true });

export interface LocaleConfig {
  code: string;
  label: string;
  name: string;
  flag: string;
  enabled: boolean;
}

export function getEnabledLocales(): LocaleConfig[] {
  const raw = siteConfig?.i18n?.locales;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter((l) => l.enabled !== false);
  }
  return [{ code: 'en', label: 'EN', name: 'English', flag: '🇬🇧', enabled: true }];
}

export function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0]?.toLowerCase();
  const enabledCodes = getEnabledLocales()
    .map((l) => l.code.toLowerCase())
    .filter((c) => c !== 'en');
  if (first && enabledCodes.includes(first)) {
    return first;
  }
  return 'en';
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0]?.toLowerCase();
  const enabledCodes = getEnabledLocales()
    .map((l) => l.code.toLowerCase())
    .filter((c) => c !== 'en');
  if (first && enabledCodes.includes(first)) {
    const rest = '/' + segments.slice(1).join('/');
    return rest === '/' ? '/' : rest.replace(/\/+$/, '');
  }
  return pathname === '/' ? '/' : pathname.replace(/\/+$/, '') || '/';
}

export function localizeHref(href: string, locale: string): string {
  if (!href || !href.startsWith('/')) return href;
  const cleanBase = stripLocalePrefix(href);
  if (!locale || locale === 'en') return cleanBase;
  return cleanBase === '/' ? `/${locale}` : `/${locale}${cleanBase}`;
}

export function getUiStrings(locale: string): typeof enUiStrings {
  if (!locale || locale === 'en') return enUiStrings;
  const key = `../data/i18n/${locale}/uiStrings.json`;
  const mod = localeUiModules[key] as any;
  const localized = mod?.default || mod;
  if (!localized) return enUiStrings;
  return {
    ...enUiStrings,
    ...localized,
    nav: { ...enUiStrings.nav, ...(localized.nav || {}) },
    banners: { ...enUiStrings.banners, ...(localized.banners || {}) },
    home: { ...enUiStrings.home, ...(localized.home || {}) },
    essays: { ...enUiStrings.essays, ...(localized.essays || {}) },
    faq: { ...enUiStrings.faq, ...(localized.faq || {}) },
    credits: { ...enUiStrings.credits, ...(localized.credits || {}) },
    inventory: { ...enUiStrings.inventory, ...(localized.inventory || {}) },
    map: { ...enUiStrings.map, ...(localized.map || {}) },
    finances: { ...enUiStrings.finances, ...(localized.finances || {}) },
    newsletter: { ...enUiStrings.newsletter, ...(localized.newsletter || {}) },
  };
}

export function getLocalizedDataFile<T = any>(fileName: string, locale: string): T {
  if (locale && locale !== 'en') {
    const locKey = `../data/i18n/${locale}/${fileName}`;
    const locMod = localeDataModules[locKey] as any;
    if (locMod) return (locMod.default || locMod) as T;
  }
  const rootKey = `../data/${fileName}`;
  const rootMod = rootDataModules[rootKey] as any;
  return (rootMod?.default || rootMod || {}) as T;
}
