import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

// ============================================================================
// CONFIGURATION — Edit these values to match your Substack & Astro setup
// ============================================================================
const CONFIG = {
  // Replace with your actual Substack feed URL (always ends in /feed)
  SUBSTACK_FEED_URL: 'https://caminohenro.substack.com/feed',

  // Where your English Astro essay .md files live
  ESSAYS_DIR: 'src/content/essays',

  // Tracks already-imported Substack GUIDs so manual edits are never overwritten
  STATE_FILE: 'src/data/substack-synced.json',

  // Toggle: Convert Substack horizontal dividers (---) into Camino Henro Kanji breaks
  ENABLE_KANJI_BREAKS: false,
  KANJI_BREAK_CHAR: '道',

  // Set to true during local testing to preview without writing files
  DRY_RUN: false,
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

function escapeYaml(str) {
  return String(str || '')
    .replace(/\r?\n/g, ' ')
    .replace(/"/g, '\\"')
    .trim();
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

  // Strip Substack-specific UI widgets that clutter the Washi scroll
  $(
    [
      '.subscription-widget-wrap',
      '.subscribe-widget',
      '.button-wrapper',
      '.share-dialog',
      '.pencraft',
      'script',
      'style',
      'iframe[src*="substack.com/embed"]',
    ].join(', ')
  ).remove();

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

  // Optional Kanji page-break conversion (controlled by CONFIG.ENABLE_KANJI_BREAKS)
  td.addRule('horizontalRule', {
    filter: 'hr',
    replacement: () => {
      if (CONFIG.ENABLE_KANJI_BREAKS) {
        return KANJI_BREAK_HTML;
      }
      return '\n\n---\n\n';
    },
  });

  return td;
}

// ============================================================================
// MAIN SYNC PIPELINE
// ============================================================================
async function syncSubstack() {
  if (CONFIG.SUBSTACK_FEED_URL.includes('YOUR_SUBSTACK_NAME')) {
    console.error('❌ Please set CONFIG.SUBSTACK_FEED_URL in scripts/sync-substack.mjs first.');
    process.exit(1);
  }

  console.log(`Fetching Substack RSS: ${CONFIG.SUBSTACK_FEED_URL}`);
  const response = await fetch(CONFIG.SUBSTACK_FEED_URL, {
    headers: { 'User-Agent': 'CaminoHenro-SubstackSync/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed (${response.status} ${response.statusText})`);
  }

  const xml = await response.text();
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

    const title = item.title?.__cdata ?? item.title ?? 'Untitled Essay';
    const description = item.description?.__cdata ?? item.description ?? '';
    const rawHtml = item['content:encoded']?.__cdata ?? item['content:encoded'] ?? description;
    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    const isoDate = Number.isNaN(pubDate.getTime())
      ? new Date().toISOString().slice(0, 10)
      : pubDate.toISOString().slice(0, 10);

    // Derive slug from Substack URL (e.g., .../p/my-essay-slug) or fallback to title
    const urlSlugMatch = link.match(/\/p\/([^/?#]+)/i);
    const slug = slugify(urlSlugMatch ? urlSlugMatch[1] : title);
    const filename = `${slug}.md`;
    const outputPath = path.join(essaysDir, filename);

    const cleanedHtml = cleanSubstackHtml(rawHtml);
    const markdownBody = turndown.turndown(cleanedHtml).trim();

    const frontmatter = [
      '---',
      `title: "${escapeYaml(title)}"`,
      `date: ${isoDate}`,
      `excerpt: "${escapeYaml(description)}"`,
      `substackUrl: "${escapeYaml(link)}"`,
      `source: "substack"`,
      '---',
      '',
    ].join('\n');

    const fullContent = `${frontmatter}\n${markdownBody}\n`;

    if (CONFIG.DRY_RUN) {
      console.log(`[DRY RUN] Would create: ${outputPath} (${title})`);
    } else {
      fs.writeFileSync(outputPath, fullContent, 'utf8');
      syncedIds.add(uniqueId);
      importedCount += 1;
      console.log(`✅ Imported: ${filename}`);
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