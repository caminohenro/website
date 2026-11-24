import fs from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const CONFIG = {
  // Replace with your Substack Newsletter sectionId (or set SUBSTACK_NEWSLETTER_SECTION_ID in GitHub Secrets/env)
  NEWSLETTER_SECTION_ID: process.env.SUBSTACK_NEWSLETTER_SECTION_ID || 'YOUR_NEWSLETTER_SECTION_ID',
  SUBSTACK_BASE_URL: 'https://caminohenro.substack.com',
  // Optional: If your proxies accept ?sectionId=..., they will fetch this section automatically.
  // Otherwise, create a second proxy endpoint or leave blank to use direct Substack first.
  CLOUDFLARE_PROXY_URL: 'https://substack-proxy.caminohenro.workers.dev',
  GOOGLE_PROXY_URL: process.env.GOOGLE_SUBSTACK_PROXY_URL || '',
  OUTPUT_FILE: path.resolve('src/data/newsletter-log.json'),
  // Optional secondary safety filter if your newsletter links share a section slug (leave '' to accept all items from the section feed)
  REQUIRED_URL_SUBSTRING: '',
};

function buildFeedUrl(baseUrl, sectionId) {
  if (!baseUrl) return '';
  const hasId = sectionId && sectionId !== 'YOUR_NEWSLETTER_SECTION_ID';
  if (!hasId) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}sectionId=${encodeURIComponent(sectionId)}`;
}

function stripHtml(raw = '') {
  return String(raw)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatIsoDate(pubDate) {
  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

async function fetchRssXml() {
  const sources = [
    {
      name: 'Direct Substack',
      url: buildFeedUrl(`${CONFIG.SUBSTACK_BASE_URL}/feed`, CONFIG.NEWSLETTER_SECTION_ID),
    },
    {
      name: 'Cloudflare Worker Proxy',
      url: buildFeedUrl(CONFIG.CLOUDFLARE_PROXY_URL, CONFIG.NEWSLETTER_SECTION_ID),
    },
    {
      name: 'Google Apps Script Proxy',
      url: buildFeedUrl(CONFIG.GOOGLE_PROXY_URL, CONFIG.NEWSLETTER_SECTION_ID),
    },
  ].filter((s) => Boolean(s.url));

  let lastError = 'No feed sources configured.';

  for (const source of sources) {
    try {
      console.log(`Fetching Newsletter RSS via ${source.name}: ${source.url}`);
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'CaminoHenro-NewsletterLog/1.0 (+https://caminohenro.world)',
          Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        },
      });

      const body = await response.text();
      if (response.ok && /<rss\b/i.test(body) && /<channel\b/i.test(body)) {
        return body;
      }

      const retryAfter = response.headers.get('retry-after');
      lastError = `${source.name} -> HTTP ${response.status}${retryAfter ? ` (Retry-After: ${retryAfter}s)` : ''} (invalid or blocked XML)`;
      console.warn(`⚠️ ${lastError}`);
    } catch (err) {
      lastError = `${source.name} -> ${err.message}`;
      console.warn(`⚠️ ${lastError}`);
    }
  }

  throw new Error(`All newsletter RSS fetch attempts failed. Last error: ${lastError}`);
}

async function run() {
  let existingData = {
    lastSyncedAt: null,
    substackHomeUrl: CONFIG.SUBSTACK_BASE_URL,
    subscribeUrl: `${CONFIG.SUBSTACK_BASE_URL}/subscribe`,
    entries: [],
  };

  try {
    const rawExisting = await fs.readFile(CONFIG.OUTPUT_FILE, 'utf8');
    existingData = { ...existingData, ...JSON.parse(rawExisting) };
  } catch {
    // First run; file will be created
  }

  const xml = await fetchRssXml();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const byKey = new Map();
  for (const entry of existingData.entries || []) {
    const key = entry.guid || entry.substackUrl;
    if (key) byKey.set(key, entry);
  }

  for (const item of items) {
    const link = String(item.link || '').trim();
    if (!link) continue;
    if (CONFIG.REQUIRED_URL_SUBSTRING && !link.includes(CONFIG.REQUIRED_URL_SUBSTRING)) {
      continue;
    }

    const guid = String(
      typeof item.guid === 'object' ? item.guid['#text'] || link : item.guid || link
    ).trim();

    const title = stripHtml(item.title || 'Untitled Newsletter');
    const excerpt = stripHtml(item.description || '').slice(0, 220);
    const date = formatIsoDate(item.pubDate);
    const prev = byKey.get(guid) || byKey.get(link) || {};

    byKey.set(guid, {
      guid,
      title,
      subtitle: excerpt || prev.subtitle || '',
      date: date || prev.date || '',
      substackUrl: link,
      // Preserve optional manual annotations (location, kmMarker, custom paid status)
      location: prev.location || null,
      kmMarker: prev.kmMarker ?? null,
      isArchivedPaid: prev.isArchivedPaid ?? null,
    });
  }

  // Sort newest first; auto-tag older issues as paid archive unless manually overridden
  const sorted = [...byKey.values()].sort((a, b) =>
    String(b.date || '').localeCompare(String(a.date || ''))
  );

  const total = sorted.length;
  const enriched = sorted.map((entry, idx) => ({
    ...entry,
    issueNumber: total - idx,
    // Latest issue (index 0) defaults to open/current; older monthly issues default to paid archive
    isArchivedPaid:
      typeof entry.isArchivedPaid === 'boolean' ? entry.isArchivedPaid : idx > 0,
  }));

  const output = {
    lastSyncedAt: new Date().toISOString(),
    substackHomeUrl: CONFIG.SUBSTACK_BASE_URL,
    subscribeUrl: `${CONFIG.SUBSTACK_BASE_URL}/subscribe`,
    entries: enriched,
  };

  await fs.writeFile(CONFIG.OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`✅ Synced ${enriched.length} newsletter log entries to ${CONFIG.OUTPUT_FILE}`);
}

run().catch((err) => {
  console.error('❌ Newsletter sync error:', err.message);
  process.exit(1);
});