import fs from 'node:fs';
import path from 'node:path';

// 1. Update src/data/siteConfig.json to set features.enableForum = true
const siteConfigPath = path.resolve(process.cwd(), 'src/data/siteConfig.json');
let siteConfig = {
  siteTitleJp: 'カミノ遍路',
  siteTitleEn: 'CAMINO HENRO',
  tagline: 'From the End of the Earth to the Land of the Rising Sun',
  pilgrimAlias: 'Henro',
  routeSummary: 'Finisterra, Spain → Shikoku, Japan',
  currentLocation: 'Finisterra, Galicia, Spain',
  crestImage: '/assets/crest.svg',
  backgroundImage: '/assets/apple-bg.svg',
  stripeDonationUrl: 'https://buy.stripe.com/test_placeholder',
  giscus: {
    repo: 'YOUR_GITHUB_USERNAME/camino-henro',
    repoId: '',
    category: 'General',
    categoryId: '',
  },
  features: {
    enableInventory: false,
    enableMap: false,
    enableForum: true,
  },
};

if (fs.existsSync(siteConfigPath)) {
  try {
    const existingRaw = fs.readFileSync(siteConfigPath, 'utf8');
    const parsed = JSON.parse(existingRaw);
    siteConfig = {
      ...parsed,
      features: {
        ...(parsed.features || {}),
        enableForum: true,
      },
    };
  } catch (err) {
    console.warn('Warning: Could not parse existing siteConfig.json, writing updated default configuration.');
  }
}

fs.mkdirSync(path.dirname(siteConfigPath), { recursive: true });
fs.writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, 2) + '\n', 'utf8');
console.log('Updated: src/data/siteConfig.json (features.enableForum = true)');

// 2. Create src/pages/forum.astro
const forumAstroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import siteConfig from '../data/siteConfig.json';

const giscus = siteConfig.giscus || {
  repo: 'YOUR_GITHUB_USERNAME/camino-henro',
  repoId: '',
  category: 'General',
  categoryId: '',
};

const isGiscusConfigured = Boolean(
  giscus.repoId &&
    giscus.repoId.trim() !== '' &&
    giscus.categoryId &&
    giscus.categoryId.trim() !== ''
);

const inquiryPrompts = [
  {
    number: '01',
    jpTitle: '足るを知ること・余剰について',
    title: 'On Sufficiency vs. Surplus',
    question:
      'Where do you draw the boundary between what is genuinely required to feel safe in the world and what is accumulated merely out of habit or fear? Share a moment when carrying or owning less unexpectedly deepened your sense of security.',
  },
  {
    number: '02',
    jpTitle: 'お接待とドナティーボの精神',
    title: 'Traditions of Hospitality (Osettai & Donativo)',
    question:
      'Both the Camino de Santiago and the Shikoku Henro rely on an ancient economy of trust—strangers offering water, shelter, or alms without expectation of return. Have you experienced or practiced uncalculated hospitality in modern life?',
  },
  {
    number: '03',
    jpTitle: '前途への問い・旅人への言葉',
    title: 'Questions for the Road Ahead',
    question:
      'Is there a philosophical question, a regional custom along the Eurasian route, or a word of roadside encouragement you wish to place in the pack as Henro walks eastward toward Japan?',
  },
];
---

<BaseLayout
  title="Community Courtyard (Forum) | CAMINO HENRO"
  description="The Pilgrim's Courtyard (Agora) — a meditative community space for discussing the essays, material security, hospitality, and the walk from Finisterra to Shikoku."
>
  <!-- a) Editorial Header -->
  <header class="pt-2 pb-8 border-b border-[#6E2B25]">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
      <p class="font-jp text-sm sm:text-base tracking-[0.2em] text-[#6E2B25]">
        講堂・対話の庭 / The Pilgrim's Courtyard (Agora)
      </p>
      <span class="font-mono text-xs text-[#524D46]">
        STAGE: {siteConfig.currentLocation}
      </span>
    </div>

    <h1 class="font-heading text-3xl sm:text-5xl font-bold tracking-wider uppercase text-[#1C1A17] mb-4">
      The Pilgrim's Courtyard
    </h1>

    <div class="essay-prose max-w-none text-[#1C1A17] space-y-4">
      <p class="text-base sm:text-lg text-[#524D46] leading-relaxed">
        In the temple compounds of Shikoku and the stone courtyards of European monastic hospices, the walk never ends in silence alone. At dusk, travelers gather around the brazier or the common table to test their reflections against the lived experience of others.
      </p>
      <p class="text-base sm:text-lg text-[#524D46] leading-relaxed">
        This courtyard is an open ledger of dialogue. You are invited to respond to the dispatches, share your own inquiries into material security and simplicity, deliberate on community initiatives, or leave a quiet word of roadside encouragement for {siteConfig.pilgrimAlias}.
      </p>
    </div>
  </header>

  <!-- b) Core Inquiry Prompts -->
  <section class="py-8 border-b border-[#6E2B25]" aria-labelledby="inquiry-prompts-heading">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-6">
      <div>
        <span class="font-mono text-xs uppercase tracking-widest text-[#6E2B25] block mb-1">
          [ CONTEMPLATION SEEDS // THREE INQUIRIES ]
        </span>
        <h2
          id="inquiry-prompts-heading"
          class="font-heading text-2xl sm:text-3xl font-semibold uppercase tracking-wider text-[#1C1A17]"
        >
          Core Inquiry Prompts
        </h2>
      </div>
      <span class="font-jp text-xs text-[#524D46] tracking-widest">
        思索の種
      </span>
    </div>

    <div class="grid grid-cols-1 gap-5">
      {inquiryPrompts.map((prompt) => (
        <article class="border border-[#1C1A17]/25 bg-[#D8CEB8]/35 p-5 sm:p-6 transition-colors hover:border-[#6E2B25]">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#1C1A17]/15">
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs font-semibold text-[#6E2B25] px-2 py-0.5 border border-[#6E2B25]/40 bg-[#6E2B25]/10">
                PROMPT {prompt.number}
              </span>
              <span class="font-jp text-xs text-[#524D46] tracking-widest">
                {prompt.jpTitle}
              </span>
            </div>
            <span class="font-jp text-xs text-[#6E2B25]">印</span>
          </div>

          <h3 class="font-heading text-xl sm:text-2xl font-bold text-[#1C1A17] mb-2">
            {prompt.title}
          </h3>

          <p class="font-body text-base text-[#524D46] leading-relaxed">
            {prompt.question}
          </p>
        </article>
      ))}
    </div>
  </section>

  <!-- c) Conditional Giscus Integration -->
  <section class="py-8" aria-labelledby="courtyard-dialogue-heading">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-6">
      <div>
        <span class="font-mono text-xs uppercase tracking-widest text-[#6E2B25] block mb-1">
          [ PUBLIC DIALOGUE // GITHUB DISCUSSIONS LEDGER ]
        </span>
        <h2
          id="courtyard-dialogue-heading"
          class="font-heading text-2xl sm:text-3xl font-semibold uppercase tracking-wider text-[#1C1A17]"
        >
          Courtyard Voices
        </h2>
      </div>
      <div class="font-mono text-xs text-[#524D46]">
        {isGiscusConfigured ? (
          <span class="text-[#6E2B25] font-semibold">● LIVE AGORA THREAD</span>
        ) : (
          <span>○ AWAITING REPOSITORY LINK</span>
        )}
      </div>
    </div>

    {isGiscusConfigured ? (
      <div class="border border-[#1C1A17]/25 bg-[#E6DFCF] p-4 sm:p-6">
        <div class="giscus-frame-container">
          <script
            src="https://giscus.app/client.js"
            data-repo={giscus.repo}
            data-repo-id={giscus.repoId}
            data-category={giscus.category}
            data-category-id={giscus.categoryId}
            data-mapping="specific"
            data-term="Camino Henro Agora"
            data-strict="0"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="top"
            data-theme="light"
            data-lang="en"
            crossorigin="anonymous"
            async
          ></script>
        </div>
      </div>
    ) : (
      <!-- Dignified Courtyard Activation Guide Box (#D8CEB8 / washi-dark) -->
      <div class="border-2 border-[#6E2B25] bg-[#D8CEB8] p-6 sm:p-8 text-[#1C1A17]">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-[#6E2B25]/40">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center justify-center w-6 h-6 border border-[#6E2B25] text-[#6E2B25] font-jp text-xs font-bold">
              印
            </span>
            <span class="font-mono text-xs uppercase tracking-widest text-[#6E2B25] font-semibold">
              Courtyard Activation Guide (3-Step Setup)
            </span>
          </div>
          <span class="font-jp text-xs text-[#524D46]">開門の手引き</span>
        </div>

        <h3 class="font-heading text-2xl sm:text-3xl font-bold text-[#1C1A17] mb-3">
          How to Open the Courtyard Gates
        </h3>

        <p class="font-body text-base text-[#524D46] leading-relaxed mb-6">
          This forum uses <strong>Giscus</strong> (powered by GitHub Discussions) so community conversations remain 100% free, ad-free, and stored directly alongside the pilgrimage archive with zero backend database maintenance. Follow these three steps to activate live posting:
        </p>

        <ol class="space-y-5 mb-6">
          <li class="border border-[#1C1A17]/20 bg-[#E6DFCF]/80 p-4 sm:p-5">
            <div class="flex items-baseline justify-between gap-2 mb-1.5">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#6E2B25]">
                Step 01 // Enable GitHub Discussions
              </span>
              <span class="font-mono text-[11px] text-[#524D46]">Repository Settings</span>
            </div>
            <p class="font-body text-sm sm:text-base text-[#1C1A17] leading-relaxed">
              Open your website repository on GitHub, click the <strong>Settings</strong> tab at the top, scroll down to the <strong>Features</strong> section, and check the box next to <strong>Discussions</strong>. Then install the free <a href="https://github.com/apps/giscus" target="_blank" rel="noopener noreferrer" class="text-[#6E2B25] underline underline-offset-4 hover:text-[#8C3B33]">Giscus GitHub App</a> on your repository.
            </p>
          </li>

          <li class="border border-[#1C1A17]/20 bg-[#E6DFCF]/80 p-4 sm:p-5">
            <div class="flex items-baseline justify-between gap-2 mb-1.5">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#6E2B25]">
                Step 02 // Copy Your IDs from giscus.app
              </span>
              <span class="font-mono text-[11px] text-[#524D46]">Configuration Generator</span>
            </div>
            <p class="font-body text-sm sm:text-base text-[#1C1A17] leading-relaxed">
              Visit <a href="https://giscus.app" target="_blank" rel="noopener noreferrer" class="text-[#6E2B25] underline underline-offset-4 hover:text-[#8C3B33] font-mono text-xs sm:text-sm">https://giscus.app</a> and type your repository name (<code class="font-mono text-xs bg-[#D8CEB8] px-1.5 py-0.5">{giscus.repo}</code>). Choose the <strong>General</strong> discussion category and scroll down to the generated <code class="font-mono text-xs bg-[#D8CEB8] px-1.5 py-0.5">&lt;script&gt;</code> tag to copy your <code class="font-mono text-xs bg-[#D8CEB8] px-1.5 py-0.5">data-repo-id</code> and <code class="font-mono text-xs bg-[#D8CEB8] px-1.5 py-0.5">data-category-id</code> values.
            </p>
          </li>

          <li class="border border-[#1C1A17]/20 bg-[#E6DFCF]/80 p-4 sm:p-5">
            <div class="flex items-baseline justify-between gap-2 mb-1.5">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#6E2B25]">
                Step 03 // Paste into siteConfig.json
              </span>
              <span class="font-mono text-[11px] text-[#524D46]">Local File or PagesCMS</span>
            </div>
            <p class="font-body text-sm sm:text-base text-[#1C1A17] leading-relaxed mb-3">
              Open <code class="font-mono text-xs bg-[#D8CEB8] px-1.5 py-0.5">src/data/siteConfig.json</code> (in Notepad or via GitHub / PagesCMS) and paste your IDs into the <code class="font-mono text-xs bg-[#D8CEB8] px-1.5 py-0.5">giscus</code> block. Once saved, this guide automatically disappears and reveals the live discussion board and essay comment drawers:
            </p>
            <pre class="bg-[#1C1A17] text-[#E6DFCF] font-mono text-xs p-3.5 overflow-x-auto leading-relaxed"><code>"giscus": &#123;
  "repo": "{giscus.repo}",
  "repoId": "R_kgDO...",
  "category": "General",
  "categoryId": "DIC_kwDO..."
&#125;</code></pre>
          </li>
        </ol>

        <div class="pt-4 border-t border-[#1C1A17]/15 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-[#524D46]">
          <span>CURRENT CONFIG STATUS: repoId="" (Unconfigured)</span>
          <a
            href="/essays"
            class="text-[#6E2B25] hover:text-[#8C3B33] uppercase tracking-wider font-semibold"
          >
            Read Latest Dispatches →
          </a>
        </div>
      </div>
    )}
  </section>
</BaseLayout>
`;

const forumPagePath = path.resolve(process.cwd(), 'src/pages/forum.astro');
fs.mkdirSync(path.dirname(forumPagePath), { recursive: true });
fs.writeFileSync(forumPagePath, forumAstroContent, 'utf8');
console.log('Created: src/pages/forum.astro');

console.log('\nMilestone 4 (Community Forum) complete! Run npm run dev and visit http://localhost:4321/forum');