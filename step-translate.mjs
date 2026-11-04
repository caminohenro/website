/**
 * step20-i18n-auto-translator.mjs
 *
 * Self-contained Node.js installer script for the Camino Henro
 * Incremental AI Translation System (English -> PT, ES, JA) with
 * SHA-256 Lock Tracking, Editorial Inbox Triage ('auto' | 'queue' | 'ignore'),
 * Pages CMS Mobile Trigger, GitHub Actions Workflow, and Header Flag Switcher.
 *
 * Usage on Windows / macOS / Linux:
 *   node step20-i18n-auto-translator.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFileSafe(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Wrote ${relPath}`);
}

function readJsonSafe(relPath, fallback = {}) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return fallback;
  try {
    const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`⚠ Warning reading ${relPath}, using fallback:`, err.message);
    return fallback;
  }
}

console.log('================================================================');
console.log(' STEP 20: Incremental AI Translation & Editorial Triage System');
console.log('================================================================\n');

// ============================================================================
// 1. SAFELY UPDATE src/data/siteConfig.json & INITIALIZE translationLock.json
// ============================================================================
const siteConfigPath = 'src/data/siteConfig.json';
const existingSiteConfig = readJsonSafe(siteConfigPath, {
  siteTitleJp: 'カミノ遍路',
  siteTitleEn: 'CAMINO HENRO',
  tagline: 'From the End of the Earth to the Land of the Rising Sun',
  pilgrimAlias: 'Henro',
  routeSummary: 'Finisterra, Spain → Shikoku, Japan',
  currentLocation: 'Finisterra, Galicia, Spain',
  crestImage: '/assets/logo.png',
  backgroundImage: '/assets/apple-bg.jpeg',
  stripeDonationUrl: 'https://buy.stripe.com/test_placeholder',
  giscus: {
    repo: 'YOUR_GITHUB_USERNAME/camino-henro',
    category: 'General',
  },
  features: {
    enableInventory: true,
    enableMap: true,
    enableForum: true,
    enableGallery: true,
  },
  supabase: {
    url: 'https://ojeztracxcevamopdveb.supabase.co',
    anonKey: 'sb_publishable_xnp4AuAecUicaDt4sz43pg_zK-HwRij',
  },
  mailerlite: {
    formActionUrl: 'https://assets.mailerlite.com/jsonp/2695563/forms/202582490539361874/subscribe',
    apiKey: 'YOUR_MAILERLITE_API_KEY_OPTIONAL',
    groupId: '202582509810092026',
  },
  navigation: [
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
  ],
});

const defaultLocales = [
  { code: 'en', label: 'EN', name: 'English', flag: '🇬🇧', enabled: true },
  { code: 'pt', label: 'PT', name: 'Português', flag: '🇵🇹', enabled: true },
  { code: 'es', label: 'ES', name: 'Español', flag: '🇪🇸', enabled: true },
  { code: 'ja', label: 'JP', name: '日本語', flag: '🇯🇵', enabled: true },
];

existingSiteConfig.i18n = {
  defaultLocale: existingSiteConfig.i18n?.defaultLocale || 'en',
  triggerCloudTranslation: existingSiteConfig.i18n?.triggerCloudTranslation ?? false,
  locales:
    Array.isArray(existingSiteConfig.i18n?.locales) && existingSiteConfig.i18n.locales.length > 0
      ? existingSiteConfig.i18n.locales
      : defaultLocales,
};

writeFileSafe(siteConfigPath, JSON.stringify(existingSiteConfig, null, 2) + '\n');

const lockPath = 'src/data/translationLock.json';
if (!fs.existsSync(path.join(ROOT, lockPath))) {
  writeFileSafe(
    lockPath,
    JSON.stringify(
      {
        lastRun: null,
        files: {},
      },
      null,
      2
    ) + '\n'
  );
} else {
  const existingLock = readJsonSafe(lockPath, { lastRun: null, files: {} });
  if (!existingLock.files || typeof existingLock.files !== 'object') {
    existingLock.files = {};
  }
  if (!('lastRun' in existingLock)) {
    existingLock.lastRun = null;
  }
  writeFileSafe(lockPath, JSON.stringify(existingLock, null, 2) + '\n');
}

// ============================================================================
// 2. CREATE src/data/uiStrings.json & LOCALIZED PLACEHOLDER FOLDERS
// ============================================================================
const uiStringsEn = {
  nav: {
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
    donate: 'Donate 印',
    languageSelectorLabel: 'Select Language',
  },
  banners: {
    untranslatedNotice:
      'This dispatch has not yet been translated into your selected language. Showing the original English manuscript below.',
    backToEnglish: 'View Original English',
  },
  home: {
    eyebrow: '同行二人 • WALKING TOGETHER',
    heroSubtitle: 'From the End of the Earth to the Land of the Rising Sun',
    latestDispatchesHeading: 'Latest Trail Dispatches',
    readDispatchBtn: 'Read Dispatch →',
    viewAllEssaysBtn: 'Open Full Dispatch Archive',
    currentLocationLabel: 'Current Trailhead',
  },
  essays: {
    pageTitle: 'Trail Dispatches & Essays',
    pageSubtitle: 'Field notes, philosophical reflections, and daily mileage from the road.',
    backToArchive: '← Back to Dispatch Archive',
    distanceLabel: 'Distance Walked',
    readingTimeLabel: 'Reading Time',
  },
  faq: {
    pageTitle: 'Frequently Asked Questions',
    pageSubtitle: 'Practical logistics, philosophical roots, and equipment notes for the pilgrimage.',
  },
  credits: {
    pageTitle: 'Credits & Gratitude (Osettai)',
    pageSubtitle: 'Every step is made possible by the hospitality and kindness of strangers along the way.',
  },
  inventory: {
    pageTitle: 'Pilgrim Gear Inventory',
    pageSubtitle: 'Every item carried on the back, weighed to the gram and tested by rain and stone.',
  },
  map: {
    pageTitle: 'Pilgrimage Route & Checkpoints',
    pageSubtitle: 'Interactive trail log from Finisterra across Europe and onward to Shikoku.',
  },
  finances: {
    pageTitle: 'Pilgrimage Finances & Osettai Ledger',
    pageSubtitle: 'Transparent accounting of trail expenses and community offerings.',
  },
  newsletter: {
    eyebrow: '書簡 • DISPATCHES',
    heading: 'Pilgrimage Newsletter',
    copy: 'No noise, no algorithms—only a quiet note in your inbox whenever a new dispatch is written from the trail. Sent via MailerLite.',
    placeholder: 'Enter your email address...',
    submitBtn: 'Subscribe to Dispatches 印',
  },
};

const uiStringsPath = 'src/data/uiStrings.json';
if (!fs.existsSync(path.join(ROOT, uiStringsPath))) {
  writeFileSafe(uiStringsPath, JSON.stringify(uiStringsEn, null, 2) + '\n');
} else {
  const mergedUi = { ...uiStringsEn, ...readJsonSafe(uiStringsPath, {}) };
  writeFileSafe(uiStringsPath, JSON.stringify(mergedUi, null, 2) + '\n');
}

// Seed initial localized UI dictionaries if they do not exist yet so localized routes work out of the box
const initialLocalizedUi = {
  pt: {
    nav: {
      home: 'Início',
      blog: 'Diário',
      faq: 'Perguntas',
      credits: 'Gratidão',
      comingSoon: 'Em Breve',
      map: 'Mapa',
      inventory: 'Inventário',
      finances: 'Finanças',
      gallery: 'Galeria',
      forum: 'Fórum',
      donate: 'Apoiar 印',
      languageSelectorLabel: 'Selecionar Idioma',
    },
    banners: {
      untranslatedNotice:
        'Este relato ainda não foi traduzido para o português. Exibindo o manuscrito original em inglês abaixo.',
      backToEnglish: 'Ver Original em Inglês',
    },
    home: {
      eyebrow: '同行二人 • CAMINHANDO JUNTOS',
      heroSubtitle: 'Do Fim do Mundo à Terra do Sol Nascente',
      latestDispatchesHeading: 'Últimos Relatos da Trilha',
      readDispatchBtn: 'Ler Relato →',
      viewAllEssaysBtn: 'Ver Arquivo Completo',
      currentLocationLabel: 'Localização Atual',
    },
    essays: {
      pageTitle: 'Relatos & Ensaios da Trilha',
      pageSubtitle: 'Notas de campo, reflexões filosóficas e quilometragem diária da estrada.',
      backToArchive: '← Voltar ao Arquivo',
      distanceLabel: 'Distância Percorrida',
      readingTimeLabel: 'Tempo de Leitura',
    },
    faq: {
      pageTitle: 'Perguntas Frequentes',
      pageSubtitle: 'Logística prática, raízes filosóficas e notas sobre o equipamento de peregrinação.',
    },
    credits: {
      pageTitle: 'Créditos & Gratidão (Osettai)',
      pageSubtitle: 'Cada passo é tornado possível pela hospitalidade e bondade de estranhos pelo caminho.',
    },
    inventory: {
      pageTitle: 'Inventário de Equipamento',
      pageSubtitle: 'Cada item carregado nas costas, pesado ao grama e testado pela chuva e pela pedra.',
    },
    map: {
      pageTitle: 'Rota de Peregrinação & Pontos de Controle',
      pageSubtitle: 'Registro interativo de Finisterra através da Europa até Shikoku.',
    },
    finances: {
      pageTitle: 'Finanças da Peregrinação & Livro Osettai',
      pageSubtitle: 'Contabilidade transparente de despesas de trilha e ofertas da comunidade.',
    },
    newsletter: {
      eyebrow: '書簡 • CARTAS DA TRILHA',
      heading: 'Boletim da Peregrinação',
      copy: 'Sem ruído, sem algoritmos—apenas uma nota tranquila na sua caixa de entrada sempre que um novo relato for escrito.',
      placeholder: 'Digite seu endereço de e-mail...',
      submitBtn: 'Assinar Relatos 印',
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      blog: 'Crónicas',
      faq: 'Preguntas',
      credits: 'Gratitud',
      comingSoon: 'Próximamente',
      map: 'Mapa',
      inventory: 'Inventario',
      finances: 'Finanzas',
      gallery: 'Galería',
      forum: 'Foro',
      donate: 'Donar 印',
      languageSelectorLabel: 'Seleccionar Idioma',
    },
    banners: {
      untranslatedNotice:
        'Esta crónica aún no ha sido traducida al español. Mostrando el manuscrito original en inglés a continuación.',
      backToEnglish: 'Ver Original en Inglés',
    },
    home: {
      eyebrow: '同行二人 • CAMINANDO JUNTOS',
      heroSubtitle: 'Desde el Fin de la Tierra hasta la Tierra del Sol Naciente',
      latestDispatchesHeading: 'Últimas Crónicas del Camino',
      readDispatchBtn: 'Leer Crónica →',
      viewAllEssaysBtn: 'Abrir Archivo Completo',
      currentLocationLabel: 'Ubicación Actual',
    },
    essays: {
      pageTitle: 'Crónicas y Ensayos del Camino',
      pageSubtitle: 'Notas de campo, reflexiones filosóficas y kilometraje diario desde la ruta.',
      backToArchive: '← Volver al Archivo',
      distanceLabel: 'Distancia Recorrida',
      readingTimeLabel: 'Tiempo de Lectura',
    },
    faq: {
      pageTitle: 'Preguntas Frecuentes',
      pageSubtitle: 'Logística práctica, raíces filosóficas y notas de equipo para la peregrinación.',
    },
    credits: {
      pageTitle: 'Créditos y Gratitud (Osettai)',
      pageSubtitle: 'Cada paso es posible gracias a la hospitalidad y amabilidad de desconocidos en el camino.',
    },
    inventory: {
      pageTitle: 'Inventario de Equipo del Peregrino',
      pageSubtitle: 'Cada artículo llevado a la espalda, pesado al gramo y probado por la lluvia y la piedra.',
    },
    map: {
      pageTitle: 'Ruta de Peregrinación y Puntos de Control',
      pageSubtitle: 'Registro interactivo desde Finisterra a través de Europa hacia Shikoku.',
    },
    finances: {
      pageTitle: 'Finanzas de la Peregrinación y Libro Osettai',
      pageSubtitle: 'Contabilidad transparente de gastos en ruta y ofrendas de la comunidad.',
    },
    newsletter: {
      eyebrow: '書簡 • DESPACHOS',
      heading: 'Boletín de la Peregrinación',
      copy: 'Sin ruido, sin algoritmos: solo una nota tranquila en tu bandeja de entrada cuando se escriba una nueva crónica.',
      placeholder: 'Introduce tu correo electrónico...',
      submitBtn: 'Suscribirse a las Crónicas 印',
    },
  },
  ja: {
    nav: {
      home: 'ホーム',
      blog: '遍路日記',
      faq: 'よくある質問',
      credits: '謝辞・お接待',
      comingSoon: '準備中',
      map: '巡礼地図',
      inventory: '装備一覧',
      finances: '巡礼収支',
      gallery: '写真館',
      forum: '掲示板',
      donate: 'お接待・支援 印',
      languageSelectorLabel: '言語を選択',
    },
    banners: {
      untranslatedNotice:
        'この記事はまだ日本語に翻訳されていません。以下に英語の原文を表示しています。',
      backToEnglish: '英語の原文を表示',
    },
    home: {
      eyebrow: '同行二人 • ふたりで歩む道',
      heroSubtitle: '地の果てフィニステレから日出づる国・四国へ',
      latestDispatchesHeading: '最新の遍路日記・紀行文',
      readDispatchBtn: '記事を読む →',
      viewAllEssaysBtn: 'すべての記録を見る',
      currentLocationLabel: '現在地',
    },
    essays: {
      pageTitle: '遍路日記・エッセイ',
      pageSubtitle: '道中の記録、哲学的な思索、そして日々の歩行距離。',
      backToArchive: '← 記録一覧へ戻る',
      distanceLabel: '歩行距離',
      readingTimeLabel: '読了目安',
    },
    faq: {
      pageTitle: 'よくある質問 (FAQ)',
      pageSubtitle: '巡礼の計画、精神的な背景、装備に関する質問と回答。',
    },
    credits: {
      pageTitle: '謝辞とお接待の記録',
      pageSubtitle: 'この旅の一歩一歩は、道中で出会った皆様の温かいご厚意によって支えられています。',
    },
    inventory: {
      pageTitle: '巡礼装備インベントリ',
      pageSubtitle: '背中に背負うすべての道具。グラム単位の重量と道中の物語。',
    },
    map: {
      pageTitle: '巡礼ルート＆チェックポイント',
      pageSubtitle: 'スペイン・フィニステレからヨーロッパを横断し、日本・四国へと続く軌跡。',
    },
    finances: {
      pageTitle: '巡礼収支・お接待帳',
      pageSubtitle: '道中の経費と皆様からいただいたお接待の透明な記録。',
    },
    newsletter: {
      eyebrow: '書簡 • DISPATCHES',
      heading: '巡礼ニュースレター',
      copy: 'アルゴリズムや喧騒から離れ、新しい記録が綴られたときだけ静かな便りをお届けします。',
      placeholder: 'メールアドレスを入力...',
      submitBtn: '便りを購読する 印',
    },
  },
};

for (const [locale, dict] of Object.entries(initialLocalizedUi)) {
  ensureDir(path.join(ROOT, `src/content/essays/${locale}`));
  ensureDir(path.join(ROOT, `src/data/i18n/${locale}`));
  const targetUiPath = `src/data/i18n/${locale}/uiStrings.json`;
  if (!fs.existsSync(path.join(ROOT, targetUiPath))) {
    writeFileSafe(targetUiPath, JSON.stringify(dict, null, 2) + '\n');
  }
}

// ============================================================================
// 3. UPDATE src/content/config.ts WITH translationControl TRIAGE FIELD
// ============================================================================
const contentConfigTs = `import { defineCollection, z } from 'astro:content';

const essaysCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    location: z.string(),
    kilometersWalked: z.number().optional(),
    readingTime: z.string().optional(),
    excerpt: z.string(),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
    translationControl: z.enum(['auto', 'queue', 'ignore']).default('auto'),
  }),
});

export const collections = {
  essays: essaysCollection,
};
`;

writeFileSafe('src/content/config.ts', contentConfigTs);

// Ensure existing English root essays have translationControl: 'auto' in frontmatter if missing
const essaysDir = path.join(ROOT, 'src/content/essays');
ensureDir(essaysDir);
const rootEssayFiles = fs
  .readdirSync(essaysDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

for (const fileEntry of rootEssayFiles) {
  const fullEssayPath = path.join(essaysDir, fileEntry.name);
  const rawMd = fs.readFileSync(fullEssayPath, 'utf8');
  const fmMatch = rawMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch && !/^translationControl\s*:/m.test(fmMatch[1])) {
    const lineBreak = rawMd.includes('\r\n') ? '\r\n' : '\n';
    const updatedFm = fmMatch[1].trimEnd() + `${lineBreak}translationControl: auto`;
    const updatedMd = rawMd.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---${lineBreak}${updatedFm}${lineBreak}---`);
    fs.writeFileSync(fullEssayPath, updatedMd, 'utf8');
    console.log(`✓ Added default "translationControl: auto" to src/content/essays/${fileEntry.name}`);
  }
}

// ============================================================================
// 4. CREATE INCREMENTAL AI TRANSLATION ENGINE (scripts/translate-site.mjs)
// ============================================================================
const translateSiteScript = `#!/usr/bin/env node
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
  const lines = fs.readFileSync(envPath, 'utf8').split(/\\r?\\n/);
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
  const match = markdown.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?([\\s\\S]*)$/);
  if (!match) {
    return { frontmatterRaw: '', data: {}, body: markdown, lineBreak: '\\n' };
  }
  const lineBreak = markdown.includes('\\r\\n') ? '\\r\\n' : '\\n';
  const frontmatterRaw = match[1];
  const body = match[2];
  const data = {};
  const lines = frontmatterRaw.split(/\\r?\\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_-]+)\\s*:\\s*(.*)$/);
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
  const lineBreak = markdown.includes('\\r\\n') ? '\\r\\n' : '\\n';
  const match = markdown.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---/);
  if (!match) return markdown;
  const fm = match[1];
  const regex = new RegExp(\`^(\${key}\\\\s*:\\\\s*).*$\`, 'm');
  let updatedFm;
  if (regex.test(fm)) {
    updatedFm = fm.replace(regex, \`$1\${newValue}\`);
  } else {
    updatedFm = fm.trimEnd() + \`\${lineBreak}\${key}: \${newValue}\`;
  }
  return markdown.replace(/^---\\r?\\n[\\s\\S]*?\\r?\\n---/, \`---\${lineBreak}\${updatedFm}\${lineBreak}---\`);
}

function normalizeEssayForHash(markdown) {
  // Normalize translationControl so flipping 'queue' -> 'auto' doesn't create a false hash mismatch
  return setFrontmatterField(markdown, 'translationControl', 'auto').replace(/\\r\\n/g, '\\n').trim();
}

async function callGemini(apiKey, systemInstruction, userPrompt, responseMimeType = 'text/plain') {
  const endpoint = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${encodeURIComponent(apiKey)}\`;
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
    throw new Error(\`Gemini API HTTP \${res.status}: \${errText}\`);
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
    .replace(/^\\\`\\\`\\\`(?:markdown|md|json|yaml)?\\r?\\n/i, '')
    .replace(/\\r?\\n\\\`\\\`\\\`$/i, '')
    .trim();
}

async function translateMarkdownEssay(apiKey, rawMarkdown, targetLocale) {
  const systemPrompt = [
    \`You are a literary translator for "Camino Henro", a contemplative pilgrimage journal from Finisterra, Spain to Shikoku, Japan.\`,
    \`Translate the provided Markdown essay from English into \${targetLocale.name} (locale code: \${targetLocale.code}).\`,
    \`STRICT RULES:\`,
    \`1. Return ONLY valid Markdown including the YAML frontmatter block delimited by --- at the top.\`,
    \`2. In the YAML frontmatter, translate ONLY the values of: "title", "subtitle", "location", "readingTime", and "excerpt".\`,
    \`3. Preserve "date", "kilometersWalked", "draft", "heroImage", and "translationControl: auto" 100% untouched.\`,
    \`4. Always wrap translated YAML string values in double quotes ("...") if they contain colons or special punctuation.\`,
    \`5. Translate the full Markdown body faithfully with poetic, contemplative literary tone while preserving all Markdown headings, links, images, and blockquotes.\`,
  ].join('\\n');

  const rawResult = await callGemini(apiKey, systemPrompt, rawMarkdown, 'text/plain');
  let cleaned = cleanCodeFences(rawResult);
  if (!cleaned.startsWith('---')) {
    throw new Error(\`Translated essay for \${targetLocale.code} did not start with YAML frontmatter (---).\`);
  }
  cleaned = setFrontmatterField(cleaned, 'translationControl', 'auto');
  return cleaned + '\\n';
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
    \`You are a literary and UI translator for "Camino Henro", a contemplative pilgrimage website.\`,
    \`Translate the string values in the provided JSON object from English into \${targetLocale.name} (locale code: \${targetLocale.code}).\`,
    \`STRICT RULES:\`,
    \`1. Keep 100% of JSON keys, object structure, and array lengths identical.\`,
    \`2. Translate ONLY the human-readable prose values.\`,
    \`3. Do NOT alter IDs, dates, numbers, coordinates, URLs, or enum values.\`,
    \`4. Return valid JSON only.\`,
  ].join('\\n');

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
  console.log(\` Target Locales: \${targetLocales.map((l) => \`\${l.flag} \${l.code.toUpperCase()}\`).join(', ') || 'None'}\`);
  console.log('================================================================\\n');

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
    const relKey = \`src/content/essays/\${entry.name}\`;
    const fullPath = path.join(ESSAYS_DIR, entry.name);
    let rawContent = fs.readFileSync(fullPath, 'utf8');
    const parsed = parseFrontmatter(rawContent);
    const control = (parsed.data.translationControl || 'auto').toLowerCase();
    const contentHash = sha256(normalizeEssayForHash(rawContent));

    if (!lockData.files[relKey]) {
      lockData.files[relKey] = {};
    }

    console.log(\`\\n📄 Essay: \${relKey} [translationControl: \${control}]\`);

    // RULE 1: Explicit Ignore
    if (control === 'ignore') {
      for (const loc of targetLocales) {
        lockData.files[relKey][loc.code] = {
          hash: contentHash,
          updatedAt: new Date().toISOString(),
          status: 'ignored',
        };
        console.log(\`   [\${loc.code.toUpperCase()}] ⊘ [Ignored by User Setting]\`);
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
        console.log(\`   [\${loc.code.toUpperCase()}] ✓ [Skipped - Up to date]\`);
        continue;
      }

      // RULE 3: Modified English essay, but prior translation exists and translationControl === 'auto'
      if (!hashMatches && targetExists && control === 'auto') {
        console.log(
          \`   [\${loc.code.toUpperCase()}] ⏸ [Pending Review - Set to 'queue' to translate or 'ignore' to dismiss]\`
        );
        continue;
      }

      // TRANSLATE RULE: Brand-new file (!targetExists) OR explicitly queued (control === 'queue')
      if (!apiKey) {
        console.warn(
          \`   [\${loc.code.toUpperCase()}] ⚠ Skipped translation: GEMINI_API_KEY is not set in environment or .env.\`
        );
        allQueuedLocalesSucceeded = false;
        continue;
      }

      try {
        console.log(\`   [\${loc.code.toUpperCase()}] 🚀 Translating into \${loc.name}...\`);
        const translatedMd = await translateMarkdownEssay(apiKey, rawContent, loc);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetFile, translatedMd, 'utf8');

        lockData.files[relKey][loc.code] = {
          hash: contentHash,
          updatedAt: new Date().toISOString(),
          status: 'translated',
        };
        translatedAnyLocale = true;
        console.log(\`   [\${loc.code.toUpperCase()}] ✓ Saved src/content/essays/\${loc.code}/\${entry.name}\`);
      } catch (err) {
        allQueuedLocalesSucceeded = false;
        console.error(\`   [\${loc.code.toUpperCase()}] ✗ Failed translating \${entry.name}:\`, err.message);
      }
    }

    // Reset translationControl: 'queue' -> 'auto' in English frontmatter once queued run succeeds
    if (control === 'queue' && translatedAnyLocale && allQueuedLocalesSucceeded) {
      const updatedEnglishMd = setFrontmatterField(rawContent, 'translationControl', 'auto');
      fs.writeFileSync(fullPath, updatedEnglishMd, 'utf8');
      console.log(\`   ↺ Reset translationControl to 'auto' in \${relKey}\`);
    }
  }

  // --------------------------------------------------------------------------
  // STEP B: SCAN ENGLISH ROOT DATA FILES ONLY (src/data/*.json)
  // --------------------------------------------------------------------------
  for (const dataFileName of DATA_FILES_TO_TRANSLATE) {
    const fullDataPath = path.join(DATA_DIR, dataFileName);
    if (!fs.existsSync(fullDataPath)) continue;

    const relKey = \`src/data/\${dataFileName}\`;
    const rawJsonStr = fs.readFileSync(fullDataPath, 'utf8');
    const contentHash = sha256(rawJsonStr.replace(/\\r\\n/g, '\\n').trim());
    const originalObj = JSON.parse(rawJsonStr);

    if (!lockData.files[relKey]) {
      lockData.files[relKey] = {};
    }

    console.log(\`\\n📦 Data File: \${relKey}\`);

    for (const loc of targetLocales) {
      const targetDir = path.join(DATA_DIR, 'i18n', loc.code);
      const targetFile = path.join(targetDir, dataFileName);
      const targetExists = fs.existsSync(targetFile);
      const recordedHash = lockData.files[relKey]?.[loc.code]?.hash || null;

      if (recordedHash === contentHash && targetExists) {
        console.log(\`   [\${loc.code.toUpperCase()}] ✓ [Skipped - Up to date]\`);
        continue;
      }

      if (!apiKey) {
        // If no API key yet and target file already exists (e.g. seeded uiStrings.json), record hash or skip gracefully
        console.warn(
          \`   [\${loc.code.toUpperCase()}] ⚠ GEMINI_API_KEY not set. Skipping AI translation for \${dataFileName}.\`
        );
        continue;
      }

      try {
        console.log(\`   [\${loc.code.toUpperCase()}] 🚀 Translating \${dataFileName} into \${loc.name}...\`);
        const translatedObj = await translateDataJsonFile(apiKey, dataFileName, originalObj, loc);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetFile, JSON.stringify(translatedObj, null, 2) + '\\n', 'utf8');

        lockData.files[relKey][loc.code] = {
          hash: contentHash,
          updatedAt: new Date().toISOString(),
          status: 'translated',
        };
        console.log(\`   [\${loc.code.toUpperCase()}] ✓ Saved src/data/i18n/\${loc.code}/\${dataFileName}\`);
      } catch (err) {
        console.error(\`   [\${loc.code.toUpperCase()}] ✗ Failed translating \${dataFileName}:\`, err.message);
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP C: SAVE LOCK FILE & RESET CLOUD TRIGGER FLAG IN siteConfig.json
  // --------------------------------------------------------------------------
  lockData.lastRun = new Date().toISOString();
  fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify(lockData, null, 2) + '\\n', 'utf8');
  console.log(\`\\n🔒 Updated src/data/translationLock.json (lastRun: \${lockData.lastRun})\`);

  if (siteConfig?.i18n?.triggerCloudTranslation === true) {
    siteConfig.i18n.triggerCloudTranslation = false;
    fs.writeFileSync(SITE_CONFIG_PATH, JSON.stringify(siteConfig, null, 2) + '\\n', 'utf8');
    console.log('🔄 Reset siteConfig.i18n.triggerCloudTranslation -> false');
  }

  console.log('\\n✨ Translation run complete.');
}

main().catch((err) => {
  console.error('Fatal error in translate-site.mjs:', err);
  process.exit(1);
});
`;

writeFileSafe('scripts/translate-site.mjs', translateSiteScript);

// ============================================================================
// 5. UPDATE package.json WITH "translate" SCRIPT
// ============================================================================
const pkgPath = 'package.json';
if (fs.existsSync(path.join(ROOT, pkgPath))) {
  const pkg = readJsonSafe(pkgPath, {});
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.translate = 'node scripts/translate-site.mjs';
  writeFileSafe(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

// ============================================================================
// 6. CREATE src/utils/i18n.ts HELPER FOR COMPONENTS & LOCALIZED PAGES
// ============================================================================
const i18nHelperTs = `import siteConfig from '../data/siteConfig.json';
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
    return rest === '/' ? '/' : rest.replace(/\\/+$/, '');
  }
  return pathname === '/' ? '/' : pathname.replace(/\\/+$/, '') || '/';
}

export function localizeHref(href: string, locale: string): string {
  if (!href || !href.startsWith('/')) return href;
  const cleanBase = stripLocalePrefix(href);
  if (!locale || locale === 'en') return cleanBase;
  return cleanBase === '/' ? \`/\${locale}\` : \`/\${locale}\${cleanBase}\`;
}

export function getUiStrings(locale: string): typeof enUiStrings {
  if (!locale || locale === 'en') return enUiStrings;
  const key = \`../data/i18n/\${locale}/uiStrings.json\`;
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
    const locKey = \`../data/i18n/\${locale}/\${fileName}\`;
    const locMod = localeDataModules[locKey] as any;
    if (locMod) return (locMod.default || locMod) as T;
  }
  const rootKey = \`../data/\${fileName}\`;
  const rootMod = rootDataModules[rootKey] as any;
  return (rootMod?.default || rootMod || {}) as T;
}
`;

writeFileSafe('src/utils/i18n.ts', i18nHelperTs);

// ============================================================================
// 7. UPDATE src/components/Header.astro (PRESERVING 100% SCROLL & NAV LOGIC)
// ============================================================================
const updatedHeaderAstro = `---
import siteConfig from '../data/siteConfig.json';
import {
  getEnabledLocales,
  getLocaleFromPathname,
  stripLocalePrefix,
  localizeHref,
  getUiStrings,
} from '../utils/i18n';

const pathname = Astro.url.pathname;
const currentLocale = getLocaleFromPathname(pathname);
const basePathWithoutLocale = stripLocalePrefix(pathname);
const enabledLocales = getEnabledLocales();
const currentLocaleObj =
  enabledLocales.find((l) => l.code === currentLocale) || enabledLocales[0];
const ui = getUiStrings(currentLocale);

const isActive = (href?: string) => {
  if (!href) return false;
  const normPath = basePathWithoutLocale.toLowerCase();
  const normHref = stripLocalePrefix(href).toLowerCase();
  if (normHref === '/') return normPath === '/';
  return normPath === normHref || normPath.startsWith(normHref + '/');
};

const isGroupActive = (children?: Array<{ href?: string }>) => {
  if (!Array.isArray(children)) return false;
  return children.some((child) => isActive(child.href));
};

const navLabelKeyMap: Record<string, keyof typeof ui.nav> = {
  '/': 'home',
  '/essays': 'blog',
  '/faq': 'faq',
  '/credits': 'credits',
  '/map': 'map',
  '/inventory': 'inventory',
  '/finances': 'finances',
  '/gallery': 'gallery',
  '/forum': 'forum',
};

const translateNavItemLabel = (item: { label: string; href?: string; children?: any[] }) => {
  if (Array.isArray(item.children)) {
    return ui.nav.comingSoon || item.label;
  }
  if (item.href && navLabelKeyMap[item.href]) {
    const key = navLabelKeyMap[item.href];
    return ui.nav[key] || item.label;
  }
  return item.label;
};

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
        label: translateNavItemLabel(item),
        children: item.children
          .filter((child: any) => isFeatureEnabled(child.featureFlag))
          .map((child: any) => ({
            ...child,
            label: translateNavItemLabel(child),
            localizedHref: localizeHref(child.href, currentLocale),
          })),
      };
    }
    return {
      ...item,
      label: translateNavItemLabel(item),
      localizedHref: localizeHref(item.href, currentLocale),
    };
  })
  .filter((item: any) => !Array.isArray(item.children) || item.children.length > 0);
---

<header class="site-header">
  <a href={localizeHref('/', currentLocale)} class="header-brand">
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
      href={localizeHref('/donate', currentLocale)}
      class={'nav-btn donate-btn' + (isActive('/donate') ? ' active' : '')}
    >
      {ui.nav.donate}
    </a>

    {enabledLocales.length > 1 && (
      <div class="nav-dropdown lang-switcher">
        <button
          type="button"
          class="nav-btn nav-dropdown-toggle lang-switcher-toggle"
          aria-expanded="false"
          aria-label={ui.nav.languageSelectorLabel}
          title={ui.nav.languageSelectorLabel}
        >
          <span class="lang-flag" aria-hidden="true">{currentLocaleObj.flag}</span>
          <span class="lang-code">{currentLocaleObj.label}</span>
          <span class="nav-caret">▾</span>
        </button>
        <div class="nav-dropdown-menu lang-dropdown-menu">
          {enabledLocales.map((loc) => {
            const targetHref = localizeHref(basePathWithoutLocale, loc.code);
            const isCurrent = loc.code === currentLocale;
            return (
              <a
                href={targetHref}
                class={'nav-dropdown-item lang-dropdown-item' + (isCurrent ? ' active' : '')}
                data-lang-code={loc.code}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <span class="lang-item-flag" aria-hidden="true">{loc.flag}</span>
                <span class="lang-item-name">{loc.name}</span>
                <span class="lang-item-label">{loc.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    )}
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

writeFileSafe('src/components/Header.astro', updatedHeaderAstro);

// ============================================================================
// 8. CLEAN MERGE CONFLICTS & ADD LOCALE AWARENESS TO src/layouts/BaseLayout.astro
//    (100% PRESERVING ALL SCROLL PHYSICS, SNEAK PEEK, & MAILERLITE SCRIPTS)
// ============================================================================
const updatedBaseLayoutAstro = `---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import ScrollPhysics from '../components/ScrollPhysics.astro';
import siteConfig from '../data/siteConfig.json';
import { getLocaleFromPathname, stripLocalePrefix, getUiStrings } from '../utils/i18n';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
  startClosed?: boolean;
  enableScrollPhysics?: boolean;
}

// ============================================================================
// PER-PAGE SCROLL PHYSICS & INITIAL STATE CONFIGURATION
// Add page paths to INITIAL_CLOSED_SCROLL_PAGES to start closed on load,
// or override per page via <BaseLayout startClosed={true} enableScrollPhysics={true}>
// ============================================================================
const INITIAL_CLOSED_SCROLL_PAGES = ['/'];
const currentLocale = getLocaleFromPathname(Astro.url.pathname);
const normalizedPathname = stripLocalePrefix(Astro.url.pathname);
const ui = getUiStrings(currentLocale);

const {
  title = siteConfig.siteTitleJp + ' | ' + siteConfig.siteTitleEn,
  description = siteConfig.tagline,
  startClosed = INITIAL_CLOSED_SCROLL_PAGES.includes(normalizedPathname),
  enableScrollPhysics = true,
} = Astro.props;
---

<!doctype html>
<html lang={currentLocale}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href={siteConfig.crestImage} />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+JP:wght@400;600&family=Shippori+Mincho:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="selection:bg-[#6E2B25] selection:text-[#E6DFCF]">
    <!-- LAYER 1: Fixed Road & Apple Background -->
    <div
      class="fixed-backdrop"
      style="background-image: url('/assets/apple-bg.jpeg'), url('/assets/apple-diff.jpg');"
    ></div>
    <div class="backdrop-dimmer" id="dimmer"></div>

    <!-- PERSISTENT WEBSITE HEADER (Outside the Scroll) -->
    <Header />

    <!-- LAYER 2: THE INDIVIDUAL PAGE SCROLL WITH WOODEN ROLLERS -->
    <div
      class="scroll-stage"
      data-desktop-click-unfurl={startClosed ? 'true' : undefined}
      data-scroll-initial-wait={!startClosed ? 'true' : undefined}
      data-mobile-physics={enableScrollPhysics ? 'true' : undefined}
      data-mobile-start-closed={startClosed ? 'true' : 'false'}
    >
      <div class="scroll-roller-top"></div>
      <main class="washi-scroll">
        <slot />
        <Footer />
      </main>
      <div class="scroll-roller-bottom"></div>
    </div>

    <!-- THE SURPRISE REVEAL AT THE BOTTOM OF EVERY PAGE -->
    <div class="apple-reveal-stage">
      <div class="spacer-for-apple"></div>
      <div
        class="global-newsletter-box"
        id="global-newsletter-box"
        data-form-action={siteConfig.mailerlite?.formActionUrl || ''}
      >
        <div class="newsletter-eyebrow">{ui.newsletter.eyebrow}</div>
        <h2 class="newsletter-heading">{ui.newsletter.heading}</h2>
        <p class="newsletter-copy">
          {ui.newsletter.copy}
        </p>
        <form
          class="newsletter-form"
          id="global-newsletter-form"
          action={siteConfig.mailerlite?.formActionUrl || '#'}
          method="post"
          novalidate
        >
          <input
            type="email"
            name="fields[email]"
            class="newsletter-input"
            placeholder={ui.newsletter.placeholder}
            required
            aria-label="Email Address"
          />
          <div style="position:absolute; left:-5000px;" aria-hidden="true">
            <input
              type="text"
              name="confirm_email_honeypot"
              tabindex="-1"
              value=""
              autocomplete="off"
            />
          </div>
          <input type="hidden" name="ml-submit" value="1" />
          <input type="hidden" name="anticsrf" value="true" />
          <button type="submit" class="newsletter-submit-btn">
            {ui.newsletter.submitBtn}
          </button>
        </form>
        <div
          class="newsletter-response-msg"
          id="global-newsletter-msg"
          role="status"
          aria-live="polite"
          hidden
        ></div>
      </div>
    </div>

    <script is:inline>
      // Gently brighten the road & apple as the user scrolls past the bottom roller
      window.addEventListener('scroll', function () {
        const dimmer = document.getElementById('dimmer');
        if (!dimmer) return;
        const scrollBottom = window.scrollY + window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const revealProgress = Math.max(0, Math.min(1, (scrollBottom - (docHeight - window.innerHeight * 0.85)) / (window.innerHeight * 0.6)));
        const centerAlpha = (0.58 - revealProgress * 0.48).toFixed(2);
        const edgeAlpha = (0.84 - revealProgress * 0.35).toFixed(2);
        dimmer.style.setProperty('--center-dim', centerAlpha);
        dimmer.style.setProperty('--edge-dim', edgeAlpha);
      });
    </script>
    <!-- INITIAL_SCROLL_READY_V1 -->
    <script is:inline>
(function readinessCode() {

  // INITIAL_SCROLL_READY_V1

  window.scrollContentReady = async function (paper) {

    if (document.readyState === 'loading') {

      await new Promise(resolve =>

        document.addEventListener('DOMContentLoaded', resolve, {

          once: true

        })

      );

    }



    if (!paper.isConnected) return;



    // Page scripts remove these markers after their first render,

    // including when they render fallback content.

    await new Promise(resolve => {

      const pending = () =>

        paper.querySelector('[data-scroll-loading="true"]');



      if (!pending()) {

        resolve();

        return;

      }



      const observer = new MutationObserver(() => {

        if (!pending() || !paper.isConnected) {

          observer.disconnect();

          document.removeEventListener('astro:before-swap', cancel);

          resolve();

        }

      });



      function cancel() {

        observer.disconnect();

        document.removeEventListener('astro:before-swap', cancel);

        resolve();

      }



      observer.observe(paper, {

        subtree: true,

        attributes: true,

        childList: true

      });



      document.addEventListener('astro:before-swap', cancel, {

        once: true

      });

    });



    if (!paper.isConnected) return;



    // Make newly rendered text participate in font loading.

    void paper.offsetHeight;

    if (document.fonts) await document.fonts.ready;

  };

})();
    </script>
    {enableScrollPhysics && <ScrollPhysics />}
    <!-- SHARED_SCROLL_MOTION_V1 -->
    <script is:inline>
(function sharedScrollHelpers() {

  const pendingUnfurls = new WeakMap();

  // ==========================================================================
  // TWEAKABLE SNEAK PEEK ("YO-YO" BOUNCE) & NEWSLETTER DELAY CONFIGURATION
  // ==========================================================================
  window.SCROLL_SNEAK_PEEK_CONFIG = {
    enabled: true,
    initialDelayMs: 2400,   // Phase: delay before first bounce once closed
    cyclePeriodMs: 4500,    // Cycle: total period between bounce starts
    bounceDurationMs: 1100, // Duration of one down-and-up yo-yo motion
    desktopDistancePx: 38,  // Peek distance on desktop (px)
    mobileDistancePx: 34,   // Peek distance on mobile (px)
    newsletterCloseDelayMs: 420 // Delay before page height recalculates after scroll closes
  };

  window.clearDesktopSneakPeek = function (stage) {
    if (!stage) return;
    if (stage.__sneakPeekCleanup) stage.__sneakPeekCleanup();
    stage.style.removeProperty('--sneak-peek-offset');
    stage.style.removeProperty('--sneak-peek-opacity');
  };

  window.startDesktopSneakPeek = function (stage, isClosedCheck) {
    window.clearDesktopSneakPeek(stage);
    const cfg = window.SCROLL_SNEAK_PEEK_CONFIG;
    if (!cfg || !cfg.enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer = 0;
    let frame = 0;
    let stopped = false;

    function stop() {
      stopped = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      stage.style.removeProperty('--sneak-peek-offset');
      stage.style.removeProperty('--sneak-peek-opacity');
    }

    function schedule(first) {
      if (stopped || !isClosedCheck()) return;
      const wait = first ? cfg.initialDelayMs : Math.max(200, cfg.cyclePeriodMs - cfg.bounceDurationMs);
      timer = window.setTimeout(() => {
        if (stopped || !isClosedCheck()) return;
        const start = performance.now();
        const dur = cfg.bounceDurationMs;
        const amp = cfg.desktopDistancePx;
        stage.style.setProperty('--sneak-peek-opacity', '1');

        function tick(now) {
          if (stopped || !isClosedCheck()) {
            stop();
            return;
          }
          const t = Math.min(1, (now - start) / dur);
          const offset = amp * Math.sin(Math.PI * t);
          stage.style.setProperty('--sneak-peek-offset', offset.toFixed(2) + 'px');
          if (t < 1) {
            frame = window.requestAnimationFrame(tick);
          } else {
            stage.style.removeProperty('--sneak-peek-offset');
            stage.style.removeProperty('--sneak-peek-opacity');
            schedule(false);
          }
        }
        frame = window.requestAnimationFrame(tick);
      }, wait);
    }

    stage.__sneakPeekCleanup = stop;
    schedule(true);
  };



  window.scrollMovePosition = function (stage, targetY, from) {

    const styles = window.getComputedStyle(stage);

    const durationText = styles

      .getPropertyValue('--scroll-move-duration')

      .trim();



    const match = durationText.match(/^([\\d.]+)(ms|s)$/i);



    const duration = match

      ? Number(match[1]) *

        (match[2].toLowerCase() === 's' ? 1000 : 1)

      : 1000;



    const easing =

      styles.getPropertyValue('--scroll-move-easing').trim() ||

      'cubic-bezier(0.25, 0.1, 0.25, 1)';



    const origin = from || styles.translate;



    return stage.animate(

      [

        { translate: origin === 'none' ? '0px 0px' : origin },

        { translate: '0px ' + targetY + 'px' }

      ],

      { duration, easing, fill: 'both' }

    );

  };



  window.prepareScrollUnfurl = function (paper) {
    if (paper.parentElement) window.clearDesktopSneakPeek(paper.parentElement);

    // Remove an unfinished entrance's previous completion listener.

    pendingUnfurls.get(paper)?.();



    const names = [

      'animation',

      'height',

      'min-height',

      'max-height'

    ];



    const saved = names.map(name => ({

      name,

      value: paper.style.getPropertyValue(name),

      priority: paper.style.getPropertyPriority(name)

    }));



    let targetHeight;



    try {

      // Measure natural height synchronously, before the next paint.

      paper.style.setProperty('animation', 'none', 'important');

      paper.style.setProperty('height', 'auto', 'important');

      paper.style.setProperty(

        'min-height',

        'var(--scroll-unfurl-min-height, 72vh)',

        'important'

      );

      paper.style.setProperty('max-height', 'none', 'important');



      targetHeight = window.getComputedStyle(paper).height;

    } finally {

      saved.forEach(({ name, value, priority }) => {

        if (value) {

          paper.style.setProperty(name, value, priority);

        } else {

          paper.style.removeProperty(name);

        }

      });

    }



    paper.style.setProperty(

      '--scroll-unfurl-max-height',

      targetHeight

    );



    function detach() {

      paper.removeEventListener('animationend', onEnd);

      pendingUnfurls.delete(paper);

    }



    function onEnd(event) {

      if (

        event.target !== paper ||

        event.animationName !== 'scrollUnfurlDown'

      ) return;



      // Release the cap for later loaded or expanded content.

      paper.style.setProperty('--scroll-unfurl-max-height', 'none');

      detach();

    }



    pendingUnfurls.set(paper, detach);

    paper.addEventListener('animationend', onEnd);

  };

})();
    </script>
    <!-- HOME_DESKTOP_CLICK_V1 -->
    <script is:inline>


  (function () {

    const key = '__homeDesktopClickUnfurl';



    if (typeof window[key] === 'function') window[key]();



    const lifetime = new AbortController();

    const desktop = window.matchMedia('(min-width: 681px)');

    const reduced = window.matchMedia(

      '(prefers-reduced-motion: reduce)'

    );



    let cleanup = null;



    function initialize() {

      if (cleanup) cleanup();

      cleanup = null;



      if (!desktop.matches) return;



      const stage = document.querySelector(

        'body > .scroll-stage[data-desktop-click-unfurl="true"]'

      );

      if (!stage) return;



      const paper = stage.querySelector(

        ':scope > main.washi-scroll'

      );

      const rollers = [...stage.querySelectorAll(

        ':scope > .scroll-roller-top, ' +

        ':scope > .scroll-roller-bottom'

      )];



      if (!paper || rollers.length !== 2) return;



      const controls = new AbortController();



      const snapshots = rollers.map(element => ({

        element,

        attributes: [

          'role',

          'tabindex',

          'aria-label',

          'aria-expanded'

        ].map(name => [name, element.getAttribute(name)])

      }));



      const previousInert = paper.inert;

      let disposed = false;

      let activated = false;

      let movement = null;



      const hint = document.createElement('div');

      hint.className = 'home-click-hint';

      hint.setAttribute('aria-hidden', 'true');



      // HOME_CLICK_POSITION_V2
      hint.innerHTML =
        '<svg viewBox="0 0 36 40" width="26" height="29" aria-hidden="true">' +
          '<g class="home-click-pointer">' +
            '<path d="M12 11V31L17 26L21 35L25 33L21 24H29Z"/>' +
          '</g>' +
          '<g class="home-click-rays">' +
            '<path d="M12 2V5M4 5L6.5 7.5M2 13H5M20 5L17.5 7.5M4 21L6.5 18.5"/>' +
          '</g>' +
        '</svg>' +
        '<span>Click to unfurl</span>';



      stage.appendChild(hint);

      stage.dataset.homeUnfurl = 'waiting';
      window.startDesktopSneakPeek(stage, () => !activated && !disposed && stage.dataset.homeUnfurl === 'waiting');

      paper.inert = true;



      function restoreControls() {

        snapshots.forEach(({ element, attributes }) => {

          attributes.forEach(([name, value]) => {

            if (value === null) element.removeAttribute(name);

            else element.setAttribute(name, value);

          });

        });

      }



      async function open() {
        window.clearDesktopSneakPeek(stage);

        if (activated || disposed) return;

        activated = true;



        const from = window.getComputedStyle(stage).translate;

        stage.dataset.homeUnfurl = 'moving';



        if (!reduced.matches) {

          movement = window.scrollMovePosition(stage, 0, from);



          await movement.finished.catch(() => {});

        }



        if (disposed) return;



        // Hold the final position before cancelling the movement.

        // Only this state allows the paper to begin unfurling.

        window.prepareScrollUnfurl(paper);
        stage.dataset.homeUnfurl = 'opening';



        if (movement) {

          movement.cancel();

          movement = null;

        }



        paper.inert = previousInert;

        restoreControls();

        hint.remove();

      }



      rollers.forEach(roller => {

        roller.setAttribute('role', 'button');

        roller.setAttribute('tabindex', '0');

        roller.setAttribute(

          'aria-label',

          'Click to unfurl the scroll'

        );

        roller.setAttribute('aria-expanded', 'false');



        roller.addEventListener('click', open, {

          signal: controls.signal

        });



        roller.addEventListener('keydown', event => {

          if (event.key === 'Enter' || event.key === ' ') {

            event.preventDefault();

            void open();

          }

        }, {

          signal: controls.signal

        });

      });



      cleanup = () => {
        window.clearDesktopSneakPeek(stage);

        disposed = true;

        controls.abort();



        if (movement) movement.cancel();



        hint.remove();

        paper.inert = previousInert;

        restoreControls();

        delete stage.dataset.homeUnfurl;

      };

    }



    function destroy() {

      lifetime.abort();

      if (cleanup) cleanup();

      cleanup = null;

    }



    window[key] = destroy;



    desktop.addEventListener('change', initialize, {

      signal: lifetime.signal

    });



    document.addEventListener('astro:page-load', initialize, {

      signal: lifetime.signal

    });



    document.addEventListener('astro:before-swap', () => {

      if (cleanup) cleanup();

      cleanup = null;

    }, {

      signal: lifetime.signal

    });



    initialize();

  })();


    </script>

    <!-- SCROLL_CLOSE_NEWSLETTER_V1 desktop and newsletter -->
    <script is:inline>
(function desktopAndNewsletterCode() {
  const key = '__scrollCloseNewsletterV1';
  if (typeof window[key] === 'function') window[key]();

  const lifetime = new AbortController();
  const desktop = window.matchMedia('(min-width: 681px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cleanupPage = () => {};

  function initialize() {
    cleanupPage();

    const stage = document.querySelector('body > .scroll-stage');
    const paper = stage?.querySelector(':scope > main.washi-scroll');
    const top = stage?.querySelector(':scope > .scroll-roller-top');
    const bottom = stage?.querySelector(':scope > .scroll-roller-bottom');
    const spacer = document.querySelector(
      'body > .apple-reveal-stage > .spacer-for-apple'
    );

    if (!stage || !paper || !top || !bottom || !spacer) return;

    // Prepare the automatic initial unfurl on regular desktop pages.
    if (
      desktop.matches &&
      !reduced.matches &&
      stage.dataset.desktopClickUnfurl !== 'true' &&
      !paper.hasAttribute('data-initial-unfurl-prepared')
    ) {
      paper.setAttribute('data-initial-unfurl-prepared', '');
      window.scrollContentReady(paper).then(() => {
        if (disposed || !paper.isConnected || !desktop.matches) return;
        window.prepareScrollUnfurl(paper);
        stage.removeAttribute('data-scroll-initial-wait');
      });
    }

    if (desktop.matches && reduced.matches) {
      stage.removeAttribute('data-scroll-initial-wait');
    }
    const controls = new AbortController();
    const signal = controls.signal;
    const previousInert = paper.inert;
    const previousGap = spacer.style.getPropertyValue('--newsletter-gap');
    const snapshots = [top, bottom].map(element => ({
      element,
      attributes: ['role', 'tabindex', 'aria-label', 'aria-expanded']
        .map(name => [name, element.getAttribute(name)])
    }));

    let frame = 0;
    let disposed = false;
    let owned = false;
    let closed = false;
    let closing = false;

    function placeNewsletter() {
      if (disposed || stage.dataset.newsletterHold === 'true') return;

      const visual = window.visualViewport;
      const viewportHeight = Math.max(
        window.innerHeight,
        visual ? visual.height + visual.offsetTop : 0
      );

      // Document position, independent of the user's current scroll position.
      const spacerTop =
        spacer.getBoundingClientRect().top + window.scrollY;

      const gap = Math.max(24, viewportHeight + 24 - spacerTop);
      spacer.style.setProperty('--newsletter-gap', gap + 'px');
    }

    let heldGap = 0;
    let holdTimer = 0;

    window.beginNewsletterCloseHold = function () {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      heldGap = spacer.getBoundingClientRect().height;
      stage.dataset.newsletterHold = 'true';
      spacer.style.setProperty('--newsletter-gap', heldGap + 'px');
    };

    window.stepNewsletterCloseHold = function (removedPx, scrolledUpPx) {
      // Only let the page height shrink by the distance the viewport actually moved up.
      // Any un-scrolled shrinkage is absorbed into --newsletter-gap during closing.
      const stationaryShrink = Math.max(0, removedPx - Math.max(0, scrolledUpPx));
      heldGap += stationaryShrink;
      spacer.style.setProperty('--newsletter-gap', heldGap + 'px');
    };

    window.endNewsletterCloseHold = function () {
      window.clearTimeout(holdTimer);
      const delay = window.SCROLL_SNEAK_PEEK_CONFIG?.newsletterCloseDelayMs ?? 420;
      holdTimer = window.setTimeout(() => {
        holdTimer = 0;
        delete stage.dataset.newsletterHold;
        placeNewsletter();
      }, delay);
    };

    function homeIsWaiting() {
      return (
        stage.dataset.desktopClickUnfurl === 'true' &&
        stage.dataset.homeUnfurl !== 'opening'
      );
    }

    function refreshControls() {
      if (!desktop.matches || (!owned && homeIsWaiting())) return;

      top.setAttribute('role', 'button');
      top.setAttribute('tabindex', '0');
      top.setAttribute(
        'aria-label',
        closed || closing ? 'Open the scroll' : 'Close the scroll'
      );
      top.setAttribute('aria-expanded', String(!closed && !closing));

      bottom.setAttribute('role', 'button');
      bottom.setAttribute('tabindex', '0');
      bottom.setAttribute(
        'aria-label',
        closed || closing ? 'Open the scroll' : 'Close the scroll'
      );
      bottom.setAttribute('aria-expanded', String(!closed && !closing));
    }



    const savedStageTranslate = stage.style.translate;

    const savedPaperAnimation = paper.style.animation;



    let repeatMovement = null;

    let repeatHintTimer = 0;

    let repeatEpoch = 0;



    const repeatHint =

      stage.querySelector('.home-click-hint')?.cloneNode(true) ||

      document.createElement('div');



    repeatHint.className = 'home-click-hint';



    if (!repeatHint.innerHTML.trim()) {

      repeatHint.innerHTML =

        '<svg viewBox="0 0 36 40" width="26" height="29" aria-hidden="true">' +

          '<g class="home-click-pointer">' +

            '<path d="M12 11V31L17 26L21 35L25 33L21 24H29Z"/>' +

          '</g>' +

          '<g class="home-click-rays">' +

            '<path d="M12 2V5M4 5L6.5 7.5M2 13H5M20 5L17.5 7.5"/>' +

          '</g>' +

        '</svg><span>Click to unfurl</span>';

    }



    repeatHint.setAttribute('aria-hidden', 'true');

    repeatHint.style.display = 'none';

    repeatHint.style.animation = 'none';

    repeatHint.style.opacity = '1';

    repeatHint.style.transform = 'translateX(-50%)';

    stage.appendChild(repeatHint);



    function hideRepeatHint() {

      window.clearTimeout(repeatHintTimer);

      repeatHintTimer = 0;

      repeatHint.style.display = 'none';

    }



    function showRepeatHintLater() {

      hideRepeatHint();

      repeatHintTimer = window.setTimeout(() => {

        repeatHintTimer = 0;

        if (!disposed && closed && !closing) {

          repeatHint.style.display = 'flex';
          repeatHint.style.animation = 'homeClickHintIn 450ms ease both';

        }

      }, 1000);

    }



    async function moveDesktopPosition(target) {

      if (repeatMovement) repeatMovement.cancel();



      const from = window.getComputedStyle(stage).translate;

      const destination = '0px ' + target + 'px';



      if (!reduced.matches) {

        repeatMovement = window.scrollMovePosition(stage, target, from);



        const current = repeatMovement;

        await current.finished.catch(() => {});



        if (disposed || repeatMovement !== current) return false;



        stage.style.translate = destination;

        current.cancel();

        repeatMovement = null;

      } else {

        stage.style.translate = destination;

      }



      placeNewsletter();

      return true;

    }



    async function animateScroll(shouldClose) {
      window.clearDesktopSneakPeek(stage);

      const epoch = ++repeatEpoch;

      hideRepeatHint();

      window.cancelAnimationFrame(frame);



      if (repeatMovement) {

        // Preserve the visible position before cancelling a movement.

        stage.style.translate = window.getComputedStyle(stage).translate;

        repeatMovement.cancel();

        repeatMovement = null;

      }



      owned = true;



      if (!shouldClose) {
        window.clearTimeout(holdTimer);
        delete stage.dataset.newsletterHold;

        closed = false;

        closing = false;

        refreshControls();



        const completed = await moveDesktopPosition(0);

        if (!completed || disposed || epoch !== repeatEpoch) return;



        /*

         * Release manual height control and replay the original CSS unfurl.

         * The rollers then follow the paper through normal layout.

         */

        stage.dataset.homeUnfurl = 'opening';

        paper.style.animation = 'none';

        delete stage.dataset.wholeScrollControl;

        stage.style.removeProperty('--whole-scroll-height');



        void paper.offsetHeight;



        paper.inert = previousInert;

        window.prepareScrollUnfurl(paper);
        paper.style.animation = 'scrollUnfurlDown var(--unfurl-duration, 8s) ' +

          'var(--unfurl-easing, cubic-bezier(0.33, 1, 0.62, 1)) ' +

          'var(--pause-duration, 0.1s) both';



        refreshControls();

        placeNewsletter();

        return;

      }



      const from = paper.getBoundingClientRect().height;

      stage.style.setProperty('--whole-scroll-height', from + 'px');

      stage.dataset.wholeScrollControl = 'true';



      closing = true;

      closed = false;

      top.focus({ preventScroll: true });

      paper.inert = true;

      refreshControls();



      window.beginNewsletterCloseHold();

      const startedAt = performance.now();

      const duration = reduced.matches ? 0 : 900;

      let previousHeight = from;



      function step(now) {

        if (disposed || epoch !== repeatEpoch) return;



        const progress = duration

          ? Math.min(1, (now - startedAt) / duration)

          : 1;

        const eased = progress * progress * (3 - 2 * progress);

        const nextHeight = from * (1 - eased);



        const documentTop =

          paper.getBoundingClientRect().top + window.scrollY;

        const removed = Math.max(0, previousHeight - nextHeight);

        const targetY = Math.max(

          0,

          window.scrollY -

            Math.min(removed, Math.max(0, window.scrollY - documentTop))

        );



        const prevScrollY = window.scrollY;

        stage.style.setProperty('--whole-scroll-height', nextHeight + 'px');

        previousHeight = nextHeight;

        window.scrollTo({ top: targetY, behavior: 'instant' });

        window.stepNewsletterCloseHold(removed, prevScrollY - window.scrollY);



        if (progress < 1) {

          frame = window.requestAnimationFrame(step);

          return;

        }



        frame = 0;

        closed = true;

        closing = false;

        refreshControls();



        window.scrollTo({ top: 0, behavior: 'instant' });



        const currentTranslate = window.getComputedStyle(stage).translate;

        const offset = currentTranslate === 'none'

          ? 0

          : parseFloat(currentTranslate.split(/\\s+/)[1]) || 0;



        const center =

          (

            top.getBoundingClientRect().top +

            bottom.getBoundingClientRect().bottom

          ) / 2 + window.scrollY - offset;



        const visual = window.visualViewport;

        const screenCenter = visual

          ? visual.offsetTop + visual.height / 2

          : window.innerHeight / 2;



        moveDesktopPosition(Math.max(0, screenCenter - center)).then(ok => {

          if (ok && !disposed && epoch === repeatEpoch && closed) {
            window.endNewsletterCloseHold();
            window.startDesktopSneakPeek(stage, () => !disposed && closed && !closing);
            showRepeatHintLater();

          }

        });

      }



      frame = window.requestAnimationFrame(step);

    }



    function onRoller(event) {
      if (!desktop.matches) return;

      if (
        event.type === 'keydown' &&
        event.key !== 'Enter' &&
        event.key !== ' '
      ) return;

      // Retain the home's existing first-opening interaction.
      if (!owned && homeIsWaiting()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      animateScroll(closed || closing ? false : true);
    }

    for (const roller of [top, bottom]) {
      roller.addEventListener('click', onRoller, {
        capture: true,
        signal
      });
      roller.addEventListener('keydown', onRoller, {
        capture: true,
        signal
      });
    }

    // The existing desktop home controller changes this attribute after
    // its opening movement. Restore top-roller accessibility afterwards.
    const attributes = new MutationObserver(() => {
      refreshControls();
      placeNewsletter();
    });
    attributes.observe(stage, {
      attributes: true,
      attributeFilter: ['data-home-unfurl']
    });

    const sizes = new ResizeObserver(placeNewsletter);
    sizes.observe(stage);

    window.addEventListener('resize', placeNewsletter, {
      passive: true,
      signal
    });
    window.visualViewport?.addEventListener('resize', placeNewsletter, {
      passive: true,
      signal
    });
    document.fonts?.ready.then(() => {
      if (!disposed) placeNewsletter();
    });

    refreshControls();
    placeNewsletter();

    cleanupPage = () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      controls.abort();
      repeatEpoch++;
      hideRepeatHint();
      if (repeatMovement) repeatMovement.cancel();
      repeatHint.remove();
      stage.style.translate = savedStageTranslate;
      paper.style.animation = savedPaperAnimation;
      sizes.disconnect();
      attributes.disconnect();

      if (owned) {
        delete stage.dataset.wholeScrollControl;
        stage.style.removeProperty('--whole-scroll-height');
        paper.inert = previousInert;
      }

      if (previousGap) {
        spacer.style.setProperty('--newsletter-gap', previousGap);
      } else {
        spacer.style.removeProperty('--newsletter-gap');
      }

      snapshots.forEach(({ element, attributes }) => {
        attributes.forEach(([name, value]) => {
          if (value === null) element.removeAttribute(name);
          else element.setAttribute(name, value);
        });
      });
    };
  }

  desktop.addEventListener('change', initialize, {
    signal: lifetime.signal
  });
  document.addEventListener('astro:page-load', initialize, {
    signal: lifetime.signal
  });
  document.addEventListener('astro:before-swap', () => cleanupPage(), {
    signal: lifetime.signal
  });

  window[key] = () => {
    lifetime.abort();
    cleanupPage();
  };

  initialize();
})();
    </script>
    <!-- STEP13_MAILERLITE_SCRIPT_START -->
    <script is:inline>
      (function () {
        const form = document.getElementById('global-newsletter-form');
        const box = document.getElementById('global-newsletter-box');
        const msgEl = document.getElementById('global-newsletter-msg');

        if (!form || !box || !msgEl) return;

        form.addEventListener('submit', async function (event) {
          event.preventDefault();

          const honeypot = form.querySelector('input[name="confirm_email_honeypot"]');
          if (honeypot && honeypot.value) {
            return;
          }

          const emailInput = form.querySelector('input[name="fields[email]"]');
          const email = emailInput ? emailInput.value.trim() : '';

          if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
            msgEl.hidden = false;
            msgEl.className = 'newsletter-response-msg is-error';
            msgEl.textContent = 'Please enter a valid email address.';
            return;
          }

          const formActionUrl = (box.getAttribute('data-form-action') || '').trim();
          const submitBtn = form.querySelector('.newsletter-submit-btn');
          if (submitBtn) submitBtn.disabled = true;

          const isConfigured =
            formActionUrl &&
            !formActionUrl.includes('YOUR_ACCOUNT_ID') &&
            !formActionUrl.includes('YOUR_FORM_ID') &&
            formActionUrl !== '#';

          if (isConfigured) {
            try {
              const formData = new FormData(form);
              await fetch(formActionUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors',
              });
              form.reset();
              msgEl.hidden = false;
              msgEl.className = 'newsletter-response-msg is-success';
              msgEl.textContent =
                '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm.';
            } catch (_err) {
              msgEl.hidden = false;
              msgEl.className = 'newsletter-response-msg is-error';
              msgEl.textContent =
                'Unable to reach the dispatch ledger right now. Please try again shortly.';
            } finally {
              if (submitBtn) submitBtn.disabled = false;
            }
          } else {
            form.reset();
            if (submitBtn) submitBtn.disabled = false;
            msgEl.hidden = false;
            msgEl.className = 'newsletter-response-msg is-success';
            msgEl.textContent =
              '印 Thank you. Your address has been inscribed in the dispatch ledger. Please check your inbox to confirm. (Local Preview Mode: To enable live subscriptions, paste your MailerLite Form Action URL into "mailerlite.formActionUrl" inside src/data/siteConfig.json.)';
          }
        });
      })();
    </script>
    <!-- STEP13_MAILERLITE_SCRIPT_END -->
  </body>
</html>
`;

writeFileSafe('src/layouts/BaseLayout.astro', updatedBaseLayoutAstro);

// ============================================================================
// 9. APPEND LANGUAGE SWITCHER & FALLBACK BANNER STYLES TO src/styles/global.css
// ============================================================================
const globalCssPath = path.join(ROOT, 'src/styles/global.css');
const i18nCssMarker = '/* STEP20_I18N_LANG_SWITCHER_START */';
const i18nCssBlock = `
${i18nCssMarker}
.lang-switcher {
  position: relative;
  margin-left: 0.25rem;
}

.lang-switcher-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.68rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  border: 1px solid rgba(230, 223, 207, 0.24);
  border-radius: 4px;
  background: rgba(24, 18, 14, 0.55);
}

.lang-switcher-toggle:hover,
.lang-switcher.open .lang-switcher-toggle {
  border-color: rgba(201, 162, 89, 0.65);
  background: rgba(42, 30, 22, 0.85);
}

.lang-flag {
  font-size: 0.95rem;
  line-height: 1;
}

.lang-dropdown-menu {
  right: 0;
  left: auto;
  min-width: 165px;
}

.lang-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  font-size: 0.85rem;
}

.lang-item-flag {
  font-size: 1rem;
}

.lang-item-name {
  flex: 1;
  text-align: left;
}

.lang-item-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  opacity: 0.7;
}

.i18n-fallback-banner {
  margin: 0 auto 1.75rem auto;
  padding: 0.85rem 1.15rem;
  border-left: 3px solid #6E2B25;
  background: rgba(110, 43, 37, 0.08);
  color: #3B2A22;
  font-size: 0.92rem;
  line-height: 1.5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 0 4px 4px 0;
}

.i18n-fallback-banner a {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: #6E2B25;
  text-decoration: underline;
  white-space: nowrap;
}
/* STEP20_I18N_LANG_SWITCHER_END */
`;

if (fs.existsSync(globalCssPath)) {
  const currentCss = fs.readFileSync(globalCssPath, 'utf8');
  if (!currentCss.includes(i18nCssMarker)) {
    fs.writeFileSync(globalCssPath, currentCss.trimEnd() + '\n' + i18nCssBlock, 'utf8');
    console.log('✓ Appended .lang-switcher & .i18n-fallback-banner styles to src/styles/global.css');
  }
} else {
  writeFileSafe('src/styles/global.css', i18nCssBlock);
}

// ============================================================================
// 10. CREATE LOCALIZED ROUTE PAGES SO /pt/*, /es/*, /ja/* WORK SEAMLESSLY
// ============================================================================
// Ensure root essay queries ignore localized subfolders (e.g., !entry.id.includes('/'))
const rootEssaysIndexPath = path.join(ROOT, 'src/pages/essays/index.astro');
if (fs.existsSync(rootEssaysIndexPath)) {
  let content = fs.readFileSync(rootEssaysIndexPath, 'utf8');
  if (content.includes("getCollection('essays'") && !content.includes("id.includes('/')")) {
    content = content.replace(
      /getCollection\(\s*['"]essays['"]\s*,\s*\(\{\s*data\s*\}\)\s*=>\s*!data\.draft\s*\)/g,
      "getCollection('essays', ({ id, data }) => !id.includes('/') && !data.draft)"
    );
    fs.writeFileSync(rootEssaysIndexPath, content, 'utf8');
    console.log('✓ Filtered localized subfolders out of root src/pages/essays/index.astro');
  }
}

const rootEssaysSlugPath = path.join(ROOT, 'src/pages/essays/[...slug].astro');
if (fs.existsSync(rootEssaysSlugPath)) {
  let content = fs.readFileSync(rootEssaysSlugPath, 'utf8');
  if (content.includes("getCollection('essays'") && !content.includes("id.includes('/')")) {
    content = content.replace(
      /getCollection\(\s*['"]essays['"]\s*\)/g,
      "getCollection('essays', ({ id }) => !id.includes('/'))"
    );
    content = content.replace(
      /getCollection\(\s*['"]essays['"]\s*,\s*\(\{\s*data\s*\}\)\s*=>\s*!data\.draft\s*\)/g,
      "getCollection('essays', ({ id, data }) => !id.includes('/') && !data.draft)"
    );
    fs.writeFileSync(rootEssaysSlugPath, content, 'utf8');
    console.log('✓ Filtered localized subfolders out of root src/pages/essays/[...slug].astro');
  }
}

// Create Localized Essays Dynamic Route: src/pages/[lang]/essays/[...slug].astro
const localizedEssaySlugAstro = `---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { getEnabledLocales, getUiStrings, localizeHref } from '../../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  const allEssays = await getCollection('essays', ({ data }) => !data.draft);
  const englishEssays = allEssays.filter((e) => !e.id.includes('/'));

  const paths = [];

  for (const loc of locales) {
    for (const enEssay of englishEssays) {
      const baseSlug = enEssay.slug;
      const localizedEntry = allEssays.find(
        (e) => e.id === \`\${loc.code}/\${enEssay.id}\` || e.slug === \`\${loc.code}/\${baseSlug}\`
      );

      paths.push({
        params: { lang: loc.code, slug: baseSlug },
        props: {
          lang: loc.code,
          entry: localizedEntry || enEssay,
          isFallback: !localizedEntry,
          originalSlug: baseSlug,
        },
      });
    }
  }

  return paths;
}

const { lang, entry, isFallback, originalSlug } = Astro.props;
const { Content } = await entry.render();
const ui = getUiStrings(lang);
const formattedDate = entry.data.date.toLocaleDateString(lang, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
---

<BaseLayout title={entry.data.title} description={entry.data.excerpt}>
  <article class="essay-article max-w-3xl mx-auto px-4 py-8">
    <div class="mb-6">
      <a href={localizeHref('/essays', lang)} class="text-sm font-mono text-[#6E2B25] hover:underline">
        {ui.essays.backToArchive}
      </a>
    </div>

    {isFallback && (
      <div class="i18n-fallback-banner" role="note">
        <span>{ui.banners.untranslatedNotice}</span>
        <a href={\`/essays/\${originalSlug}\`}>{ui.banners.backToEnglish} →</a>
      </div>
    )}

    <header class="mb-8 border-b border-[#3B2A22]/20 pb-6">
      <div class="text-xs font-mono uppercase tracking-widest text-[#6E2B25] mb-2">
        {formattedDate} • {entry.data.location}
        {entry.data.kilometersWalked !== undefined && \` • \${entry.data.kilometersWalked} km\`}
      </div>
      <h1 class="text-3xl md:text-4xl font-bold text-[#231812] mb-2">{entry.data.title}</h1>
      {entry.data.subtitle && (
        <p class="text-lg italic text-[#4A372C]">{entry.data.subtitle}</p>
      )}
    </header>

    <div class="prose prose-stone max-w-none">
      <Content />
    </div>
  </article>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/essays/[...slug].astro', localizedEssaySlugAstro);

// Create Localized Essays Index Route: src/pages/[lang]/essays/index.astro
const localizedEssaysIndexAstro = `---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { getEnabledLocales, getUiStrings, localizeHref } from '../../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  return locales.map((loc) => ({
    params: { lang: loc.code },
    props: { lang: loc.code },
  }));
}

const { lang } = Astro.props;
const ui = getUiStrings(lang);

const allEssays = await getCollection('essays', ({ data }) => !data.draft);
const englishEssays = allEssays
  .filter((e) => !e.id.includes('/'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

const displayEssays = englishEssays.map((enEntry) => {
  const locEntry = allEssays.find(
    (e) => e.id === \`\${lang}/\${enEntry.id}\` || e.slug === \`\${lang}/\${enEntry.slug}\`
  );
  return {
    baseSlug: enEntry.slug,
    entry: locEntry || enEntry,
    isFallback: !locEntry,
  };
});
---

<BaseLayout title={ui.essays.pageTitle} description={ui.essays.pageSubtitle}>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <header class="mb-10 border-b border-[#3B2A22]/20 pb-6 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-[#231812] mb-2">{ui.essays.pageTitle}</h1>
      <p class="text-base italic text-[#4A372C]">{ui.essays.pageSubtitle}</p>
    </header>

    <div class="space-y-8">
      {displayEssays.map(({ baseSlug, entry, isFallback }) => (
        <article class="border-b border-[#3B2A22]/15 pb-6">
          <div class="text-xs font-mono uppercase tracking-wider text-[#6E2B25] mb-1">
            {entry.data.date.toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' })}
            {' • '}
            {entry.data.location}
            {entry.data.kilometersWalked !== undefined && \` • \${entry.data.kilometersWalked} km\`}
            {isFallback && ' • [EN]'}
          </div>
          <h2 class="text-2xl font-semibold text-[#231812] mb-2">
            <a href={localizeHref(\`/essays/\${baseSlug}\`, lang)} class="hover:text-[#6E2B25]">
              {entry.data.title}
            </a>
          </h2>
          <p class="text-[#3B2A22]/90 mb-3">{entry.data.excerpt}</p>
          <a
            href={localizeHref(\`/essays/\${baseSlug}\`, lang)}
            class="text-xs font-mono uppercase tracking-wider text-[#6E2B25] hover:underline"
          >
            {ui.home.readDispatchBtn}
          </a>
        </article>
      ))}
    </div>
  </section>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/essays/index.astro', localizedEssaysIndexAstro);

// Create Localized Home & Core Pages: src/pages/[lang]/index.astro, faq.astro, credits.astro, inventory.astro, finances.astro, map.astro, gallery.astro, forum.astro, donate.astro
const localizedHomeAstro = `---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import siteConfig from '../../data/siteConfig.json';
import { getEnabledLocales, getUiStrings, localizeHref } from '../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  return locales.map((loc) => ({
    params: { lang: loc.code },
    props: { lang: loc.code },
  }));
}

const { lang } = Astro.props;
const ui = getUiStrings(lang);

const allEssays = await getCollection('essays', ({ data }) => !data.draft);
const englishEssays = allEssays
  .filter((e) => !e.id.includes('/'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 3);

const recentDispatches = englishEssays.map((enEntry) => {
  const locEntry = allEssays.find(
    (e) => e.id === \`\${lang}/\${enEntry.id}\` || e.slug === \`\${lang}/\${enEntry.slug}\`
  );
  return {
    baseSlug: enEntry.slug,
    entry: locEntry || enEntry,
  };
});
---

<BaseLayout startClosed={true}>
  <section class="max-w-3xl mx-auto px-4 py-8 text-center">
    <div class="text-xs font-mono uppercase tracking-widest text-[#6E2B25] mb-2">
      {ui.home.eyebrow}
    </div>
    <h1 class="text-4xl md:text-5xl font-bold text-[#231812] mb-3">
      {siteConfig.siteTitleJp} • {siteConfig.siteTitleEn}
    </h1>
    <p class="text-lg italic text-[#4A372C] mb-6">{ui.home.heroSubtitle}</p>

    <div class="inline-block border border-[#3B2A22]/25 px-4 py-2 rounded text-xs font-mono text-[#3B2A22] mb-10">
      {ui.home.currentLocationLabel}: <strong>{siteConfig.currentLocation}</strong>
    </div>

    <div class="text-left border-t border-[#3B2A22]/20 pt-8">
      <h2 class="text-2xl font-bold text-[#231812] mb-6">{ui.home.latestDispatchesHeading}</h2>
      <div class="space-y-6">
        {recentDispatches.map(({ baseSlug, entry }) => (
          <article class="border-b border-[#3B2A22]/15 pb-5">
            <div class="text-xs font-mono text-[#6E2B25] mb-1">
              {entry.data.date.toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' })}
              {' • '}
              {entry.data.location}
            </div>
            <h3 class="text-xl font-semibold text-[#231812] mb-1">
              <a href={localizeHref(\`/essays/\${baseSlug}\`, lang)} class="hover:text-[#6E2B25]">
                {entry.data.title}
              </a>
            </h3>
            <p class="text-sm text-[#3B2A22]/90 mb-2">{entry.data.excerpt}</p>
            <a
              href={localizeHref(\`/essays/\${baseSlug}\`, lang)}
              class="text-xs font-mono text-[#6E2B25] hover:underline"
            >
              {ui.home.readDispatchBtn}
            </a>
          </article>
        ))}
      </div>

      <div class="mt-8 text-center">
        <a
          href={localizeHref('/essays', lang)}
          class="inline-block px-5 py-2.5 border border-[#6E2B25] text-[#6E2B25] font-mono text-xs uppercase tracking-wider hover:bg-[#6E2B25] hover:text-[#E6DFCF] transition"
        >
          {ui.home.viewAllEssaysBtn}
        </a>
      </div>
    </div>
  </section>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/index.astro', localizedHomeAstro);

const localizedFaqAstro = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEnabledLocales, getUiStrings, getLocalizedDataFile } from '../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  return locales.map((loc) => ({
    params: { lang: loc.code },
    props: { lang: loc.code },
  }));
}

const { lang } = Astro.props;
const ui = getUiStrings(lang);
const faqData = getLocalizedDataFile<{ categories?: Array<{ categoryName: string; items: Array<{ question: string; answer: string }> }> }>('faq.json', lang);
const categories = Array.isArray(faqData?.categories) ? faqData.categories : [];
---

<BaseLayout title={ui.faq.pageTitle} description={ui.faq.pageSubtitle}>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <header class="mb-10 border-b border-[#3B2A22]/20 pb-6 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-[#231812] mb-2">{ui.faq.pageTitle}</h1>
      <p class="text-base italic text-[#4A372C]">{ui.faq.pageSubtitle}</p>
    </header>

    <div class="space-y-8">
      {categories.map((cat) => (
        <div>
          <h2 class="text-xl font-bold text-[#6E2B25] mb-4 border-b border-[#6E2B25]/20 pb-2">
            {cat.categoryName}
          </h2>
          <div class="space-y-4">
            {(cat.items || []).map((item) => (
              <div class="border-b border-[#3B2A22]/10 pb-4">
                <h3 class="text-lg font-semibold text-[#231812] mb-1">{item.question}</h3>
                <p class="text-[#3B2A22]/90 whitespace-pre-line">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/faq.astro', localizedFaqAstro);

const localizedCreditsAstro = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEnabledLocales, getUiStrings, getLocalizedDataFile } from '../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  return locales.map((loc) => ({
    params: { lang: loc.code },
    props: { lang: loc.code },
  }));
}

const { lang } = Astro.props;
const ui = getUiStrings(lang);
const creditsData = getLocalizedDataFile<{ sections?: Array<{ title: string; entries: Array<{ name: string; locationOrRole: string; note: string }> }> }>('credits.json', lang);
const sections = Array.isArray(creditsData?.sections) ? creditsData.sections : [];
---

<BaseLayout title={ui.credits.pageTitle} description={ui.credits.pageSubtitle}>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <header class="mb-10 border-b border-[#3B2A22]/20 pb-6 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-[#231812] mb-2">{ui.credits.pageTitle}</h1>
      <p class="text-base italic text-[#4A372C]">{ui.credits.pageSubtitle}</p>
    </header>

    <div class="space-y-8">
      {sections.map((sec) => (
        <div>
          <h2 class="text-xl font-bold text-[#6E2B25] mb-4 border-b border-[#6E2B25]/20 pb-2">
            {sec.title}
          </h2>
          <div class="grid gap-4">
            {(sec.entries || []).map((entry) => (
              <div class="p-4 border border-[#3B2A22]/15 rounded bg-[#F5EFE2]/40">
                <div class="flex flex-wrap justify-between items-baseline gap-2 mb-1">
                  <strong class="text-lg text-[#231812]">{entry.name}</strong>
                  <span class="text-xs font-mono text-[#6E2B25]">{entry.locationOrRole}</span>
                </div>
                <p class="text-sm text-[#3B2A22]/90">{entry.note}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/credits.astro', localizedCreditsAstro);

const localizedInventoryAstro = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEnabledLocales, getUiStrings, getLocalizedDataFile } from '../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  return locales.map((loc) => ({
    params: { lang: loc.code },
    props: { lang: loc.code },
  }));
}

const { lang } = Astro.props;
const ui = getUiStrings(lang);
const invData = getLocalizedDataFile<{ items?: Array<any> }>('inventory.json', lang);
const items = Array.isArray(invData?.items) ? invData.items : [];
---

<BaseLayout title={ui.inventory.pageTitle} description={ui.inventory.pageSubtitle}>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <header class="mb-10 border-b border-[#3B2A22]/20 pb-6 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-[#231812] mb-2">{ui.inventory.pageTitle}</h1>
      <p class="text-base italic text-[#4A372C]">{ui.inventory.pageSubtitle}</p>
    </header>

    <div class="grid gap-4">
      {items.map((item) => (
        <div class="p-4 border border-[#3B2A22]/20 rounded bg-[#F5EFE2]/50">
          <div class="flex flex-wrap justify-between items-baseline gap-2 mb-1">
            <h2 class="text-lg font-bold text-[#231812]">
              {item.name} {item.japaneseName && <span class="text-sm font-normal text-[#6E2B25]">({item.japaneseName})</span>}
            </h2>
            <span class="text-xs font-mono text-[#4A372C]">
              {item.slot} • {item.weightGrams}g • {item.condition}
            </span>
          </div>
          <p class="text-sm font-semibold text-[#3B2A22] mb-1">{item.shortSummary}</p>
          {item.lore && <p class="text-sm italic text-[#4A372C]">{item.lore}</p>}
        </div>
      ))}
    </div>
  </section>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/inventory.astro', localizedInventoryAstro);

const localizedFinancesAstro = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEnabledLocales, getUiStrings, getLocalizedDataFile } from '../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  return locales.map((loc) => ({
    params: { lang: loc.code },
    props: { lang: loc.code },
  }));
}

const { lang } = Astro.props;
const ui = getUiStrings(lang);
const finData = getLocalizedDataFile<any>('finances.json', lang);
const entries = Array.isArray(finData?.entries) ? finData.entries : [];
const currency = finData?.currencySymbol || '€';
---

<BaseLayout title={ui.finances.pageTitle} description={ui.finances.pageSubtitle}>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <header class="mb-8 border-b border-[#3B2A22]/20 pb-6 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-[#231812] mb-2">{ui.finances.pageTitle}</h1>
      <p class="text-base italic text-[#4A372C]">{finData?.note || ui.finances.pageSubtitle}</p>
    </header>

    <div class="space-y-3">
      {entries.map((entry: any) => (
        <div class="flex justify-between items-center p-3 border-b border-[#3B2A22]/15 text-sm">
          <div>
            <div class="font-semibold text-[#231812]">{entry.description}</div>
            <div class="text-xs font-mono text-[#6E2B25]">
              {entry.date} • {entry.category} {entry.location ? \`• \${entry.location}\` : ''}
            </div>
          </div>
          <div class="font-mono font-bold text-[#231812]">
            {entry.type === 'osettai' ? '+' : '-'}{currency}{entry.amount}
          </div>
        </div>
      ))}
    </div>
  </section>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/finances.astro', localizedFinancesAstro);

const localizedMapAstro = `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getEnabledLocales, getUiStrings, getLocalizedDataFile, localizeHref } from '../../utils/i18n';

export async function getStaticPaths() {
  const locales = getEnabledLocales().filter((l) => l.code !== 'en');
  return locales.map((loc) => ({
    params: { lang: loc.code },
    props: { lang: loc.code },
  }));
}

const { lang } = Astro.props;
const ui = getUiStrings(lang);
const routeData = getLocalizedDataFile<any>('route.json', lang);
const checkpoints = Array.isArray(routeData?.checkpoints) ? routeData.checkpoints : [];
---

<BaseLayout title={ui.map.pageTitle} description={ui.map.pageSubtitle}>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <header class="mb-8 border-b border-[#3B2A22]/20 pb-6 text-center">
      <h1 class="text-3xl md:text-4xl font-bold text-[#231812] mb-2">{ui.map.pageTitle}</h1>
      <p class="text-base italic text-[#4A372C]">{ui.map.pageSubtitle}</p>
    </header>

    <div class="space-y-4">
      {checkpoints.map((cp: any) => (
        <div class="p-4 border border-[#3B2A22]/20 rounded bg-[#F5EFE2]/40">
          <div class="flex justify-between items-baseline mb-1">
            <h2 class="text-lg font-bold text-[#231812]">{cp.title}</h2>
            <span class="text-xs font-mono text-[#6E2B25]">{cp.date} • {cp.kmMarker} km</span>
          </div>
          <p class="text-sm text-[#3B2A22] mb-2">{cp.summary}</p>
          {cp.essaySlug && (
            <a href={localizeHref(\`/essays/\${cp.essaySlug}\`, lang)} class="text-xs font-mono text-[#6E2B25] underline">
              {ui.home.readDispatchBtn}
            </a>
          )}
        </div>
      ))}
    </div>
  </section>
</BaseLayout>
`;

writeFileSafe('src/pages/[lang]/map.astro', localizedMapAstro);

// ============================================================================
// 11. UPDATE .pages.yml WITH TRIAGE SELECTOR, CLOUD TRIGGER & LOCALIZED VIEWS
// ============================================================================
const updatedPagesYml = `# Preserve settings not represented in a CMS form when saving.
settings:
  content:
    merge: true

media:
  name: assets
  label: Site & Essay Media
  input: public/assets
  output: /assets

content:
  - name: essays
    label: Essays & Dispatches (English Master)
    type: collection
    path: src/content/essays
    exclude: ["pt/**", "es/**", "ja/**"]
    filename: "{year}-{month}-{day}-{primary}.md"
    view:
      primary: title
      fields: [title, translationControl, location, date, draft]
      sort: [date]
      order: desc
    fields:
      - name: translationControl
        label: Translation Status / Queue
        type: select
        default: auto
        options:
          values:
            - { value: "auto", label: "Auto (Translate if brand new)" }
            - { value: "queue", label: "📥 Queue for Translation (Translate on next run)" }
            - { value: "ignore", label: "🚫 Ignore Changes (Do not translate)" }
      - name: title
        label: Essay Title
        type: string
        required: true
      - name: subtitle
        label: Subtitle
        type: string
      - name: date
        label: Date
        type: date
        required: true
      - name: location
        label: Current Trail Location
        type: string
        required: true
      - name: kilometersWalked
        label: Total Kilometers Walked
        type: number
      - name: readingTime
        label: Reading Time (e.g. 5 min read)
        type: string
      - name: excerpt
        label: Short Summary / Excerpt
        type: text
        required: true
      - name: draft
        label: Draft (Hide from live site)
        type: boolean
        default: false
      - name: body
        label: Essay Text (Markdown)
        type: rich-text

  - name: translationsAndLanguages
    label: "🌐 Translations & Languages"
    type: file
    path: src/data/siteConfig.json
    format: json
    fields:
      - name: i18n
        label: AI Translation Engine & Active Languages
        type: object
        fields:
          - name: triggerCloudTranslation
            label: "🚀 Translate Queued Pages Now (Flip ON & Save)"
            description: "Turn this switch ON and click Save to trigger GitHub Actions to translate all brand-new or queued content. It automatically resets to OFF when complete."
            type: boolean
            default: false
          - name: defaultLocale
            label: Default Language Code
            type: string
            default: "en"
          - name: locales
            label: Configured Languages
            type: object
            list: true
            fields:
              - name: code
                label: Locale Code (en, pt, es, ja)
                type: string
              - name: label
                label: Short Header Badge (EN, PT, ES, JP)
                type: string
              - name: name
                label: Language Display Name
                type: string
              - name: flag
                label: Flag Emoji
                type: string
              - name: enabled
                label: Enable Language in Header & Translator
                type: boolean
                default: true

  - name: essaysPt
    label: "🇵🇹 Translated Essays (Português)"
    type: collection
    path: src/content/essays/pt
    filename: "{year}-{month}-{day}-{primary}.md"
    view:
      primary: title
      fields: [title, location, date, draft]
      sort: [date]
      order: desc
    fields:
      - name: title
        label: Essay Title (PT)
        type: string
        required: true
      - name: subtitle
        label: Subtitle (PT)
        type: string
      - name: date
        label: Date
        type: date
        required: true
      - name: location
        label: Current Trail Location (PT)
        type: string
        required: true
      - name: kilometersWalked
        label: Total Kilometers Walked
        type: number
      - name: readingTime
        label: Reading Time (PT)
        type: string
      - name: excerpt
        label: Short Summary / Excerpt (PT)
        type: text
        required: true
      - name: draft
        label: Draft
        type: boolean
        default: false
      - name: body
        label: Essay Text (Markdown - PT)
        type: rich-text

  - name: essaysEs
    label: "🇪🇸 Translated Essays (Español)"
    type: collection
    path: src/content/essays/es
    filename: "{year}-{month}-{day}-{primary}.md"
    view:
      primary: title
      fields: [title, location, date, draft]
      sort: [date]
      order: desc
    fields:
      - name: title
        label: Essay Title (ES)
        type: string
        required: true
      - name: subtitle
        label: Subtitle (ES)
        type: string
      - name: date
        label: Date
        type: date
        required: true
      - name: location
        label: Current Trail Location (ES)
        type: string
        required: true
      - name: kilometersWalked
        label: Total Kilometers Walked
        type: number
      - name: readingTime
        label: Reading Time (ES)
        type: string
      - name: excerpt
        label: Short Summary / Excerpt (ES)
        type: text
        required: true
      - name: draft
        label: Draft
        type: boolean
        default: false
      - name: body
        label: Essay Text (Markdown - ES)
        type: rich-text

  - name: essaysJa
    label: "🇯🇵 Translated Essays (日本語)"
    type: collection
    path: src/content/essays/ja
    filename: "{year}-{month}-{day}-{primary}.md"
    view:
      primary: title
      fields: [title, location, date, draft]
      sort: [date]
      order: desc
    fields:
      - name: title
        label: Essay Title (JA)
        type: string
        required: true
      - name: subtitle
        label: Subtitle (JA)
        type: string
      - name: date
        label: Date
        type: date
        required: true
      - name: location
        label: Current Trail Location (JA)
        type: string
        required: true
      - name: kilometersWalked
        label: Total Kilometers Walked
        type: number
      - name: readingTime
        label: Reading Time (JA)
        type: string
      - name: excerpt
        label: Short Summary / Excerpt (JA)
        type: text
        required: true
      - name: draft
        label: Draft
        type: boolean
        default: false
      - name: body
        label: Essay Text (Markdown - JA)
        type: rich-text

  - name: finances
    label: Finances Ledger
    type: file
    path: src/data/finances.json
    format: json
    fields:
      - name: currencySymbol
        label: Currency Symbol
        type: string
        default: "€"
      - name: startingReserve
        label: Starting Reserve Amount
        type: number
      - name: lastUpdated
        label: Last Updated Date
        type: string
      - name: note
        label: Ledger Header Note
        type: text
      - name: entries
        label: Ledger Entries (Osettai & Expenses)
        type: object
        list: true
        fields:
          - name: id
            label: Entry ID
            type: string
          - name: date
            label: Date (YYYY-MM-DD)
            type: string
          - name: type
            label: Entry Type
            type: select
            options:
              values:
                - { label: "Osettai (Contribution)", value: "osettai" }
                - { label: "Expense", value: "expense" }
          - name: category
            label: Category
            type: string
          - name: description
            label: Description
            type: string
          - name: location
            label: Location
            type: string
          - name: amount
            label: Amount
            type: number

  - name: inventory
    label: RPG Gear Inventory (Edition 2)
    type: file
    path: src/data/inventory.json
    format: json
    fields:
      - name: items
        label: Gear Items
        type: object
        list: true
        fields:
          - name: id
            label: Item ID
            type: string
          - name: name
            label: Item Name
            type: string
          - name: japaneseName
            label: Japanese Name / Subtitle
            type: string
          - name: slot
            label: Equipment Slot
            type: select
            options:
              values: ["Equipped", "Main Pack", "Shelter & Sleep", "Electronics & Writing", "Consumables"]
          - name: weightGrams
            label: Weight (Grams)
            type: number
          - name: condition
            label: Condition
            type: select
            options:
              values: ["Pristine", "Seasoned", "Worn", "Need Replacement"]
          - name: shortSummary
            label: Short Summary
            type: string
          - name: lore
            label: Philosophical / Field Lore
            type: text

  - name: route
    label: Trail Map Checkpoints (Edition 2)
    type: file
    path: src/data/route.json
    format: json
    fields:
      - name: stats
        label: Overall Trail Statistics
        type: object
        fields:
          - name: totalPlannedKm
            label: Total Planned Kilometers
            type: number
          - name: completedKm
            label: Completed Kilometers
            type: number
          - name: daysOnTrail
            label: Days on Trail
            type: number
          - name: countriesCrossed
            label: Countries Crossed
            type: number
      - name: checkpoints
        label: Walked Checkpoints
        type: object
        list: true
        fields:
          - name: id
            label: Checkpoint ID
            type: string
          - name: title
            label: Town / Stage Name
            type: string
          - name: date
            label: Date Reached
            type: string
          - name: lat
            label: Latitude
            type: number
          - name: lng
            label: Longitude
            type: number
          - name: kmMarker
            label: Kilometer Marker
            type: number
          - name: summary
            label: Stage Note
            type: text
          - name: essaySlug
            label: Linked Essay Slug (Optional)
            type: string

  - name: faq
    label: FAQ Items
    type: file
    path: src/data/faq.json
    format: json
    fields:
      - name: categories
        label: FAQ Categories
        type: object
        list: true
        fields:
          - name: categoryName
            label: Category Name
            type: string
          - name: items
            label: Questions & Answers
            type: object
            list: true
            fields:
              - name: question
                label: Question
                type: string
              - name: answer
                label: Answer
                type: text

  - name: credits
    label: Credits & Gratitude
    type: file
    path: src/data/credits.json
    format: json
    fields:
      - name: sections
        label: Gratitude Sections
        type: object
        list: true
        fields:
          - name: title
            label: Section Title
            type: string
          - name: entries
            label: Supporters / Hosts
            type: object
            list: true
            fields:
              - name: name
                label: Name or Alias
                type: string
              - name: locationOrRole
                label: Location or Role
                type: string
              - name: note
                label: Gratitude Note
                type: string

  - name: siteConfig
    label: Site Settings & Edition 2 Toggles
    type: file
    path: src/data/siteConfig.json
    format: json
    fields:
      - name: siteTitleJp
        label: Website Title (Japanese)
        type: string
      - name: siteTitleEn
        label: Website Title (English)
        type: string
      - name: tagline
        label: Website Tagline
        type: text
      - name: crestImage
        label: Crest Image
        type: image
      - name: routeSummary
        label: Route Summary
        type: string
      - name: supabase
        label: Forum Supabase Settings
        type: object
        fields:
          - name: url
            label: Supabase Project URL
            type: string
          - name: anonKey
            label: Supabase Public Anonymous Key
            description: Use only the public anon key, never a service role or secret key.
            type: string
      - name: currentLocation
        label: Current Trail Location Banner
        type: string
      - name: stripeDonationUrl
        label: Stripe Osettai Payment Link
        type: string
      - name: features
        label: Edition 2 Module Toggles
        type: object
        fields:
          - name: enableInventory
            label: Show Inventory Page
            type: boolean
          - name: enableMap
            label: Show Map Page
            type: boolean
          - name: enableForum
            label: Show Forum Page
            type: boolean
          - name: enableGallery
            label: Show Gallery Page
            type: boolean
`;

writeFileSafe('.pages.yml', updatedPagesYml);

// ============================================================================
// 12. CREATE GITHUB ACTIONS WORKFLOW (.github/workflows/translate.yml)
// ============================================================================
const githubWorkflowYml = `name: AI Incremental Site Translator

on:
  workflow_dispatch:
  push:
    branches:
      - main
      - master
    paths:
      - 'src/data/siteConfig.json'

permissions:
  contents: write

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check Translation Trigger State
        id: check_trigger
        run: |
          if [ "\${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "should_run=true" >> $GITHUB_OUTPUT
            echo "Triggered manually via workflow_dispatch."
          else
            TRIGGER=$(node -e "const c = require('./src/data/siteConfig.json'); console.log(Boolean(c.i18n && c.i18n.triggerCloudTranslation));")
            echo "should_run=$TRIGGER" >> $GITHUB_OUTPUT
            echo "triggerCloudTranslation in siteConfig.json is: $TRIGGER"
          fi

      - name: Setup Node.js
        if: steps.check_trigger.outputs.should_run == 'true'
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run Incremental AI Translator
        if: steps.check_trigger.outputs.should_run == 'true'
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
        run: node scripts/translate-site.mjs

      - name: Commit & Push Translations and Reset Toggle
        if: steps.check_trigger.outputs.should_run == 'true'
        run: |
          git config user.name "camino-henro-translator[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add src/content/essays src/data .pages.yml
          if git diff --cached --quiet; then
            echo "No translation changes to commit."
          else
            git commit -m "chore(i18n): incremental AI translation sync [skip ci]"
            git push
          fi
`;

writeFileSafe('.github/workflows/translate.yml', githubWorkflowYml);

console.log('\n================================================================');
console.log(' ✅ STEP 20 INSTALLATION COMPLETE!');
console.log('================================================================');
console.log('• Run locally anytime with: npm run translate');
console.log('• Or trigger from your phone in Pages CMS -> "🌐 Translations & Languages"');