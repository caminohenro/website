import fs from 'node:fs';
import path from 'node:path';

const files = {
  'src/pages/index.astro': `---
import BaseLayout from '../layouts/BaseLayout.astro';
import siteConfig from '../data/siteConfig.json';
import finances from '../data/finances.json';
import { getCollection } from 'astro:content';

// Calculate currentReserves dynamically at build time
const entries = Array.isArray(finances.entries) ? finances.entries : [];
const totalOsettai = entries
  .filter((entry) => entry.type === 'osettai')
  .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

const totalExpenses = entries
  .filter((entry) => entry.type === 'expense')
  .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

const rawReserves = Number(finances.startingReserve || 0) + totalOsettai - totalExpenses;
const currentReserves = \`\${finances.currencySymbol}\${rawReserves.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}\`;

// Fetch non-draft essays sorted newest-first
const allEssays = await getCollection('essays', ({ data }) => !data.draft);
const sortedEssays = allEssays.sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
);

const latestEssay = sortedEssays[0] || null;
const recentEssays = sortedEssays.slice(0, 4);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
---

<BaseLayout title={\`\${siteConfig.siteTitleJp} | \${siteConfig.siteTitleEn}\`} description={siteConfig.tagline}>
  <!-- a) Hero Header -->
  <section class="pt-4 pb-10 text-center">
    <img
      src={siteConfig.crestImage}
      alt="Camino Henro Crest"
      class="w-24 h-24 mx-auto mb-6 object-contain"
    />
    <p class="font-jp text-2xl sm:text-3xl tracking-[0.25em] text-[#1C1A17] mb-2">
      {siteConfig.siteTitleJp}
    </p>
    <h1 class="font-heading text-4xl sm:text-5xl font-bold tracking-widest text-[#1C1A17] uppercase mb-4">
      {siteConfig.siteTitleEn}
    </h1>
    <p class="font-body italic text-lg sm:text-xl text-[#524D46] max-w-xl mx-auto mb-8">
      "{siteConfig.tagline}"
    </p>
    <div class="flex items-center justify-center gap-3">
      <span class="block w-16 h-[1px] bg-[#6E2B25]"></span>
      <span class="font-jp text-xs text-[#6E2B25] select-none">印</span>
      <span class="block w-16 h-[1px] bg-[#6E2B25]"></span>
    </div>
  </section>

  <!-- b) Expedition Status Strip -->
  <section class="border-y border-[#6E2B25] py-4 my-2">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-2 font-mono text-xs sm:text-sm">
      <div class="sm:pr-4 sm:border-r sm:border-[#1C1A17]/15">
        <span class="block text-[10px] uppercase tracking-widest text-[#524D46] mb-1">
          CURRENT STAGE
        </span>
        <span class="text-[#1C1A17] font-medium block truncate">
          {siteConfig.currentLocation}
        </span>
      </div>

      <div class="sm:px-4 sm:border-r sm:border-[#1C1A17]/15">
        <span class="block text-[10px] uppercase tracking-widest text-[#524D46] mb-1">
          TRAIL RESERVES
        </span>
        <a
          href="/finances"
          class="text-[#6E2B25] hover:text-[#8C3B33] font-medium underline underline-offset-4 decoration-[#6E2B25]/40 transition-colors"
        >
          {currentReserves} →
        </a>
      </div>

      <div class="sm:pl-4">
        <span class="block text-[10px] uppercase tracking-widest text-[#524D46] mb-1">
          LATEST DISPATCH
        </span>
        {latestEssay ? (
          <a
            href={\`/essays/\${latestEssay.slug}\`}
            class="text-[#1C1A17] hover:text-[#6E2B25] transition-colors block truncate"
            title={latestEssay.data.title}
          >
            <span class="underline underline-offset-4 decoration-[#1C1A17]/30">
              {latestEssay.data.title}
            </span>
            <span class="text-[#524D46] text-xs ml-1">
              ({formatDate(latestEssay.data.date)})
            </span>
          </a>
        ) : (
          <span class="text-[#524D46]">Awaiting first dispatch</span>
        )}
      </div>
    </div>
  </section>

  <!-- c) The Manifesto Section -->
  <section class="py-10 border-b border-[#6E2B25]">
    <div class="mb-6 flex items-baseline justify-between">
      <h2 class="font-heading text-2xl sm:text-3xl font-semibold tracking-wider uppercase text-[#1C1A17]">
        The Pilgrim's Manifesto
      </h2>
      <span class="font-jp text-xs text-[#524D46] tracking-widest">序文・趣旨</span>
    </div>

    <div class="essay-prose">
      <blockquote class="my-6 pl-5 border-l-2 border-[#6E2B25] italic text-[#524D46] space-y-2">
        <p class="!mb-2">
          "A boy and a hat set out on a journey to cross a continent and discover a world(view) where money, jobs and human society are simply another part of Nature."
        </p>
        <p class="!mb-2">
          "We have never left Nature — we've merely forgotten that everything is, inevitably, Nature. ☯️"
        </p>
        <p class="!mb-2">
          "For the hat, a homecoming — its very own Odyssey."
        </p>
        <p class="!mb-0">
          "For the boy, a rite of initiation, and the beginning of a journey into manhood."
        </p>
      </blockquote>

      <p>
        From the wind-scoured granite cliffs of Cape Finisterra in Spain—where medieval walkers once believed the earthly road ended—this pilgrimage turns eastward across the breadth of Eurasia toward the eighty-eight sacred temples of Shikoku, Japan. Carrying only what fits inside a light pack and walking in minimalist sandals, the journey unites the ancient European Camino de Santiago with the Japanese <em>Henro</em> tradition by a single, unbroken thread of footsteps. It is not a race for distance or spectacle, but a slow, deliberate inquiry conducted at the pace of human breath.
      </p>

      <p>
        At the heart of this walk lies a foundational philosophical question: what does it truly require for a human being to feel materially secure in this world? In an era that mistakes endless accumulation and financial insulation for safety, stepping onto the open road strips life down to water, bread, shelter, and mutual trust. By meeting strangers across mountains, steppes, and borders through the living traditions of <em>donativo</em> and <em>Osettai</em>, these dispatches seek a grounded philosophy of sufficiency—one that recognizes human hospitality and society not as artificial systems apart from the wild, but as Nature caring for itself.
      </p>
    </div>
  </section>

  <!-- d) Recent Dispatches (Essay Stream) -->
  <section class="py-10 border-b border-[#6E2B25]">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-8">
      <div>
        <span class="font-jp text-xs text-[#6E2B25] tracking-widest block mb-1">随筆・記録</span>
        <h2 class="font-heading text-2xl sm:text-3xl font-semibold tracking-wider uppercase text-[#1C1A17]">
          Recent Dispatches
        </h2>
      </div>
      <a
        href="/essays"
        class="font-mono text-xs uppercase tracking-wider text-[#6E2B25] hover:text-[#8C3B33] underline underline-offset-4"
      >
        View Full Archive ({sortedEssays.length}) →
      </a>
    </div>

    <div class="divide-y divide-[#1C1A17]/15">
      {recentEssays.map((essay) => (
        <article class="py-7 first:pt-2 last:pb-2">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#524D46] mb-2">
            <time datetime={essay.data.date.toISOString()}>
              {formatDate(essay.data.date)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{essay.data.location}</span>
            {typeof essay.data.kilometersWalked === 'number' && (
              <>
                <span aria-hidden="true">·</span>
                <span class="text-[#6E2B25] font-medium">
                  KM {essay.data.kilometersWalked}
                </span>
              </>
            )}
            {essay.data.readingTime && (
              <>
                <span aria-hidden="true">·</span>
                <span>{essay.data.readingTime}</span>
              </>
            )}
          </div>

          <h3 class="font-heading text-2xl sm:text-3xl font-semibold text-[#1C1A17] mb-1 leading-snug">
            <a
              href={\`/essays/\${essay.slug}\`}
              class="hover:text-[#6E2B25] transition-colors"
            >
              {essay.data.title}
            </a>
          </h3>

          {essay.data.subtitle && (
            <p class="font-body italic text-base sm:text-lg text-[#524D46] mb-3">
              {essay.data.subtitle}
            </p>
          )}

          <p class="font-body text-[#1C1A17]/90 leading-relaxed mb-4">
            {essay.data.excerpt}
          </p>

          <a
            href={\`/essays/\${essay.slug}\`}
            class="inline-block font-mono text-xs uppercase tracking-widest text-[#6E2B25] hover:text-[#8C3B33] font-medium transition-colors"
          >
            Read Dispatch →
          </a>
        </article>
      ))}
    </div>
  </section>

  <!-- e) Bottom Osettai Callout -->
  <section class="pt-10 pb-4">
    <div class="border border-[#1C1A17]/20 bg-[#D8CEB8]/45 p-6 sm:p-8">
      <div class="flex items-center justify-between mb-3">
        <span class="font-mono text-xs uppercase tracking-widest text-[#6E2B25]">
          Reciprocity on the Road
        </span>
        <span class="font-jp text-sm text-[#6E2B25]">お接待・同行二人</span>
      </div>

      <h2 class="font-heading text-2xl sm:text-3xl font-semibold text-[#1C1A17] mb-3">
        The Tradition of Osettai (お接待)
      </h2>

      <p class="font-body text-base sm:text-lg text-[#1C1A17]/90 leading-relaxed mb-6">
        Along the Shikoku pilgrimage and the historic ways of the Camino, a walker is sustained by <em>Osettai</em> and <em>donativo</em>—hospitality and alms offered freely in good faith so that the giver and the pilgrim walk forward together in spirit. Every contribution toward provisions, shelter, or the keeping of this archive is logged transparently in the open ledger.
      </p>

      <div class="flex flex-wrap items-center gap-4">
        <a
          href="/donate"
          class="inline-block bg-[#6E2B25] hover:bg-[#8C3B33] text-[#E6DFCF] font-mono text-xs uppercase tracking-widest px-5 py-3 transition-colors"
        >
          Offer Osettai →
        </a>
        <a
          href="/finances"
          class="inline-block border border-[#1C1A17]/30 hover:border-[#6E2B25] text-[#1C1A17] hover:text-[#6E2B25] font-mono text-xs uppercase tracking-widest px-5 py-3 transition-colors"
        >
          Inspect Open Ledger
        </a>
      </div>
    </div>
  </section>
</BaseLayout>
`,

  'src/pages/essays/index.astro': `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';

const allEssays = await getCollection('essays', ({ data }) => !data.draft);
const sortedEssays = allEssays.sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
);

const totalDispatches = sortedEssays.length;
const totalKilometersLogged = sortedEssays.reduce((maxKm, essay) => {
  const km = typeof essay.data.kilometersWalked === 'number' ? essay.data.kilometersWalked : 0;
  return km > maxKm ? km : maxKm;
}, 0);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
---

<BaseLayout
  title="Essays & Dispatches | CAMINO HENRO"
  description="Chronological philosophical dispatches written on foot from Finisterra, Spain toward Shikoku, Japan."
>
  <!-- Archive Header -->
  <header class="pt-2 pb-8 border-b border-[#6E2B25]">
    <p class="font-jp text-sm sm:text-base tracking-[0.2em] text-[#6E2B25] mb-2">
      随筆・思索の記録
    </p>
    <h1 class="font-heading text-3xl sm:text-5xl font-bold tracking-wider uppercase text-[#1C1A17] mb-3">
      Dispatches from the Road
    </h1>
    <p class="font-body text-base sm:text-lg text-[#524D46] max-w-2xl leading-relaxed mb-6">
      Long-form reflections on material security, reciprocity, and the quiet continuity between human society and Nature, inscribed along the overland path from the Atlantic coast to Japan.
    </p>

    <div class="flex flex-wrap items-center gap-6 pt-4 border-t border-[#1C1A17]/15 font-mono text-xs text-[#524D46]">
      <div>
        <span class="uppercase tracking-widest">Total Dispatches:</span>{' '}
        <strong class="text-[#1C1A17] font-medium">{totalDispatches}</strong>
      </div>
      <div>
        <span class="uppercase tracking-widest">Furthest Marker Logged:</span>{' '}
        <strong class="text-[#6E2B25] font-medium">KM {totalKilometersLogged}</strong>
      </div>
      <div>
        <span class="uppercase tracking-widest">Order:</span>{' '}
        <span class="text-[#1C1A17]">Newest First</span>
      </div>
    </div>
  </header>

  <!-- Chronological Stream of Essays -->
  <section class="divide-y divide-[#1C1A17]/15">
    {sortedEssays.map((essay, index) => (
      <article class="py-8">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#524D46] mb-2">
          <span class="text-[#6E2B25] font-medium">
            #{String(totalDispatches - index).padStart(2, '0')}
          </span>
          <span aria-hidden="true">·</span>
          <time datetime={essay.data.date.toISOString()}>
            {formatDate(essay.data.date)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{essay.data.location}</span>
          {typeof essay.data.kilometersWalked === 'number' && (
            <>
              <span aria-hidden="true">·</span>
              <span class="text-[#6E2B25] font-medium">
                KM {essay.data.kilometersWalked}
              </span>
            </>
          )}
          {essay.data.readingTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{essay.data.readingTime}</span>
            </>
          )}
        </div>

        <h2 class="font-heading text-2xl sm:text-3xl font-semibold text-[#1C1A17] mb-1 leading-snug">
          <a
            href={\`/essays/\${essay.slug}\`}
            class="hover:text-[#6E2B25] transition-colors"
          >
            {essay.data.title}
          </a>
        </h2>

        {essay.data.subtitle && (
          <p class="font-body italic text-base sm:text-lg text-[#524D46] mb-3">
            {essay.data.subtitle}
          </p>
        )}

        <p class="font-body text-[#1C1A17]/90 leading-relaxed mb-4">
          {essay.data.excerpt}
        </p>

        <a
          href={\`/essays/\${essay.slug}\`}
          class="inline-block font-mono text-xs uppercase tracking-widest text-[#6E2B25] hover:text-[#8C3B33] font-medium transition-colors"
        >
          Read Full Dispatch →
        </a>
      </article>
    ))}
  </section>
</BaseLayout>
`,

  'src/pages/essays/[...slug].astro': `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import siteConfig from '../../data/siteConfig.json';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const allEssays = await getCollection('essays', ({ data }) => !data.draft);
  // Sort oldest-first so prev/next follow chronological trail order
  const chronological = allEssays.sort(
    (a, b) => a.data.date.valueOf() - b.data.date.valueOf()
  );

  return chronological.map((entry, index) => ({
    params: { slug: entry.slug },
    props: {
      entry,
      prevEssay: index > 0 ? chronological[index - 1] : null,
      nextEssay: index < chronological.length - 1 ? chronological[index + 1] : null,
    },
  }));
}

const { entry, prevEssay, nextEssay } = Astro.props;
const { Content } = await entry.render();

const formattedDate = entry.data.date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const showGiscusDrawer =
  siteConfig.features?.enableForum === true &&
  Boolean(siteConfig.giscus?.repoId && siteConfig.giscus.repoId.trim() !== '');
---

<BaseLayout title={entry.data.title} description={entry.data.excerpt}>
  <!-- a) Minimal Top Breadcrumb -->
  <nav class="mb-6" aria-label="Breadcrumb">
    <a
      href="/essays"
      class="font-mono text-xs uppercase tracking-widest text-[#524D46] hover:text-[#6E2B25] transition-colors"
    >
      ← Back to All Dispatches
    </a>
  </nav>

  <!-- b) Essay Header with Stamped Metadata -->
  <header class="pb-8 border-b border-[#6E2B25]">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#524D46] mb-4">
      <time datetime={entry.data.date.toISOString()} class="text-[#1C1A17] font-medium">
        {formattedDate}
      </time>
      <span aria-hidden="true">·</span>
      <span>{entry.data.location}</span>
      {typeof entry.data.kilometersWalked === 'number' && (
        <>
          <span aria-hidden="true">·</span>
          <span class="px-1.5 py-0.5 border border-[#6E2B25] text-[#6E2B25] font-medium">
            KM {entry.data.kilometersWalked}
          </span>
        </>
      )}
      {entry.data.readingTime && (
        <>
          <span aria-hidden="true">·</span>
          <span>{entry.data.readingTime}</span>
        </>
      )}
    </div>

    <h1 class="font-heading text-3xl sm:text-5xl font-bold text-[#1C1A17] leading-tight mb-3">
      {entry.data.title}
    </h1>

    {entry.data.subtitle && (
      <p class="font-body italic text-lg sm:text-xl text-[#524D46] leading-relaxed">
        {entry.data.subtitle}
      </p>
    )}
  </header>

  <!-- c) Distraction-Free Essay Body -->
  <article class="essay-prose max-w-[65ch] mx-auto my-10">
    <Content />
  </article>

  <!-- d) Share & Osettai Bar at Essay End -->
  <section class="mt-12 pt-8 border-t border-[#6E2B25]">
    <div class="border border-[#1C1A17]/20 bg-[#D8CEB8]/40 p-6 sm:p-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1C1A17]/15">
        <div>
          <span class="font-mono text-[11px] uppercase tracking-widest text-[#6E2B25] block mb-1">
            Pass the Scroll Along
          </span>
          <h2 class="font-heading text-xl sm:text-2xl font-semibold text-[#1C1A17]">
            Share This Dispatch
          </h2>
        </div>

        <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            id="copy-link-btn"
            type="button"
            class="border border-[#1C1A17]/40 bg-[#E6DFCF] hover:border-[#6E2B25] hover:text-[#6E2B25] text-[#1C1A17] px-3 py-2 uppercase tracking-wider transition-colors"
          >
            Copy Direct Link
          </button>

          <button
            id="native-share-btn"
            type="button"
            data-title={entry.data.title}
            data-excerpt={entry.data.excerpt}
            class="hidden border border-[#6E2B25] text-[#6E2B25] hover:bg-[#6E2B25] hover:text-[#E6DFCF] px-3 py-2 uppercase tracking-wider transition-colors"
          >
            Share...
          </button>

          <a
            id="share-x-link"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[#1C1A17]/25 hover:border-[#6E2B25] text-[#524D46] hover:text-[#6E2B25] px-2.5 py-2 uppercase tracking-wider transition-colors"
          >
            X / Twitter
          </a>

          <a
            id="share-reddit-link"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-[#1C1A17]/25 hover:border-[#6E2B25] text-[#524D46] hover:text-[#6E2B25] px-2.5 py-2 uppercase tracking-wider transition-colors"
          >
            Reddit
          </a>

          <a
            id="share-email-link"
            href="#"
            class="border border-[#1C1A17]/25 hover:border-[#6E2B25] text-[#524D46] hover:text-[#6E2B25] px-2.5 py-2 uppercase tracking-wider transition-colors"
          >
            Email
          </a>
        </div>
      </div>

      <!-- Offer Osettai Callout -->
      <div class="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p class="font-body text-sm sm:text-base text-[#1C1A17]/85 max-w-md">
          If these words offered quiet company today, you may support the walk and archive in the tradition of pilgrimage alms.
        </p>
        <a
          href="/donate"
          class="inline-block text-center bg-[#6E2B25] hover:bg-[#8C3B33] text-[#E6DFCF] font-mono text-xs uppercase tracking-widest px-4 py-3 transition-colors shrink-0"
        >
          Offer Osettai (Support the Walk) 印
        </a>
      </div>
    </div>

    <!-- Next / Previous Essay Navigation Grid -->
    <nav
      class="grid grid-cols-1 sm:grid-cols-2 border-y border-[#1C1A17]/15 mt-8 divide-y sm:divide-y-0 sm:divide-x divide-[#1C1A17]/15"
      aria-label="Adjacent Dispatches"
    >
      <div class="py-5 sm:pr-6">
        {prevEssay ? (
          <a href={\`/essays/\${prevEssay.slug}\`} class="group block">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              ← Previous Dispatch
            </span>
            <span class="font-heading text-lg sm:text-xl font-semibold text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors">
              {prevEssay.data.title}
            </span>
          </a>
        ) : (
          <div class="opacity-50">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              Start of the Trail
            </span>
            <span class="font-heading text-lg text-[#524D46]">
              First Recorded Dispatch
            </span>
          </div>
        )}
      </div>

      <div class="py-5 sm:pl-6 sm:text-right">
        {nextEssay ? (
          <a href={\`/essays/\${nextEssay.slug}\`} class="group block">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              Next Dispatch →
            </span>
            <span class="font-heading text-lg sm:text-xl font-semibold text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors">
              {nextEssay.data.title}
            </span>
          </a>
        ) : (
          <div class="opacity-50">
            <span class="font-mono text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
              Current Horizon
            </span>
            <span class="font-heading text-lg text-[#524D46]">
              Latest Recorded Dispatch
            </span>
          </div>
        )}
      </div>
    </nav>

    <!-- Optional Community Reflections Drawer -->
    {showGiscusDrawer && (
      <details class="mt-8 border border-[#1C1A17]/20 bg-[#D8CEB8]/25 p-5">
        <summary class="cursor-pointer font-mono text-xs uppercase tracking-widest text-[#1C1A17] hover:text-[#6E2B25] select-none">
          Community Reflections &amp; Roadside Notes (Click to Expand)
        </summary>
        <div class="mt-6 pt-4 border-t border-[#1C1A17]/15">
          <script
            src="https://giscus.app/client.js"
            data-repo={siteConfig.giscus.repo}
            data-repo-id={siteConfig.giscus.repoId}
            data-category={siteConfig.giscus.category}
            data-category-id={siteConfig.giscus.categoryId}
            data-mapping="pathname"
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
      </details>
    )}
  </section>

  <script is:inline>
    (function () {
      const pageUrl = window.location.href;
      const pageTitle = document.title;

      const copyBtn = document.getElementById('copy-link-btn');
      const nativeShareBtn = document.getElementById('native-share-btn');
      const xLink = document.getElementById('share-x-link');
      const redditLink = document.getElementById('share-reddit-link');
      const emailLink = document.getElementById('share-email-link');

      // Populate social share hrefs
      if (xLink) {
        xLink.setAttribute(
          'href',
          'https://twitter.com/intent/tweet?text=' +
            encodeURIComponent(pageTitle) +
            '&url=' +
            encodeURIComponent(pageUrl)
        );
      }

      if (redditLink) {
        redditLink.setAttribute(
          'href',
          'https://www.reddit.com/submit?url=' +
            encodeURIComponent(pageUrl) +
            '&title=' +
            encodeURIComponent(pageTitle)
        );
      }

      if (emailLink) {
        emailLink.setAttribute(
          'href',
          'mailto:?subject=' +
            encodeURIComponent(pageTitle) +
            '&body=' +
            encodeURIComponent('Read this dispatch from Camino Henro: ' + pageUrl)
        );
      }

      // Copy Direct Link handler
      if (copyBtn) {
        copyBtn.addEventListener('click', async function () {
          const originalLabel = 'Copy Direct Link';
          try {
            await navigator.clipboard.writeText(window.location.href);
            copyBtn.textContent = '✓ Link Copied';
          } catch (err) {
            const tempInput = document.createElement('input');
            tempInput.value = window.location.href;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            copyBtn.textContent = '✓ Link Copied';
          }
          setTimeout(function () {
            copyBtn.textContent = originalLabel;
          }, 2500);
        });
      }

      // Native mobile share sheet support
      if (nativeShareBtn && typeof navigator.share === 'function') {
        nativeShareBtn.classList.remove('hidden');
        nativeShareBtn.addEventListener('click', function () {
          const title = nativeShareBtn.getAttribute('data-title') || document.title;
          const text = nativeShareBtn.getAttribute('data-excerpt') || '';
          navigator
            .share({
              title: title,
              text: text,
              url: window.location.href,
            })
            .catch(function () {});
        });
      }
    })();
  </script>
</BaseLayout>
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${relativePath}`);
}

console.log('\nStep 1D complete! Home page, Essays archive, and Essay reader are ready.');