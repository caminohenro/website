/**
 * scripts/translate-site.mjs
 * ---------------------------------------------------------------------------
 * Automated Two-Mode AI Translation Engine for Camino Henro:
 *
 * MODE A — Triage & Inbox Watcher (runs on every commit):
 *   - Scans all English essays in src/content/essays/*.md.
 *   - Computes a SHA-256 content hash of the English text (excluding translation_status).
 *   - If an essay's English text changed since its last recorded hash AND the user did
 *     not explicitly set translation_status to "translate" or "ignore" in this commit,
 *     automatically resets translation_status to "inbox" so it pops back into the staging
 *     area!
 *   - Updates src/data/translationControl.json with the current list of Inbox items.
 *
 * MODE B — Full AI Translation Run (runs when trigger_translation_now === true
 *          OR when run locally via `node scripts/translate-site.mjs --force`):
 *   - Translates all essays marked `translation_status: "translate"` into:
 *       1. European Portuguese (pt-PT — STRICTly from Portugal, zero Brazilianisms)
 *       2. Spanish (es)
 *       3. French (fr)
 *       4. Japanese (ja)
 *   - Marks those essays as `translation_status: "translated"` and records their new hash.
 *   - Checks all website pages (`src/pages/**/*.astro`, `src/components/*.astro`,
 *     `src/layouts/BaseLayout.astro`) and JSON data files (`src/data/*.json`).
 *   - Any page or JSON file whose English source hash changed is translated and written
 *     into `public/i18n/{lang}/site.json`.
 *   - Resets `trigger_translation_now` to `false` and logs the run timestamp.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const forceTranslate = process.argv.includes('--force');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const TARGET_LANGUAGES = [
  {
    code: 'pt',
    name: 'European Portuguese (Português Europeu — Portugal)',
    strictRules: `CRITICAL RULE FOR PORTUGUESE: You MUST write exclusively in European Portuguese (pt-PT, Português de Portugal) following the Acordo Ortográfico used in Portugal.
- ABSOLUTELY FORBIDDEN: Brazilian Portuguese (pt-BR) vocabulary, syntax, or grammar.
- Use European infinitive constructions ("estou a caminhar", "continua a ser", "a carregar") NEVER Brazilian gerunds ("estou caminhando", "continua sendo").
- Use European vocabulary: "ecrã" (never "tela"), "telemóvel" (never "celular"), "utilizador" (never "usuário"), "comboio" (never "trem"), "autocarro" (never "ônibus"), "equipa" (never "time"), "registo" (never "cadastro"), "subscrever/receber" (never "assinar newsletter"), "partilhar" (never "compartilhar"), "connosco" (never "com a gente").
- Maintain a literary, contemplative, classical European Portuguese register worthy of a philosophical pilgrimage journal.`
  },
  {
    code: 'es',
    name: 'Spanish (Español — literary, contemplative register)',
    strictRules: 'Use natural, literary Spanish suitable for a philosophical pilgrimage journal.'
  },
  {
    code: 'fr',
    name: 'French (Français — literary, contemplative register)',
    strictRules: 'Use natural, literary French suitable for a philosophical pilgrimage journal.'
  },
  {
    code: 'ja',
    name: 'Japanese (日本語 — literary essay & Ohenro pilgrimage register)',
    strictRules: 'Use natural, literary Japanese (丁寧語 / 随筆調) appropriate for a philosophical pilgrimage journal walking to Shikoku (四国遍路). Preserve kanji aesthetic terms such as お接待 (Osettai), 遍路 (Henro), and 随筆.'
  }
];

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function parseEssay(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const fmText = match[1];
  const body = match[2];

  const getField = (key) => {
    const m = fmText.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    if (!m) return '';
    return m[1].trim().replace(/^["']|["']$/g, '');
  };

  const status = getField('translation_status') || 'inbox';
  const cleanFmForHash = fmText.replace(/^translation_status:.*$/m, '').trim();
  const contentHash = sha256(cleanFmForHash + '\n' + body.trim());

  return {
    fmText,
    body,
    status,
    contentHash,
    title: getField('title'),
    subtitle: getField('subtitle'),
    location: getField('location'),
    readingTime: getField('readingTime'),
    excerpt: getField('excerpt')
  };
}

function setEssayStatus(raw, newStatus) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return raw;
  let fm = match[1];
  const body = match[2];
  if (/^translation_status:/m.test(fm)) {
    fm = fm.replace(/^translation_status:.*$/m, `translation_status: "${newStatus}"`);
  } else {
    fm = fm.trimEnd() + `\ntranslation_status: "${newStatus}"`;
  }
  return `---\n${fm}\n---\n${body}`;
}

// Extract visible human-readable text strings from .astro files safely
function extractUiStringsFromAstroFiles() {
  const dirsToScan = [
    path.join(root, 'src/components'),
    path.join(root, 'src/layouts'),
    path.join(root, 'src/pages')
  ];

  const extractedStrings = new Set();

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.astro')) {
        const raw = fs.readFileSync(full, 'utf8');
        // Strip frontmatter, <script>, and <style> blocks
        const templateOnly = raw
          .replace(/^---[\s\S]*?---/, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '');

        // Extract text between HTML tags
        const tagTextMatches = templateOnly.matchAll(/>([^<>{}]+)</g);
        for (const m of tagTextMatches) {
          const text = m[1].replace(/\s+/g, ' ').trim();
          if (
            text.length >= 2 &&
            /[A-Za-z]/.test(text) &&
            !text.startsWith('&lt;') &&
            !text.startsWith('//')
          ) {
            extractedStrings.add(text);
          }
        }

        // Extract placeholder, aria-label, and title attributes
        const attrMatches = templateOnly.matchAll(/(?:placeholder|aria-label|title)="([^"{}]+)"/g);
        for (const m of attrMatches) {
          const text = m[1].trim();
          if (text.length >= 2 && /[A-Za-z]/.test(text)) {
            extractedStrings.add(text);
          }
        }
      }
    }
  }

  for (const d of dirsToScan) walk(d);
  return Array.from(extractedStrings).sort();
}

async function callGeminiJson(systemInstruction, userPayload) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: JSON.stringify(userPayload, null, 2) }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const textOut = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOut) {
    throw new Error('Empty response from Gemini API.');
  }
  return JSON.parse(textOut);
}

async function main() {
  const manifestPath = path.join(root, '.translation-manifest.json');
  const controlPath = path.join(root, 'src/data/translationControl.json');

  const manifest = readJson(manifestPath, { essays: {}, pages: {}, data: {} });
  const control = readJson(controlPath, {
    trigger_translation_now: false,
    translate_static_pages_and_data: true,
    target_languages: ['pt', 'es', 'fr', 'ja'],
    last_run_timestamp: 'Never',
    last_run_summary: '',
    inbox_staging_summary: []
  });

  const essaysDir = path.join(root, 'src/content/essays');
  const essayFiles = fs.existsSync(essaysDir)
    ? fs.readdirSync(essaysDir).filter(f => f.endsWith('.md'))
    : [];

  // -------------------------------------------------------------------------
  // STEP 1: TRIAGE & AUTO-INBOX RESET CHECK
  // -------------------------------------------------------------------------
  const inboxItems = [];
  const essaysToTranslate = [];

  for (const file of essayFiles) {
    const fullPath = path.join(essaysDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = parseEssay(raw);
    if (!parsed) continue;

    const previousHash = manifest.essays[file];
    const hashChanged = previousHash && previousHash !== parsed.contentHash;

    let effectiveStatus = parsed.status;

    // If an essay was previously "translated" or "ignore", and the English text was edited,
    // automatically reset it to "inbox" so the user can triage the update!
    if (hashChanged && (parsed.status === 'translated' || parsed.status === 'ignore')) {
      effectiveStatus = 'inbox';
      const updatedRaw = setEssayStatus(raw, 'inbox');
      fs.writeFileSync(fullPath, updatedRaw, 'utf8');
      console.log(`📥 Auto-reset ${file} to "inbox" because English text was modified.`);
    }

    // If the user set status to "ignore", record the current hash so it stays ignored
    // until the next time the English text is edited!
    if (effectiveStatus === 'ignore') {
      manifest.essays[file] = parsed.contentHash;
    }

    if (effectiveStatus === 'inbox') {
      inboxItems.push(`📥 Essay: ${file} ("${parsed.title}") — Waiting in Inbox`);
    } else if (effectiveStatus === 'translate') {
      inboxItems.push(`🌐 Essay: ${file} ("${parsed.title}") — Approved & Queued for Translation`);
      essaysToTranslate.push({ file, fullPath, raw, parsed });
    }
  }

  // Check UI strings & JSON data files for changes
  const uiStrings = extractUiStringsFromAstroFiles();
  const uiHash = sha256(JSON.stringify(uiStrings));
  const uiNeedsTranslation = manifest.pages.allUiStringsHash !== uiHash;

  if (uiNeedsTranslation) {
    inboxItems.push('📄 Website UI & Static Pages — Modified (Queued for next run)');
  }

  const dataFilesToSync = ['faq.json', 'credits.json', 'inventory.json', 'route.json', 'finances.json', 'siteConfig.json'];
  const changedDataFiles = [];

  for (const df of dataFilesToSync) {
    const dfPath = path.join(root, 'src/data', df);
    if (!fs.existsSync(dfPath)) continue;
    const content = fs.readFileSync(dfPath, 'utf8');
    const h = sha256(content);
    if (manifest.data[df] !== h) {
      changedDataFiles.push({ name: df, path: dfPath, hash: h, data: JSON.parse(content) });
      inboxItems.push(`📊 Data File: src/data/${df} — Modified (Queued for next run)`);
    }
  }

  control.inbox_staging_summary =
    inboxItems.length > 0
      ? inboxItems
      : ['✨ Inbox is empty! All essays and website pages are up to date.'];

  const shouldRunTranslation = Boolean(control.trigger_translation_now) || forceTranslate;

  if (!shouldRunTranslation) {
    writeJson(manifestPath, manifest);
    writeJson(controlPath, control);
    console.log('✓ Triage scan complete. (Flip "Translate Now" ON in Pages CMS to run AI translations).');
    return;
  }

  // -------------------------------------------------------------------------
  // STEP 2: EXECUTE AI TRANSLATION RUN
  // -------------------------------------------------------------------------
  if (!GEMINI_API_KEY) {
    console.error('❌ Cannot run AI translations: GEMINI_API_KEY is not set.');
    process.exit(1);
  }

  console.log('🚀 Starting AI Translation Run across PT-PT, ES, FR, and JA...');
  let translatedEssaysCount = 0;

  // 2A. Translate Approved Essays
  for (const item of essaysToTranslate) {
    const slug = item.file.replace(/\.md$/, '');
    console.log(`📜 Translating Essay: ${item.file}...`);

    for (const lang of TARGET_LANGUAGES) {
      const systemPrompt = `You are the official literary translator for "Camino Henro", a philosophical pilgrimage archive walking from Finisterra to Shikoku.
Translate the provided English essay fields and Markdown body into ${lang.name}.
${lang.strictRules}
- Preserve all Markdown formatting, blockquotes (>), headings, and HTML entities (such as &lt;body&gt; or &lt;quote&gt; if present).
- Return ONLY a valid JSON object with keys: "title", "subtitle", "location", "readingTime", "excerpt", "body".`;

      const translated = await callGeminiJson(systemPrompt, {
        title: item.parsed.title,
        subtitle: item.parsed.subtitle,
        location: item.parsed.location,
        readingTime: item.parsed.readingTime,
        excerpt: item.parsed.excerpt,
        body: item.parsed.body
      });

      const outPath = path.join(root, 'public/i18n', lang.code, 'essays', `${slug}.json`);
      writeJson(outPath, {
        slug,
        lang: lang.code,
        updatedAt: new Date().toISOString(),
        ...translated
      });
      console.log(`  ✓ Saved ${lang.code.toUpperCase()} essay -> public/i18n/${lang.code}/essays/${slug}.json`);
    }

    // Mark essay as "translated" and store its current English hash
    const updatedRaw = setEssayStatus(item.raw, 'translated');
    fs.writeFileSync(item.fullPath, updatedRaw, 'utf8');
    manifest.essays[item.file] = item.parsed.contentHash;
    translatedEssaysCount++;
  }

  // 2B. Translate Static Pages UI & JSON Data (if enabled and modified)
  let updatedStaticArtifacts = 0;
  if (control.translate_static_pages_and_data && (uiNeedsTranslation || changedDataFiles.length > 0)) {
    for (const lang of TARGET_LANGUAGES) {
      const siteDictPath = path.join(root, 'public/i18n', lang.code, 'site.json');
      const siteDict = readJson(siteDictPath, { lang: lang.code, updatedAt: null, ui: {}, data: {} });

      if (uiNeedsTranslation && uiStrings.length > 0) {
        console.log(`🏛️ Translating ${uiStrings.length} Website UI & Page strings into ${lang.code.toUpperCase()}...`);
        const uiSystemPrompt = `You are translating the user interface and static page prose of the "Camino Henro" website from English into ${lang.name}.
${lang.strictRules}
- You are given an object mapping English strings to English strings.
- Return a JSON object with the EXACT same English keys, where each value is the ${lang.name} translation.
- Preserve any decorative Kanji prefixes (e.g., "随筆 • ", "書簡 • ", "印") while translating the English words beside them.`;

        // Chunk UI strings in batches of 80 to guarantee zero truncation
        const chunkSize = 80;
        for (let i = 0; i < uiStrings.length; i += chunkSize) {
          const slice = uiStrings.slice(i, i + chunkSize);
          const batchInput = {};
          for (const s of slice) batchInput[s] = s;
          const translatedBatch = await callGeminiJson(uiSystemPrompt, batchInput);
          Object.assign(siteDict.ui, translatedBatch);
        }
      }

      for (const df of changedDataFiles) {
        console.log(`📊 Translating src/data/${df.name} into ${lang.code.toUpperCase()}...`);
        const dataSystemPrompt = `You are translating structured JSON data for the "Camino Henro" website from English into ${lang.name}.
${lang.strictRules}
- Preserve the EXACT JSON structure, object keys, IDs, dates, numbers, coordinates, currency symbols, and URLs.
- Translate ONLY human-readable text values (titles, questions, answers, descriptions, notes, summaries, lore, taglines).
- Do NOT translate enum keys like type: "osettai" or "expense", or slot identifiers.`;

        const translatedData = await callGeminiJson(dataSystemPrompt, df.data);
        siteDict.data[df.name.replace(/\.json$/, '')] = translatedData;
      }

      siteDict.updatedAt = new Date().toISOString();
      writeJson(siteDictPath, siteDict);
    }

    manifest.pages.allUiStringsHash = uiHash;
    for (const df of changedDataFiles) {
      manifest.data[df.name] = df.hash;
    }
    updatedStaticArtifacts = (uiNeedsTranslation ? 1 : 0) + changedDataFiles.length;
  }

  // Reset trigger button and update status report
  control.trigger_translation_now = false;
  control.last_run_timestamp = new Date().toISOString();
  control.last_run_summary = `Translated ${translatedEssaysCount} essay(s) and ${updatedStaticArtifacts} site/data bundle(s) into PT-PT, ES, FR, and JA.`;

  // Refresh inbox list after completion
  control.inbox_staging_summary = control.inbox_staging_summary.filter(
    line => !line.includes('Approved & Queued') && !line.includes('Queued for next run')
  );
  if (control.inbox_staging_summary.length === 0) {
    control.inbox_staging_summary = ['✨ Inbox is empty! All approved translations are complete.'];
  }

  writeJson(manifestPath, manifest);
  writeJson(controlPath, control);
  console.log('✅ AI Translation Run finished! Control switch reset to false.');
}

main().catch(err => {
  console.error('❌ Translation script error:', err);
  process.exit(1);
});
