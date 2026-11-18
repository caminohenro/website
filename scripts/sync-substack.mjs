import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  // Tried in order until one returns valid RSS XML:
  FEED_SOURCES: [
    {
      name: 'Direct Substack',
      url: 'https://caminohenro.substack.com/feed',
    },
    {
      name: 'Cloudflare Worker Proxy',
      url: 'https://substack-proxy.caminohenro.workers.dev',
    },
    {
      name: 'Google Apps Script Proxy',
      // Replace with your deployed Google Apps Script Web App URL (ends in /exec)
      url: 'https://script.google.com/macros/s/AKfycbxkfGlZ5FuwwQq3ESOEgjbECvvEp5kcfEEur_2bkONskw2w4MipujBIvi-3tXhfXhIu/exec',
    },
  ],

  ESSAYS_DIR: 'src/content/essays',
  STATE_FILE: 'src/data/substack-synced.json',

  // Toggle: Convert Substack horizontal dividers (---) into Camino Henro Kanji breaks
  ENABLE_KANJI_BREAKS: false,
  KANJI_BREAK_CHAR: '道',

  WORDS_PER_MINUTE: 200,
  DRY_RUN: false,
  FETCH_TIMEOUT_MS: 15000,
};

const KANJI_BREAK_HTML = `\n\n<div class="page-break">\n  <div class="line"></div>\n  <div class="kanji">${CONFIG.KANJI_BREAK_CHAR}</div>\n  <div class="line"></div>\n</div>\n\n`;

// ============================================================================
// HELPERS
// ============================================================================
function slugify(text) {
  return String(text || 'untitled')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Pure-JS HTML entity decoder (fixes &#8220;, &#8217;, &quot;, &mdash;, etc.)
function decodeHtmlEntities(input) {
  if (input == null) return '';
  const named = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    mdash: '—',
    ndash: '–',
    hellip: '…',
    lsquo: '‘',
    rsquo: '’',
    ldquo: '“',
    rdquo: '”',
  };

  return String(input)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&([a-zA-Z]+);/g, (match, name) => named[name] ?? match);
}

function escapeYaml(str) {
  return decodeHtmlEntities(str)
    .replace(/\r?\n/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .trim();
}

function calculateReadingTime(markdownText) {
  const plainText = String(markdownText || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~\-]+/g, ' ')
    .trim();

  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(wordCount / CONFIG.WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function loadSyncedState(statePath) {
  if (!fs.existsSync(statePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cleanSubstackHtml(rawHtml) {
  const $ = cheerio.load(rawHtml || '', null, false);

  // Strip Substack UI clutter and heading anchor buttons
  $(
    [
      '.subscription-widget-wrap',
      '.subscribe-widget',
      '.button-wrapper',
      '.share-dialog',
      '.pencraft',
      '.header-anchor-post',
      '.header-anchor-widget',
      'script',
      'style',
      'iframe[src*="substack.com/embed"]',
    ].join(', ')
  ).remove();

  // Unwrap Substack's header-anchor-parent wrappers so <h2>/<h3>/<h4> remain clean
  $('.header-anchor-parent').each((_, el) => {
    const $el = $(el);
    $el.replaceWith($el.html() || '');
  });

  // Unwrap Substack's clickable image links so Turndown outputs clean ![alt](src)
  $('a.image-link').each((_, el) => {
    const $el = $(el);
    $el.replaceWith($el.html() || '');
  });

  // Convert <figure> captions into clean italicized text below the image
  $('figure').each((_, el) => {
    const $fig = $(el);
    const img = $fig.find('img').first();
    const caption = $fig.find('figcaption').text().trim();
    if (img.length) {
      const alt = img.attr('alt') || caption || '';
      const src = img.attr('src') || '';
      let replacement = `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}" />`;
      if (caption) {
        replacement += `<p><em>${caption}</em></p>`;
      }
      $fig.replaceWith(replacement);
    }
  });

  return $.html();
}

function buildTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });

  td.addRule('horizontalRule', {
    filter: 'hr',
    replacement: () => (CONFIG.ENABLE_KANJI_BREAKS ? KANJI_BREAK_HTML : '\n\n---\n\n'),
  });

  return td;
}

async function fetchRssWithFallbacks() {
  const activeSources = CONFIG.FEED_SOURCES.filter(
    (s) => s.url && !s.url.includes('YOUR_GOOGLE_SCRIPT_ID')
  );

  const errors = [];

  for (const source of activeSources) {
    console.log(`Trying [${source.name}]: ${source.url}`);
    try {
      const response = await fetch(source.url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(CONFIG.FETCH_TIMEOUT_MS),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after');
        const msg = `${source.name}: HTTP ${response.status} ${response.statusText}${
          retryAfter ? ` (Retry-After: ${retryAfter}s)` : ''
        }`;
        console.warn(`⚠️ ${msg}`);
        errors.push(msg);
        continue;
      }

      const text = await response.text();

      // Verify the body is real RSS XML (catches Apps Script error text or Cloudflare HTML challenge pages)
      if (!text.includes('<rss') && !text.includes('<channel>')) {
        const preview = text.trim().slice(0, 120).replace(/\s+/g, ' ');
        const msg = `${source.name}: HTTP 200 but did not return valid RSS XML ("${preview}")`;
        console.warn(`⚠️ ${msg}`);
        errors.push(msg);
        continue;
      }

      console.log(`✅ Fetched valid RSS XML via [${source.name}]`);
      return text;
    } catch (err) {
      const msg = `${source.name}: ${err.message}`;
      console.warn(`⚠️ ${msg}`);
      errors.push(msg);
    }
  }

  throw new Error(`All RSS sources failed:\n  - ${errors.join('\n  - ')}`);
}

// ============================================================================
// MAIN SYNC PIPELINE
// ============================================================================
async function syncSubstack() {
  const xml = await fetchRssWithFallbacks();

  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: '__cdata',
  });
  const feed = parser.parse(xml);

  const rawItems = feed?.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  if (items.length === 0) {
    console.log('No articles found in RSS feed.');
    return;
  }

  const statePath = path.resolve(CONFIG.STATE_FILE);
  const essaysDir = path.resolve(CONFIG.ESSAYS_DIR);
  const syncedIds = new Set(loadSyncedState(statePath));
  const turndown = buildTurndown();

  if (!CONFIG.DRY_RUN) {
    fs.mkdirSync(essaysDir, { recursive: true });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
  }

  let importedCount = 0;

  for (const item of items) {
    const guid = typeof item.guid === 'object' ? item.guid['#text'] : item.guid;
    const link = item.link || '';
    const uniqueId = String(guid || link).trim();

    if (!uniqueId || syncedIds.has(uniqueId)) {
      continue;
    }

    const rawTitle = item.title?.__cdata ?? item.title ?? 'Untitled Essay';
    const rawDesc = item.description?.__cdata ?? item.description ?? '';
    const rawHtml = item['content:encoded']?.__cdata ?? item['content:encoded'] ?? rawDesc;

    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    const isoDate = Number.isNaN(pubDate.getTime())
      ? new Date().toISOString().slice(0, 10)
      : pubDate.toISOString().slice(0, 10);

    let tagsArray = [];
    if (item.category) {
      const cats = Array.isArray(item.category) ? item.category : [item.category];
      tagsArray = cats
        .map((c) => (typeof c === 'object' ? c.__cdata || c['#text'] : c))
        .filter(Boolean)
        .map((c) => `"${escapeYaml(String(c))}"`);
    }

    const urlSlugMatch = link.match(/\/p\/([^/?#]+)/i);
    const slug = slugify(urlSlugMatch ? urlSlugMatch[1] : decodeHtmlEntities(rawTitle));
    const filename = `${slug}.md`;
    const outputPath = path.join(essaysDir, filename);

    const cleanedHtml = cleanSubstackHtml(rawHtml);
    const markdownBody = turndown.turndown(cleanedHtml).trim();
    const readingTime = calculateReadingTime(markdownBody);

    const frontmatter = [
      '---',
      `title: "${escapeYaml(rawTitle)}"`,
      `date: ${isoDate}`,
      `readingTime: "${readingTime}"`,
      `excerpt: "${escapeYaml(rawDesc)}"`,
      `tags: [${tagsArray.join(', ')}]`,
      `substackUrl: "${escapeYaml(link)}"`,
      `source: "substack"`,
      '---',
      '',
    ].join('\n');

    const fullContent = `${frontmatter}\n${markdownBody}\n`;

    if (CONFIG.DRY_RUN) {
      console.log(`[DRY RUN] Would create: ${outputPath} (${readingTime})`);
    } else {
      fs.writeFileSync(outputPath, fullContent, 'utf8');
      syncedIds.add(uniqueId);
      importedCount += 1;
      console.log(`✅ Imported: ${filename} (${readingTime})`);
    }
  }

  if (!CONFIG.DRY_RUN && importedCount > 0) {
    fs.writeFileSync(statePath, JSON.stringify([...syncedIds], null, 2) + '\n', 'utf8');
    console.log(`Sync complete. ${importedCount} new essay(s) added.`);
  } else {
    console.log('Sync complete. No new essays to import.');
  }
}

syncSubstack().catch((err) => {
  console.error('❌ Substack sync failed:', err);
  process.exit(1);
});