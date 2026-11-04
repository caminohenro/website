/**
 * step18-translation-pipeline.mjs
 * ---------------------------------------------------------------------------
 * Installs the Complete Pre-Generated AI Translation System for Camino Henro:
 * 1. Updates src/content/config.ts & existing essays with `translation_status`
 * 2. Creates src/data/translationControl.json (Pages CMS Inbox + "Translate Now" button)
 * 3. Updates .pages.yml to add the "Translation Control & Inbox" tab and Essay status field
 * 4. Creates scripts/translate-site.mjs (Smart Delta Hashing + Inbox Reset + Gemini 2.5 Flash)
 * 5. Creates .github/workflows/ai-translator.yml (Cloud GitHub Action triggered from Pages CMS)
 * 6. Injects the Language Flag Switcher (EN, PT-PT, ES, FR, JA) & Pre-Generated Static
 *    Translation Engine into Header.astro and BaseLayout.astro safely.
 * 
 *
 * ============================================================================
 * HOW TO RUN & SET UP YOUR CLOUD SECRET (ONE-TIME SETUP)
 * ============================================================================
 * 
 * 1. Run the Auto-Builder Locally:
 *    - Save this script as `step18-translation-pipeline.mjs` inside your 
 *      `camino-henro` project folder.
 *    - Open your terminal inside the project directory and run:
 *      $ node step18-translation-pipeline.mjs
 *    - Delete this script file once execution is complete.
 *
 * 2. Add Your Gemini API Key to GitHub Secrets (Enables Cloud Actions from Mobile):
 *    - Obtain a free API key from Google AI Studio (https://aistudio.google.com).
 *    - Navigate to your repository on GitHub.com:
 *      Settings -> Secrets and variables -> Actions -> New repository secret.
 *    - Create a secret named `GEMINI_API_KEY`, paste your key, and save.
 *
 * 3. Daily Usage on the Trail (Via Pages CMS on Mobile):
 *    - New or edited essays automatically land in the Inbox status 
 *      (`📥 Inbox (New / Modified — Decide Later)`).
 *    - Triage your essays in Pages CMS by setting their status to either:
 *      • `🌐 Approve for AI Translation`
 *      • `⏭️ Ignore`
 *    - Go to the `🌍 Translations & Inbox` tab, toggle `🚀 Translate Now` to `true`, 
 *      and click Save.
 *    - GitHub Actions will automatically translate approved essays and updated 
 *      static pages/data into European Portuguese (pt-PT), Spanish, French, and Japanese, 
 *      commit the JSON bundles, and reset the trigger switch back to `false`.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

console.log('🌍 Initializing Step 18: Camino Henro AI Translation Pipeline...');

// ---------------------------------------------------------------------------
// 1. UPDATE src/content/config.ts TO SUPPORT `translation_status`
// ---------------------------------------------------------------------------
const contentConfigPath = path.join(root, 'src/content/config.ts');
if (fs.existsSync(contentConfigPath)) {
  let configContent = fs.readFileSync(contentConfigPath, 'utf8');
  if (!configContent.includes('translation_status')) {
    configContent = configContent.replace(
      /draft:\s*z\.boolean\(\)\.default\(false\),?/,
      `draft: z.boolean().default(false),\n    translation_status: z.enum(['inbox', 'translate', 'ignore', 'translated']).default('inbox'),`
    );
    fs.writeFileSync(contentConfigPath, configContent, 'utf8');
    console.log('✓ Updated src/content/config.ts with translation_status schema.');
  } else {
    console.log('• src/content/config.ts already includes translation_status.');
  }
}

// ---------------------------------------------------------------------------
// 2. ENSURE ALL EXISTING ESSAYS HAVE `translation_status: "inbox"`
// ---------------------------------------------------------------------------
const essaysDir = path.join(root, 'src/content/essays');
const initialEssayHashes = {};

if (fs.existsSync(essaysDir)) {
  const files = fs.readdirSync(essaysDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const fullPath = path.join(essaysDir, file);
    let raw = fs.readFileSync(fullPath, 'utf8');
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (fmMatch) {
      let fm = fmMatch[1];
      const body = fmMatch[2];
      if (!/^translation_status:/m.test(fm)) {
        fm = fm.trimEnd() + '\ntranslation_status: "inbox"';
        raw = `---\n${fm}\n---\n${body}`;
        fs.writeFileSync(fullPath, raw, 'utf8');
        console.log(`✓ Added translation_status: "inbox" to ${file}`);
      }
      // Compute clean content hash (excluding translation_status line itself)
      const hashable = fm.replace(/^translation_status:.*$/m, '').trim() + '\n' + body.trim();
      initialEssayHashes[file] = sha256(hashable);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. CREATE src/data/translationControl.json (THE PAGES CMS INBOX & TRIGGER)
// ---------------------------------------------------------------------------
ensureDir(path.join(root, 'src/data'));
const controlPath = path.join(root, 'src/data/translationControl.json');

const initialControlData = {
  trigger_translation_now: false,
  translate_static_pages_and_data: true,
  target_languages: ["pt", "es", "fr", "ja"],
  last_run_timestamp: "Never run yet",
  last_run_summary: "Waiting for first translation trigger.",
  inbox_staging_summary: Object.keys(initialEssayHashes).map(
    f => `📥 ${f} — Status: inbox (Ready for triage in Essays tab)`
  )
};

fs.writeFileSync(controlPath, JSON.stringify(initialControlData, null, 2) + '\n', 'utf8');
console.log('✓ Created src/data/translationControl.json (Pages CMS Control Panel & Inbox).');

// ---------------------------------------------------------------------------
// 4. CREATE initial public/i18n/ structure & .translation-manifest.json
// ---------------------------------------------------------------------------
const i18nPublicDir = path.join(root, 'public/i18n');
ensureDir(i18nPublicDir);

for (const lang of ['pt', 'es', 'fr', 'ja']) {
  ensureDir(path.join(i18nPublicDir, lang, 'essays'));
  const dictFile = path.join(i18nPublicDir, lang, 'site.json');
  if (!fs.existsSync(dictFile)) {
    fs.writeFileSync(
      dictFile,
      JSON.stringify(
        {
          lang,
          updatedAt: null,
          ui: {},
          data: {}
        },
        null,
        2
      ) + '\n',
      'utf8'
    );
  }
}

const manifestPath = path.join(root, '.translation-manifest.json');
if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        essays: initialEssayHashes,
        pages: {},
        data: {}
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
  console.log('✓ Created .translation-manifest.json for smart change detection.');
}

// ---------------------------------------------------------------------------
// 5. UPDATE .pages.yml TO ADD INBOX DROPDOWN & "TRANSLATE NOW" CONTROL TAB
// ---------------------------------------------------------------------------
const pagesYmlPath = path.join(root, '.pages.yml');
const cleanPagesYml = `media:
  input: public/assets
  output: /assets

content:
  - name: translation_control
    label: "🌍 Translations & Inbox"
    path: src/data/translationControl.json
    type: file
    fields:
      - name: trigger_translation_now
        label: "🚀 Translate Now (Flip ON and click Save to run AI Translator on approved items)"
        type: boolean
        default: false
      - name: translate_static_pages_and_data
        label: "📄 Auto-Translate Updated Website Pages & JSON Data (Home, FAQ, Credits, etc.)"
        type: boolean
        default: true
      - name: inbox_staging_summary
        label: "📥 Staging Inbox (Essays & Pages with new or modified English text)"
        type: string
        list: true
      - name: last_run_timestamp
        label: "🕒 Last Translation Run"
        type: string
      - name: last_run_summary
        label: "📋 Last Run Summary"
        type: string

  - name: essays
    label: "📜 Essays (Dispatches)"
    path: src/content/essays
    type: collection
    view:
      fields: [title, translation_status, date, draft]
      primary: title
      sort: [date]
      default:
        sort: date
        order: desc
    fields:
      - name: translation_status
        label: "🌍 Translation Staging Status (Auto-resets to Inbox whenever you edit this essay)"
        type: select
        default: "inbox"
        options:
          - { value: "inbox", label: "📥 Inbox (New / Modified — Decide Later)" }
          - { value: "translate", label: "🌐 Approve for AI Translation" }
          - { value: "ignore", label: "⏭️ Ignore (Do Not Translate This Update)" }
          - { value: "translated", label: "✅ Translated (Up to Date)" }
      - name: title
        label: "Title"
        type: string
        required: true
      - name: subtitle
        label: "Subtitle"
        type: string
      - name: date
        label: "Date"
        type: date
        required: true
      - name: location
        label: "Location"
        type: string
        required: true
      - name: kilometersWalked
        label: "Kilometers Walked"
        type: number
      - name: readingTime
        label: "Reading Time (e.g. 6 min read)"
        type: string
      - name: excerpt
        label: "Short Excerpt (Home & Archive stream)"
        type: text
        required: true
      - name: draft
        label: "Draft (Hide from live site)"
        type: boolean
        default: false
      - name: body
        label: "Essay Body (Markdown)"
        type: rich-text

  - name: finances
    label: "🪙 Finances Ledger"
    path: src/data/finances.json
    type: file
    fields:
      - name: currencySymbol
        label: "Currency Symbol"
        type: string
      - name: startingReserve
        label: "Starting Reserve"
        type: number
      - name: lastUpdated
        label: "Last Updated"
        type: string
      - name: note
        label: "Ledger Note"
        type: text
      - name: entries
        label: "Ledger Entries"
        type: object
        list: true
        fields:
          - { name: id, label: "ID", type: string }
          - { name: date, label: "Date", type: string }
          - { name: type, label: "Type (osettai or expense)", type: select, options: ["osettai", "expense"] }
          - { name: category, label: "Category", type: string }
          - { name: description, label: "Description", type: string }
          - { name: location, label: "Location", type: string }
          - { name: amount, label: "Amount", type: number }

  - name: faq
    label: "❓ FAQ"
    path: src/data/faq.json
    type: file
    fields:
      - name: categories
        label: "FAQ Categories"
        type: object
        list: true
        fields:
          - { name: categoryName, label: "Category Name", type: string }
          - name: items
            label: "Questions"
            type: object
            list: true
            fields:
              - { name: question, label: "Question", type: string }
              - { name: answer, label: "Answer", type: text }

  - name: credits
    label: "🙏 Credits (Roll of Gratitude)"
    path: src/data/credits.json
    type: file
    fields:
      - name: sections
        label: "Sections"
        type: object
        list: true
        fields:
          - { name: title, label: "Section Title", type: string }
          - name: entries
            label: "Entries"
            type: object
            list: true
            fields:
              - { name: name, label: "Name", type: string }
              - { name: locationOrRole, label: "Location or Role", type: string }
              - { name: date, label: "Date", type: string }
              - { name: note, label: "Gratitude Note", type: text }

  - name: inventory
    label: "🎒 Gear Inventory"
    path: src/data/inventory.json
    type: file
    fields:
      - name: items
        label: "Gear Items"
        type: object
        list: true
        fields:
          - { name: id, label: "ID", type: string }
          - { name: name, label: "Item Name", type: string }
          - { name: japaneseName, label: "Japanese Name", type: string }
          - { name: slot, label: "Slot", type: string }
          - { name: weightGrams, label: "Weight (g)", type: number }
          - { name: condition, label: "Condition", type: string }
          - { name: shortSummary, label: "Short Summary", type: string }
          - { name: lore, label: "Lore / Full Description", type: text }

  - name: route
    label: "🗺️ Trail Map & Checkpoints"
    path: src/data/route.json
    type: file
    fields:
      - name: stats
        label: "Overall Stats"
        type: object
        fields:
          - { name: totalPlannedKm, label: "Total Planned Km", type: number }
          - { name: completedKm, label: "Completed Km", type: number }
          - { name: daysOnTrail, label: "Days on Trail", type: number }
          - { name: countriesCrossed, label: "Countries Crossed", type: number }
      - name: checkpoints
        label: "Checkpoints"
        type: object
        list: true
        fields:
          - { name: id, label: "ID", type: string }
          - { name: title, label: "Title", type: string }
          - { name: date, label: "Date", type: string }
          - { name: lat, label: "Latitude", type: number }
          - { name: lng, label: "Longitude", type: number }
          - { name: kmMarker, label: "KM Marker", type: number }
          - { name: summary, label: "Trail Note", type: text }
          - { name: essaySlug, label: "Linked Essay Slug", type: string }
`;

fs.writeFileSync(pagesYmlPath, cleanPagesYml, 'utf8');
console.log('✓ Updated .pages.yml with "🌍 Translations & Inbox" tab and Essay staging status.');

// ---------------------------------------------------------------------------
// 6. CREATE scripts/translate-site.mjs (THE CLOUD & LOCAL AI TRANSLATOR)
// ---------------------------------------------------------------------------
ensureDir(path.join(root, 'scripts'));
const translateScriptPath = path.join(root, 'scripts/translate-site.mjs');

const translateScriptSource = `/**
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
 *          OR when run locally via \`node scripts/translate-site.mjs --force\`):
 *   - Translates all essays marked \`translation_status: "translate"\` into:
 *       1. European Portuguese (pt-PT — STRICTly from Portugal, zero Brazilianisms)
 *       2. Spanish (es)
 *       3. French (fr)
 *       4. Japanese (ja)
 *   - Marks those essays as \`translation_status: "translated"\` and records their new hash.
 *   - Checks all website pages (\`src/pages/**/*.astro\`, \`src/components/*.astro\`,
 *     \`src/layouts/BaseLayout.astro\`) and JSON data files (\`src/data/*.json\`).
 *   - Any page or JSON file whose English source hash changed is translated and written
 *     into \`public/i18n/{lang}/site.json\`.
 *   - Resets \`trigger_translation_now\` to \`false\` and logs the run timestamp.
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
    strictRules: \`CRITICAL RULE FOR PORTUGUESE: You MUST write exclusively in European Portuguese (pt-PT, Português de Portugal) following the Acordo Ortográfico used in Portugal.
- ABSOLUTELY FORBIDDEN: Brazilian Portuguese (pt-BR) vocabulary, syntax, or grammar.
- Use European infinitive constructions ("estou a caminhar", "continua a ser", "a carregar") NEVER Brazilian gerunds ("estou caminhando", "continua sendo").
- Use European vocabulary: "ecrã" (never "tela"), "telemóvel" (never "celular"), "utilizador" (never "usuário"), "comboio" (never "trem"), "autocarro" (never "ônibus"), "equipa" (never "time"), "registo" (never "cadastro"), "subscrever/receber" (never "assinar newsletter"), "partilhar" (never "compartilhar"), "connosco" (never "com a gente").
- Maintain a literary, contemplative, classical European Portuguese register worthy of a philosophical pilgrimage journal.\`
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
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\\n', 'utf8');
}

function parseEssay(raw) {
  const match = raw.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n([\\s\\S]*)$/);
  if (!match) return null;
  const fmText = match[1];
  const body = match[2];

  const getField = (key) => {
    const m = fmText.match(new RegExp(\`^\${key}:\\\\s*(.+)$\`, 'm'));
    if (!m) return '';
    return m[1].trim().replace(/^["']|["']$/g, '');
  };

  const status = getField('translation_status') || 'inbox';
  const cleanFmForHash = fmText.replace(/^translation_status:.*$/m, '').trim();
  const contentHash = sha256(cleanFmForHash + '\\n' + body.trim());

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
  const match = raw.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n([\\s\\S]*)$/);
  if (!match) return raw;
  let fm = match[1];
  const body = match[2];
  if (/^translation_status:/m.test(fm)) {
    fm = fm.replace(/^translation_status:.*$/m, \`translation_status: "\${newStatus}"\`);
  } else {
    fm = fm.trimEnd() + \`\\ntranslation_status: "\${newStatus}"\`;
  }
  return \`---\\n\${fm}\\n---\\n\${body}\`;
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
          .replace(/^---[\\s\\S]*?---/, '')
          .replace(/<script[\\s\\S]*?<\\/script>/gi, '')
          .replace(/<style[\\s\\S]*?<\\/style>/gi, '');

        // Extract text between HTML tags
        const tagTextMatches = templateOnly.matchAll(/>([^<>{}]+)</g);
        for (const m of tagTextMatches) {
          const text = m[1].replace(/\\s+/g, ' ').trim();
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

  const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${GEMINI_MODEL}:generateContent?key=\${GEMINI_API_KEY}\`;

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
    throw new Error(\`Gemini API Error (\${response.status}): \${errText}\`);
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
      console.log(\`📥 Auto-reset \${file} to "inbox" because English text was modified.\`);
    }

    // If the user set status to "ignore", record the current hash so it stays ignored
    // until the next time the English text is edited!
    if (effectiveStatus === 'ignore') {
      manifest.essays[file] = parsed.contentHash;
    }

    if (effectiveStatus === 'inbox') {
      inboxItems.push(\`📥 Essay: \${file} ("\${parsed.title}") — Waiting in Inbox\`);
    } else if (effectiveStatus === 'translate') {
      inboxItems.push(\`🌐 Essay: \${file} ("\${parsed.title}") — Approved & Queued for Translation\`);
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
      inboxItems.push(\`📊 Data File: src/data/\${df} — Modified (Queued for next run)\`);
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
    const slug = item.file.replace(/\\.md$/, '');
    console.log(\`📜 Translating Essay: \${item.file}...\`);

    for (const lang of TARGET_LANGUAGES) {
      const systemPrompt = \`You are the official literary translator for "Camino Henro", a philosophical pilgrimage archive walking from Finisterra to Shikoku.
Translate the provided English essay fields and Markdown body into \${lang.name}.
\${lang.strictRules}
- Preserve all Markdown formatting, blockquotes (>), headings, and HTML entities (such as &lt;body&gt; or &lt;quote&gt; if present).
- Return ONLY a valid JSON object with keys: "title", "subtitle", "location", "readingTime", "excerpt", "body".\`;

      const translated = await callGeminiJson(systemPrompt, {
        title: item.parsed.title,
        subtitle: item.parsed.subtitle,
        location: item.parsed.location,
        readingTime: item.parsed.readingTime,
        excerpt: item.parsed.excerpt,
        body: item.parsed.body
      });

      const outPath = path.join(root, 'public/i18n', lang.code, 'essays', \`\${slug}.json\`);
      writeJson(outPath, {
        slug,
        lang: lang.code,
        updatedAt: new Date().toISOString(),
        ...translated
      });
      console.log(\`  ✓ Saved \${lang.code.toUpperCase()} essay -> public/i18n/\${lang.code}/essays/\${slug}.json\`);
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
        console.log(\`🏛️ Translating \${uiStrings.length} Website UI & Page strings into \${lang.code.toUpperCase()}...\`);
        const uiSystemPrompt = \`You are translating the user interface and static page prose of the "Camino Henro" website from English into \${lang.name}.
\${lang.strictRules}
- You are given an object mapping English strings to English strings.
- Return a JSON object with the EXACT same English keys, where each value is the \${lang.name} translation.
- Preserve any decorative Kanji prefixes (e.g., "随筆 • ", "書簡 • ", "印") while translating the English words beside them.\`;

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
        console.log(\`📊 Translating src/data/\${df.name} into \${lang.code.toUpperCase()}...\`);
        const dataSystemPrompt = \`You are translating structured JSON data for the "Camino Henro" website from English into \${lang.name}.
\${lang.strictRules}
- Preserve the EXACT JSON structure, object keys, IDs, dates, numbers, coordinates, currency symbols, and URLs.
- Translate ONLY human-readable text values (titles, questions, answers, descriptions, notes, summaries, lore, taglines).
- Do NOT translate enum keys like type: "osettai" or "expense", or slot identifiers.\`;

        const translatedData = await callGeminiJson(dataSystemPrompt, df.data);
        siteDict.data[df.name.replace(/\\.json$/, '')] = translatedData;
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
  control.last_run_summary = \`Translated \${translatedEssaysCount} essay(s) and \${updatedStaticArtifacts} site/data bundle(s) into PT-PT, ES, FR, and JA.\`;

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
`;

fs.writeFileSync(translateScriptPath, translateScriptSource, 'utf8');
console.log('✓ Created scripts/translate-site.mjs.');

// ---------------------------------------------------------------------------
// 7. CREATE .github/workflows/ai-translator.yml
// ---------------------------------------------------------------------------
ensureDir(path.join(root, '.github/workflows'));
const workflowPath = path.join(root, '.github/workflows/ai-translator.yml');

const workflowYml = `name: Camino Henro AI Translator & Inbox Triage

on:
  push:
    branches:
      - main
      - development
    paths:
      - 'src/content/essays/**'
      - 'src/data/**'
      - 'src/pages/**'
      - 'src/components/**'
      - 'src/layouts/**'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  triage-and-translate:
    # Prevent infinite loops when the bot commits translated files back
    if: "!contains(github.event.head_commit.message, '[skip i18n]')"
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Run Triage & AI Translation Engine
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          GEMINI_MODEL: 'gemini-2.5-flash'
        run: node scripts/translate-site.mjs

      - name: Commit & Push Updated Translations / Inbox Status
        run: |
          git config user.name "camino-henro-translator[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add .translation-manifest.json src/data/translationControl.json src/content/essays/ public/i18n/
          if git diff --staged --quiet; then
            echo "No translation or inbox changes to commit."
          else
            git commit -m "🌍 Update AI translations & Inbox triage [skip i18n]"
            git push
          fi
`;

fs.writeFileSync(workflowPath, workflowYml, 'utf8');
console.log('✓ Created .github/workflows/ai-translator.yml.');

// ---------------------------------------------------------------------------
// 8. INJECT LANGUAGE FLAG SWITCHER INTO src/components/Header.astro
// ---------------------------------------------------------------------------
const headerPath = path.join(root, 'src/components/Header.astro');
if (fs.existsSync(headerPath)) {
  let headerHtml = fs.readFileSync(headerPath, 'utf8');

  if (!headerHtml.includes('id="henro-lang-switcher"')) {
    const langBarMarkup = `
  <!-- STEP18_LANGUAGE_FLAG_SWITCHER_START -->
  <div id="henro-lang-switcher" class="henro-lang-switcher" role="navigation" aria-label="Language Selector">
    <button type="button" class="henro-lang-btn is-active" data-lang="en" title="English (Original)">
      <span class="flag-icon">🇬🇧</span><span class="lang-code">EN</span>
    </button>
    <button type="button" class="henro-lang-btn" data-lang="pt" title="Português (Portugal)">
      <span class="flag-icon">🇵🇹</span><span class="lang-code">PT</span>
    </button>
    <button type="button" class="henro-lang-btn" data-lang="es" title="Español">
      <span class="flag-icon">🇪🇸</span><span class="lang-code">ES</span>
    </button>
    <button type="button" class="henro-lang-btn" data-lang="fr" title="Français">
      <span class="flag-icon">🇫🇷</span><span class="lang-code">FR</span>
    </button>
    <button type="button" class="henro-lang-btn" data-lang="ja" title="日本語">
      <span class="flag-icon">🇯🇵</span><span class="lang-code">JA</span>
    </button>
  </div>
  <!-- STEP18_LANGUAGE_FLAG_SWITCHER_END -->
</header>`;

    if (headerHtml.includes('</header>')) {
      headerHtml = headerHtml.replace('</header>', langBarMarkup);
      fs.writeFileSync(headerPath, headerHtml, 'utf8');
      console.log('✓ Injected Language Flag Switcher (EN, PT, ES, FR, JA) into src/components/Header.astro.');
    }
  } else {
    console.log('• src/components/Header.astro already contains the Language Flag Switcher.');
  }
}

// ---------------------------------------------------------------------------
// 9. APPEND FLAG SWITCHER CSS TO src/styles/global.css
// ---------------------------------------------------------------------------
const globalCssPath = path.join(root, 'src/styles/global.css');
if (fs.existsSync(globalCssPath)) {
  let css = fs.readFileSync(globalCssPath, 'utf8');
  if (!css.includes('STEP18_LANG_SWITCHER_CSS')) {
    const langCss = `
/* ==========================================================================
   STEP18_LANG_SWITCHER_CSS — Discrete Washi & Dark-Road Flag Buttons
   ========================================================================== */
.henro-lang-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 10px;
  flex-wrap: wrap;
}

.henro-lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  color: rgba(230, 223, 207, 0.72);
  background: rgba(28, 26, 23, 0.45);
  border: 1px solid rgba(197, 186, 162, 0.22);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.henro-lang-btn:hover {
  color: #F4F1EA;
  border-color: rgba(197, 186, 162, 0.55);
  background: rgba(28, 26, 23, 0.75);
}

.henro-lang-btn.is-active {
  color: #F4F1EA;
  background: rgba(110, 43, 37, 0.82);
  border-color: rgba(197, 186, 162, 0.65);
}

.henro-lang-btn .flag-icon {
  font-size: 0.82rem;
  line-height: 1;
}
`;
    fs.writeFileSync(globalCssPath, css + '\n' + langCss, 'utf8');
    console.log('✓ Added Language Flag Switcher styles to src/styles/global.css.');
  }
}

// ---------------------------------------------------------------------------
// 10. INJECT STATIC PRE-GENERATED TRANSLATION LOADER INTO BaseLayout.astro
// ---------------------------------------------------------------------------
const baseLayoutPath = path.join(root, 'src/layouts/BaseLayout.astro');
if (fs.existsSync(baseLayoutPath)) {
  let layoutHtml = fs.readFileSync(baseLayoutPath, 'utf8');

  if (!layoutHtml.includes('STEP18_STATIC_I18N_RUNTIME_START')) {
    const i18nLoaderScript = `
    <!-- STEP18_STATIC_I18N_RUNTIME_START -->
    <script is:inline>
      (function () {
        const STORAGE_KEY = 'camino_henro_lang';
        const SUPPORTED = ['en', 'pt', 'es', 'fr', 'ja'];
        const originalTextNodes = new Map();
        const originalAttributes = [];
        let OriginalEssaySnapshot = null;

        function getInitialLang() {
          const urlParams = new URLSearchParams(window.location.search);
          const fromQuery = urlParams.get('lang');
          if (fromQuery && SUPPORTED.includes(fromQuery)) {
            localStorage.setItem(STORAGE_KEY, fromQuery);
            return fromQuery;
          }
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved && SUPPORTED.includes(saved)) return saved;
          return 'en';
        }

        function snapshotOriginalDom() {
          if (originalTextNodes.size > 0) return;

          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode(node) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                  return NodeFilter.FILTER_REJECT;
                }
                if (parent.closest('#henro-lang-switcher')) {
                  return NodeFilter.FILTER_REJECT;
                }
                const trimmed = node.nodeValue.replace(/\\s+/g, ' ').trim();
                if (trimmed.length < 2) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );

          let current;
          while ((current = walker.nextNode())) {
            originalTextNodes.set(current, current.nodeValue);
          }

          document.querySelectorAll('[placeholder], [aria-label], [title]').forEach(el => {
            if (el.closest('#henro-lang-switcher')) return;
            ['placeholder', 'aria-label', 'title'].forEach(attr => {
              const val = el.getAttribute(attr);
              if (val) originalAttributes.push({ el, attr, val });
            });
          });

          const articleBody = document.querySelector('[data-essay-body], article .prose, .essay-body, .essay-content');
          if (articleBody) {
            OriginalEssaySnapshot = articleBody.innerHTML;
          }
        }

        function restoreEnglishDom() {
          originalTextNodes.forEach((origVal, node) => {
            node.nodeValue = origVal;
          });
          originalAttributes.forEach(({ el, attr, val }) => {
            el.setAttribute(attr, val);
          });
          const articleBody = document.querySelector('[data-essay-body], article .prose, .essay-body, .essay-content');
          if (articleBody && OriginalEssaySnapshot !== null) {
            articleBody.innerHTML = OriginalEssaySnapshot;
          }
          document.documentElement.lang = 'en';
        }

        function updateActiveButtons(lang) {
          document.querySelectorAll('#henro-lang-switcher .henro-lang-btn').forEach(btn => {
            const isMatch = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('is-active', isMatch);
            btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
          });
        }

        function buildReverseLookup(siteDict) {
          const map = new Map();
          if (siteDict && siteDict.ui) {
            Object.entries(siteDict.ui).forEach(([en, tr]) => {
              if (en && tr) map.set(en.replace(/\\s+/g, ' ').trim(), tr);
            });
          }
          return map;
        }

        async function applyLanguage(lang) {
          snapshotOriginalDom();
          updateActiveButtons(lang);
          localStorage.setItem(STORAGE_KEY, lang);

          if (lang === 'en') {
            restoreEnglishDom();
            return;
          }

          restoreEnglishDom();
          document.documentElement.lang = lang === 'pt' ? 'pt-PT' : lang;

          try {
            const res = await fetch('/i18n/' + lang + '/site.json');
            if (res.ok) {
              const siteDict = await res.json();
              const lookup = buildReverseLookup(siteDict);

              originalTextNodes.forEach((origVal, node) => {
                const normalized = origVal.replace(/\\s+/g, ' ').trim();
                if (lookup.has(normalized)) {
                  const leading = (origVal.match(/^\\s*/) || [''])[0];
                  const trailing = (origVal.match(/\\s*$/) || [''])[0];
                  node.nodeValue = leading + lookup.get(normalized) + trailing;
                }
              });

              originalAttributes.forEach(({ el, attr, val }) => {
                const normalized = val.replace(/\\s+/g, ' ').trim();
                if (lookup.has(normalized)) {
                  el.setAttribute(attr, lookup.get(normalized));
                }
              });
            }

            // Check if current page is an individual essay page (/essays/<slug>)
            const pathMatch = window.location.pathname.match(/^\\/essays\\/([^\\/]+)\\/?$/);
            if (pathMatch && pathMatch[1]) {
              const slug = pathMatch[1];
              const essayRes = await fetch('/i18n/' + lang + '/essays/' + slug + '.json');
              if (essayRes.ok) {
                const essayData = await essayRes.json();
                const titleEl = document.querySelector('h1');
                if (titleEl && essayData.title) titleEl.textContent = essayData.title;
                const articleBody = document.querySelector('[data-essay-body], article .prose, .essay-body, .essay-content');
                if (articleBody && essayData.body) {
                  // Render translated paragraphs cleanly
                  articleBody.innerHTML = essayData.body
                    .split(/\\n\\n+/)
                    .map(p => {
                      const trimmed = p.trim();
                      if (trimmed.startsWith('>')) {
                        return '<blockquote>' + trimmed.replace(/^>\\s*/, '') + '</blockquote>';
                      }
                      return '<p>' + trimmed + '</p>';
                    })
                    .join('\\n');
                }
              }
            }
          } catch (err) {
            console.warn('Pre-generated translation not yet available for', lang, err);
          }
        }

        function bindSwitcher() {
          document.querySelectorAll('#henro-lang-switcher .henro-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetLang = btn.getAttribute('data-lang') || 'en';
              applyLanguage(targetLang);
            });
          });
          const initial = getInitialLang();
          if (initial !== 'en') {
            applyLanguage(initial);
          } else {
            updateActiveButtons('en');
          }
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', bindSwitcher, { once: true });
        } else {
          bindSwitcher();
        }
        document.addEventListener('astro:page-load', () => {
          originalTextNodes.clear();
          originalAttributes.length = 0;
          OriginalEssaySnapshot = null;
          bindSwitcher();
        });
      })();
    </script>
    <!-- STEP18_STATIC_I18N_RUNTIME_END -->
  </body>`;

    layoutHtml = layoutHtml.replace('</body>', i18nLoaderScript);
    fs.writeFileSync(baseLayoutPath, layoutHtml, 'utf8');
    console.log('✓ Injected Static Pre-Generated Translation Loader into src/layouts/BaseLayout.astro.');
  } else {
    console.log('• src/layouts/BaseLayout.astro already contains the Static I18n Loader.');
  }
}

console.log('\n🎉 Step 18 Installation Complete!');

