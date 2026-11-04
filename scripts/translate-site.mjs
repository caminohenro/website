#!/usr/bin/env node
/**
 * scripts/translate-site.mjs
 *
 * Incremental SHA-256 AI Translation Engine with Editorial Inbox Triage.
 * Strictly Unidirectional: English (src/content/essays/*.md & src/data/*.json)
 * -> Target Locales (src/content/essays/<locale>/*.md & src/data/i18n/<locale>/*.json).
 *
 * Never reads or overwrites English sources from localized folders.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SITE_CONFIG_PATH = path.join(ROOT, 'src/data/siteConfig.json');
const LOCK_FILE_PATH = path.join(ROOT, 'src/data/translationLock.json');
const ESSAYS_DIR = path.join(ROOT, 'src/content/essays');
const DATA_DIR = path.join(ROOT, 'src/data');

const DATA_FILES_TO_TRANSLATE = [
  'uiStrings.json',
  'faq.json',
  'credits.json',
  'inventory.json',
  'route.json',
  'finances.json',
];

const PROSE_JSON_KEYS = new Set([
  'question',
  'answer',
  'note',
  'name',
  'shortSummary',
  'lore',
  'title',
  'summary',
  'description',
  'categoryName',
  'locationOrRole',
]);

// Load .env if present on local Windows machine
function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatterRaw: '', data: {}, body: markdown, lineBreak: '\n' };
  }
  const lineBreak = markdown.includes('\r\n') ? '\r\n' : '\n';
  const frontmatterRaw = match[1];
  const body = match[2];
  const data = {};
  const lines = frontmatterRaw.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) {
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      data[k] = v;
    }
  }
  return { frontmatterRaw, data, body, lineBreak };
}

function setFrontmatterField(markdown, key, newValue) {
  const lineBreak = markdown.includes('\r\n') ? '\r\n' : '\n';
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return markdown;
  const fm = match[1];
  const regex = new RegExp(`^(${key}\\s*:\\s*).*$`, 'm');
  let updatedFm;
  if (regex.test(fm)) {
    updatedFm = fm.replace(regex, `$1${newValue}`);
  } else {
    updatedFm = fm.trimEnd() + `${lineBreak}${key}: ${newValue}`;
  }
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---${lineBreak}${updatedFm}${lineBreak}---`);
}

function normalizeEssayForHash(markdown) {
  // Normalize translationControl so flipping 'queue' -> 'auto' doesn't create a false hash mismatch
  return setFrontmatterField(markdown, 'translationControl', 'auto').replace(/\r\n/g, '\n').trim();
}

async function callGemini(apiKey, systemInstruction, userPrompt, responseMimeType = 'text/plain') {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType,
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text.trim()) {
    throw new Error('Gemini returned an empty response.');
  }
  return text.trim();
}

function cleanCodeFences(str) {
  return str
    .replace(/^\`\`\`(?:markdown|md|json|yaml)?\r?\n/i, '')
    .replace(/\r?\n\`\`\`$/i, '')
    .trim();
}

async function translateMarkdownEssay(apiKey, rawMarkdown, targetLocale) {
  const systemPrompt = [
    `You are a literary translator for "Camino Henro", a contemplative pilgrimage journal from Finisterra, Spain to Shikoku, Japan.`,
    `Translate the provided Markdown essay from English into ${targetLocale.name} (locale code: ${targetLocale.code}).`,
    `STRICT RULES:`,
    `1. Return ONLY valid Markdown including the YAML frontmatter block delimited by --- at the top.`,
    `2. In the YAML frontmatter, translate ONLY the values of: "title", "subtitle", "location", "readingTime", and "excerpt".`,
    `3. Preserve "date", "kilometersWalked", "draft", "heroImage", and "translationControl: auto" 100% untouched.`,
    `4. Always wrap translated YAML string values in double quotes ("...") if they contain colons or special punctuation.`,
    `5. Translate the full Markdown body faithfully with poetic, contemplative literary tone while preserving all Markdown headings, links, images, and blockquotes.`,
  ].join('\n');

  const rawResult = await callGemini(apiKey, systemPrompt, rawMarkdown, 'text/plain');
  let cleaned = cleanCodeFences(rawResult);
  if (!cleaned.startsWith('---')) {
    throw new Error(`Translated essay for ${targetLocale.code} did not start with YAML frontmatter (---).`);
  }
  cleaned = setFrontmatterField(cleaned, 'translationControl', 'auto');
  return cleaned + '\n';
}

function filterTranslatableJson(node, isUiStringsFile = false) {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((item) => filterTranslatableJson(item, isUiStringsFile));
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        if (isUiStringsFile || PROSE_JSON_KEYS.has(k)) {
          out[k] = v;
        }
      } else if (Array.isArray(v) || (v && typeof v === 'object')) {
        out[k] = filterTranslatableJson(v, isUiStringsFile);
      }
    }
    return out;
  }
  return node;
}

function mergeTranslatedJson(original, translated, isUiStringsFile = false) {
  if (Array.isArray(original)) {
    const transArr = Array.isArray(translated) ? translated : [];
    return original.map((item, idx) => mergeTranslatedJson(item, transArr[idx], isUiStringsFile));
  }
  if (original && typeof original === 'object') {
    const result = {};
    for (const [k, origVal] of Object.entries(original)) {
      const transVal = translated && typeof translated === 'object' ? translated[k] : undefined;
      if (typeof origVal === 'string') {
        if ((isUiStringsFile || PROSE_JSON_KEYS.has(k)) && typeof transVal === 'string' && transVal.trim().length > 0) {
          result[k] = transVal;
        } else {
          result[k] = origVal;
        }
      } else if (Array.isArray(origVal) || (origVal && typeof origVal === 'object')) {
        result[k] = mergeTranslatedJson(origVal, transVal, isUiStringsFile);
      } else {
        result[k] = origVal;
      }
    }
    return result;
  }
  return original;
}

async function translateDataJsonFile(apiKey, fileName, originalObj, targetLocale) {
  const isUiStrings = fileName === 'uiStrings.json';
  const subsetToTranslate = filterTranslatableJson(originalObj, isUiStrings);

  const systemPrompt = [
    `You are a literary and UI translator for "Camino Henro", a contemplative pilgrimage website.`,
    `Translate the string values in the provided JSON object from English into ${targetLocale.name} (locale code: ${targetLocale.code}).`,
    `STRICT RULES:`,
    `1. Keep 100% of JSON keys, object structure, and array lengths identical.`,
    `2. Translate ONLY the human-readable prose values.`,
    `3. Do NOT alter IDs, dates, numbers, coordinates, URLs, or enum values.`,
    `4. Return valid JSON only.`,
  ].join('\n');

  const rawJsonText = await callGemini(
    apiKey,
    systemPrompt,
    JSON.stringify(subsetToTranslate, null, 2),
    'application/json'
  );
  const parsedTranslated = JSON.parse(cleanCodeFences(rawJsonText));
  return mergeTranslatedJson(originalObj, parsedTranslated, isUiStrings);
}

async function main() {
  loadDotEnv();

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const siteConfig = JSON.parse(fs.readFileSync(SITE_CONFIG_PATH, 'utf8'));
  const lockData = fs.existsSync(LOCK_FILE_PATH)
    ? JSON.parse(fs.readFileSync(LOCK_FILE_PATH, 'utf8'))
    : { lastRun: null, files: {} };

  if (!lockData.files || typeof lockData.files !== 'object') {
    lockData.files = {};
  }

  const allLocales = Array.isArray(siteConfig?.i18n?.locales) ? siteConfig.i18n.locales : [];
  const targetLocales = allLocales.filter((loc) => loc.enabled && loc.code !== 'en');

  console.log('================================================================');
  console.log(' Camino Henro Incremental AI Translation Engine');
  console.log(` Target Locales: ${targetLocales.map((l) => `${l.flag} ${l.code.toUpperCase()}`).join(', ') || 'None'}`);
  console.log('================================================================\n');

  if (targetLocales.length === 0) {
    console.log('No target locales enabled in siteConfig.json. Exiting.');
    return;
  }

  // --------------------------------------------------------------------------
  // STEP A: SCAN ENGLISH ROOT ESSAYS ONLY (src/content/essays/*.md)
  // --------------------------------------------------------------------------
  const essayEntries = fs.existsSync(ESSAYS_DIR)
    ? fs
        .readdirSync(ESSAYS_DIR, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
    : [];

  for (const entry of essayEntries) {
    const relKey = `src/content/essays/${entry.name}`;
    const fullPath = path.join(ESSAYS_DIR, entry.name);
    let rawContent = fs.readFileSync(fullPath, 'utf8');
    const parsed = parseFrontmatter(rawContent);
    const control = (parsed.data.translationControl || 'auto').toLowerCase();
    const contentHash = sha256(normalizeEssayForHash(rawContent));

    if (!lockData.files[relKey]) {
      lockData.files[relKey] = {};
    }

    console.log(`\n📄 Essay: ${relKey} [translationControl: ${control}]`);

    // RULE 1: Explicit Ignore
    if (control === 'ignore') {
      for (const loc of targetLocales) {
        lockData.files[relKey][loc.code] = {
          hash: contentHash,
          updatedAt: new Date().toISOString(),
          status: 'ignored',
        };
        console.log(`   [${loc.code.toUpperCase()}] ⊘ [Ignored by User Setting]`);
      }
      continue;
    }

    let translatedAnyLocale = false;
    let allQueuedLocalesSucceeded = true;

    for (const loc of targetLocales) {
      const targetDir = path.join(ESSAYS_DIR, loc.code);
      const targetFile = path.join(targetDir, entry.name);
      const targetExists = fs.existsSync(targetFile);
      const recordedHash = lockData.files[relKey]?.[loc.code]?.hash || null;
      const hashMatches = recordedHash === contentHash;

      // RULE 2: Up to date
      if (hashMatches && targetExists && control !== 'queue') {
        console.log(`   [${loc.code.toUpperCase()}] ✓ [Skipped - Up to date]`);
        continue;
      }

      // RULE 3: Modified English essay, but prior translation exists and translationControl === 'auto'
      if (!hashMatches && targetExists && control === 'auto') {
        console.log(
          `   [${loc.code.toUpperCase()}] ⏸ [Pending Review - Set to 'queue' to translate or 'ignore' to dismiss]`
        );
        continue;
      }

      // TRANSLATE RULE: Brand-new file (!targetExists) OR explicitly queued (control === 'queue')
      if (!apiKey) {
        console.warn(
          `   [${loc.code.toUpperCase()}] ⚠ Skipped translation: GEMINI_API_KEY is not set in environment or .env.`
        );
        allQueuedLocalesSucceeded = false;
        continue;
      }

      try {
        console.log(`   [${loc.code.toUpperCase()}] 🚀 Translating into ${loc.name}...`);
        const translatedMd = await translateMarkdownEssay(apiKey, rawContent, loc);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetFile, translatedMd, 'utf8');

        lockData.files[relKey][loc.code] = {
          hash: contentHash,
          updatedAt: new Date().toISOString(),
          status: 'translated',
        };
        translatedAnyLocale = true;
        console.log(`   [${loc.code.toUpperCase()}] ✓ Saved src/content/essays/${loc.code}/${entry.name}`);
      } catch (err) {
        allQueuedLocalesSucceeded = false;
        console.error(`   [${loc.code.toUpperCase()}] ✗ Failed translating ${entry.name}:`, err.message);
      }
    }

    // Reset translationControl: 'queue' -> 'auto' in English frontmatter once queued run succeeds
    if (control === 'queue' && translatedAnyLocale && allQueuedLocalesSucceeded) {
      const updatedEnglishMd = setFrontmatterField(rawContent, 'translationControl', 'auto');
      fs.writeFileSync(fullPath, updatedEnglishMd, 'utf8');
      console.log(`   ↺ Reset translationControl to 'auto' in ${relKey}`);
    }
  }

  // --------------------------------------------------------------------------
  // STEP B: SCAN ENGLISH ROOT DATA FILES ONLY (src/data/*.json)
  // --------------------------------------------------------------------------
  for (const dataFileName of DATA_FILES_TO_TRANSLATE) {
    const fullDataPath = path.join(DATA_DIR, dataFileName);
    if (!fs.existsSync(fullDataPath)) continue;

    const relKey = `src/data/${dataFileName}`;
    const rawJsonStr = fs.readFileSync(fullDataPath, 'utf8');
    const contentHash = sha256(rawJsonStr.replace(/\r\n/g, '\n').trim());
    const originalObj = JSON.parse(rawJsonStr);

    if (!lockData.files[relKey]) {
      lockData.files[relKey] = {};
    }

    console.log(`\n📦 Data File: ${relKey}`);

    for (const loc of targetLocales) {
      const targetDir = path.join(DATA_DIR, 'i18n', loc.code);
      const targetFile = path.join(targetDir, dataFileName);
      const targetExists = fs.existsSync(targetFile);
      const recordedHash = lockData.files[relKey]?.[loc.code]?.hash || null;

      if (recordedHash === contentHash && targetExists) {
        console.log(`   [${loc.code.toUpperCase()}] ✓ [Skipped - Up to date]`);
        continue;
      }

      if (!apiKey) {
        // If no API key yet and target file already exists (e.g. seeded uiStrings.json), record hash or skip gracefully
        console.warn(
          `   [${loc.code.toUpperCase()}] ⚠ GEMINI_API_KEY not set. Skipping AI translation for ${dataFileName}.`
        );
        continue;
      }

      try {
        console.log(`   [${loc.code.toUpperCase()}] 🚀 Translating ${dataFileName} into ${loc.name}...`);
        const translatedObj = await translateDataJsonFile(apiKey, dataFileName, originalObj, loc);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetFile, JSON.stringify(translatedObj, null, 2) + '\n', 'utf8');

        lockData.files[relKey][loc.code] = {
          hash: contentHash,
          updatedAt: new Date().toISOString(),
          status: 'translated',
        };
        console.log(`   [${loc.code.toUpperCase()}] ✓ Saved src/data/i18n/${loc.code}/${dataFileName}`);
      } catch (err) {
        console.error(`   [${loc.code.toUpperCase()}] ✗ Failed translating ${dataFileName}:`, err.message);
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP C: SAVE LOCK FILE & RESET CLOUD TRIGGER FLAG IN siteConfig.json
  // --------------------------------------------------------------------------
  lockData.lastRun = new Date().toISOString();
  fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify(lockData, null, 2) + '\n', 'utf8');
  console.log(`\n🔒 Updated src/data/translationLock.json (lastRun: ${lockData.lastRun})`);

  if (siteConfig?.i18n?.triggerCloudTranslation === true) {
    siteConfig.i18n.triggerCloudTranslation = false;
    fs.writeFileSync(SITE_CONFIG_PATH, JSON.stringify(siteConfig, null, 2) + '\n', 'utf8');
    console.log('🔄 Reset siteConfig.i18n.triggerCloudTranslation -> false');
  }

  console.log('\n✨ Translation run complete.');
}

main().catch((err) => {
  console.error('Fatal error in translate-site.mjs:', err);
  process.exit(1);
});
