import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const STATE_FILE = path.join(ROOT_DIR, 'src/data/.translation-state.json');
const INBOX_FILE = path.join(ROOT_DIR, 'src/data/translation-inbox.json');
const ESSAYS_DIR = path.join(ROOT_DIR, 'src/content/essays');

const TRACKED_JSON_FILES = [
  { path: 'src/data/pages/global-ui.json', id: 'page:global-ui', title: 'Global UI & Navigation (global-ui.json)', name: 'global-ui' },
  { path: 'src/data/pages/home.json', id: 'page:home', title: 'Website Page: Home (home.json)', name: 'home' },
  { path: 'src/data/pages/donate.json', id: 'page:donate', title: 'Website Page: Donate (donate.json)', name: 'donate' },
  { path: 'src/data/pages/credits-ui.json', id: 'page:credits-ui', title: 'Website Page: Credits UI Labels (credits-ui.json)', name: 'credits-ui' },
  { path: 'src/data/pages/faq-ui.json', id: 'page:faq-ui', title: 'Website Page: FAQ UI Labels (faq-ui.json)', name: 'faq-ui' },
  { path: 'src/data/pages/essays-ui.json', id: 'page:essays-ui', title: 'Website Page: Essays Index UI Labels (essays-ui.json)', name: 'essays-ui' },
  { path: 'src/data/pages/coming-soon.json', id: 'page:coming-soon', title: 'Website Page: Coming Soon (coming-soon.json)', name: 'coming-soon' },
  { path: 'src/data/faq.json', id: 'data:faq', title: 'FAQ Entries (faq.json)', name: 'faq' },
  { path: 'src/data/credits.json', id: 'data:credits', title: 'Credits & Acknowledgments (credits.json)', name: 'credits' }
];

const TARGET_LANGUAGES = [
  {
    code: 'pt',
    name: 'European Portuguese (Português Europeu / Portugal, pt-PT)',
    rules: "Translate strictly into European Portuguese (Português Europeu / Portugal, pt-PT). NEVER use Brazilian Portuguese spelling, vocabulary, or grammar. Use European Portuguese infinitive constructions ('a caminhar', 'estou a fazer') instead of Brazilian gerunds, European pronouns/clitics, and Portugal's lexicon."
  },
  {
    code: 'es',
    name: 'Spanish (Español de España, Castilian)',
    rules: 'Translate into natural, literary Peninsular Spanish (Español de España) appropriate for Camino de Santiago pilgrims and contemplative essays.'
  },
  {
    code: 'fr',
    name: 'French (Français)',
    rules: 'Translate into natural, literary French (Français) appropriate for pilgrimage literature and contemplative essays.'
  },
  {
    code: 'ja',
    name: 'Japanese (日本語)',
    rules: 'Translate into natural, literary Japanese (日本語) honoring traditional Shikoku Henro (四国遍路) terminology and contemplative essay style.'
  }
];

function computeSha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`Warning: Could not parse ${filePath}, using fallback.`, err.message);
    return fallback;
  }
}

function saveJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

function parseMarkdownFile(rawContent) {
  const normalized = rawContent.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const yamlBlock = match[1];
  const body = match[2].trim();
  const frontmatter = {};

  const lines = yamlBlock.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === 'true') {
      frontmatter[key] = true;
    } else if (val === 'false') {
      frontmatter[key] = false;
    } else {
      frontmatter[key] = val;
    }
  }

  return { frontmatter, body };
}

async function callGeminiWithRetry(systemInstruction, userPrompt, maxRetries = 4) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required to translate content.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response text from Gemini API.');
      }

      return JSON.parse(rawText);
    } catch (err) {
      console.warn(`  [Attempt ${attempt}/${maxRetries}] Gemini API call error: ${err.message}`);
      if (attempt === maxRetries) {
        throw err;
      }
      const delayMs = Math.pow(2, attempt) * 1500;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

async function translateJsonSource(relPath, langConfig) {
  const absPath = path.join(ROOT_DIR, relPath);
  const rawJson = fs.readFileSync(absPath, 'utf8');

  const systemInstruction = [
    `You are a master literary translator for Camino Henro, a contemplative documentary and pilgrimage project connecting the Camino de Santiago and the Shikoku Henro.`,
    `Target Language: ${langConfig.name}.`,
    langConfig.rules,
    `CRITICAL FORMATTING RULES:`,
    `1. Return ONLY a valid JSON object matching the exact schema, keys, nesting, and array lengths of the input JSON.`,
    `2. NEVER translate JSON property keys, IDs, URLs, email addresses, file paths, or language codes.`,
    `3. Preserve all inline HTML tags (such as <strong>, <em>, <br />, <a>) and template placeholders intact inside translated strings.`,
    `4. Translate only the human-readable English text values with warmth, dignity, and literary precision.`
  ].join('\n');

  const userPrompt = `Translate the human-readable string values in the following JSON object into ${langConfig.name}:\n\n${rawJson}`;
  return await callGeminiWithRetry(systemInstruction, userPrompt);
}

async function translateMarkdownEssay(relPath, langConfig) {
  const absPath = path.join(ROOT_DIR, relPath);
  const rawMd = fs.readFileSync(absPath, 'utf8');
  const { frontmatter, body } = parseMarkdownFile(rawMd);

  const payloadToTranslate = {
    title: frontmatter.title || '',
    subtitle: frontmatter.subtitle || '',
    location: frontmatter.location || '',
    readingTime: frontmatter.readingTime || '',
    excerpt: frontmatter.excerpt || '',
    markdownBody: body
  };

  const systemInstruction = [
    `You are a master literary translator for Camino Henro, a contemplative documentary and pilgrimage project connecting the Camino de Santiago and the Shikoku Henro.`,
    `Target Language: ${langConfig.name}.`,
    langConfig.rules,
    `CRITICAL FORMATTING RULES:`,
    `1. Return ONLY a valid JSON object with the exact keys: "title", "subtitle", "location", "readingTime", "excerpt", and "bodyHtml".`,
    `2. Translate "title", "subtitle", "location", "readingTime", and "excerpt" accurately into ${langConfig.name}.`,
    `3. Translate "markdownBody" into ${langConfig.name} and convert the Markdown into clean semantic HTML inside "bodyHtml" using <p>, <blockquote>, <h2>, <h3>, <em>, and <strong> tags.`,
    `4. Do not wrap "bodyHtml" in <html> or <body> tags; output clean HTML paragraphs and blockquotes ready for injection.`
  ].join('\n');

  const userPrompt = `Translate this essay frontmatter and Markdown body into ${langConfig.name} and return the required JSON object:\n\n${JSON.stringify(payloadToTranslate, null, 2)}`;
  return await callGeminiWithRetry(systemInstruction, userPrompt);
}

async function runPipeline() {
  console.log('=== Starting Camino Henro Translation Pipeline ===');

  const state = loadJson(STATE_FILE, { hashes: {} });
  if (!state.hashes) state.hashes = {};

  const inbox = loadJson(INBOX_FILE, {
    notice: "When you create or edit an English essay or page, it appears below as 'Pending'. Set an item to 'Translate' and click Save to automatically translate it into PT-PT, ES, FR, and JA, or set it to 'Ignore' to skip translation.",
    items: []
  });
  if (!Array.isArray(inbox.items)) inbox.items = [];

  // --------------------------------------------------------------------------
  // STEP A: Process User Decisions in src/data/translation-inbox.json
  // --------------------------------------------------------------------------
  const remainingInboxItems = [];

  for (const item of inbox.items) {
    const relPath = item.sourcePath;
    const absPath = path.join(ROOT_DIR, relPath);

    if (!fs.existsSync(absPath)) {
      console.log(`[Inbox] Source file no longer exists (${relPath}). Removing from inbox.`);
      continue;
    }

    const currentContent = fs.readFileSync(absPath, 'utf8');
    const currentHash = computeSha256(currentContent);

    if (item.action === 'ignore') {
      console.log(`[Ignore] Marking ${relPath} as ignored at current hash.`);
      state.hashes[relPath] = currentHash;
      continue;
    }

    if (item.action === 'translate') {
      console.log(`[Translate] Translating ${relPath} into pt, es, fr, ja...`);
      const isEssay = relPath.startsWith('src/content/essays/') && relPath.endsWith('.md');

      for (const langConfig of TARGET_LANGUAGES) {
        console.log(`  -> Generating [${langConfig.code}] translation for ${relPath}...`);
        if (isEssay) {
          const slug = path.basename(relPath, '.md');
          const translatedEssay = await translateMarkdownEssay(relPath, langConfig);
          const outPath = path.join(ROOT_DIR, `src/data/i18n/${langConfig.code}/essays/${slug}.json`);
          saveJson(outPath, translatedEssay);
        } else {
          const baseName = path.basename(relPath, '.json');
          const translatedData = await translateJsonSource(relPath, langConfig);
          const outPath = path.join(ROOT_DIR, `src/data/i18n/${langConfig.code}/${baseName}.json`);
          saveJson(outPath, translatedData);
        }
      }

      state.hashes[relPath] = currentHash;
      console.log(`[Translate] Completed all 4 languages for ${relPath}.`);
      continue;
    }

    remainingInboxItems.push(item);
  }

  inbox.items = remainingInboxItems;

  // --------------------------------------------------------------------------
  // STEP B: Scan All English Source Files for New or Modified Content
  // --------------------------------------------------------------------------
  const today = getTodayIso();

  // 1. Scan Markdown Essays
  if (fs.existsSync(ESSAYS_DIR)) {
    const essayFiles = fs.readdirSync(ESSAYS_DIR).filter((f) => f.endsWith('.md')).sort();
    for (const file of essayFiles) {
      const relPath = `src/content/essays/${file}`;
      const absPath = path.join(ROOT_DIR, relPath);
      const content = fs.readFileSync(absPath, 'utf8');
      const { frontmatter } = parseMarkdownFile(content);

      if (frontmatter.draft === true) {
        continue;
      }

      const currentHash = computeSha256(content);
      const recordedHash = state.hashes[relPath];

      if (currentHash !== recordedHash) {
        const slug = path.basename(file, '.md');
        const itemId = `essay:${slug}`;
        const itemTitle = `Essay: ${frontmatter.title || slug} (${file})`;

        const existingIdx = inbox.items.findIndex((i) => i.sourcePath === relPath);
        if (existingIdx !== -1) {
          inbox.items[existingIdx].title = itemTitle;
          inbox.items[existingIdx].lastModified = today;
          if (!inbox.items[existingIdx].action) {
            inbox.items[existingIdx].action = 'pending';
          }
        } else {
          console.log(`[Scan] Detected new or modified essay: ${relPath} -> adding to staging inbox.`);
          inbox.items.push({
            id: itemId,
            title: itemTitle,
            itemType: 'essay',
            sourcePath: relPath,
            lastModified: today,
            action: 'pending'
          });
        }
      }
    }
  }

  // 2. Scan Tracked Page & Data JSON Files
  for (const tracked of TRACKED_JSON_FILES) {
    const absPath = path.join(ROOT_DIR, tracked.path);
    if (!fs.existsSync(absPath)) continue;

    const content = fs.readFileSync(absPath, 'utf8');
    const currentHash = computeSha256(content);
    const recordedHash = state.hashes[tracked.path];

    if (currentHash !== recordedHash) {
      const existingIdx = inbox.items.findIndex((i) => i.sourcePath === tracked.path);
      if (existingIdx !== -1) {
        inbox.items[existingIdx].title = tracked.title;
        inbox.items[existingIdx].lastModified = today;
        if (!inbox.items[existingIdx].action) {
          inbox.items[existingIdx].action = 'pending';
        }
      } else {
        console.log(`[Scan] Detected modified JSON source: ${tracked.path} -> adding to staging inbox.`);
        inbox.items.push({
          id: tracked.id,
          title: tracked.title,
          itemType: 'page',
          sourcePath: tracked.path,
          lastModified: today,
          action: 'pending'
        });
      }
    }
  }

  saveJson(STATE_FILE, state);
  saveJson(INBOX_FILE, inbox);
  console.log('=== Translation Pipeline Finished Successfully ===');
}

runPipeline().catch((err) => {
  console.error('Fatal error in translation pipeline:', err);
  process.exit(1);
});
