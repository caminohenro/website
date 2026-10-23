import fs from 'node:fs';
import path from 'node:path';

// 1. Update src/data/siteConfig.json to set features.enableInventory = true
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
    enableInventory: true,
    enableMap: false,
    enableForum: false,
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
        enableInventory: true,
      },
    };
  } catch (err) {
    console.warn('Warning: Could not parse existing siteConfig.json, writing updated default configuration.');
  }
}

fs.mkdirSync(path.dirname(siteConfigPath), { recursive: true });
fs.writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, 2) + '\n', 'utf8');
console.log('Updated: src/data/siteConfig.json (features.enableInventory = true)');

// 2. Define src/data/inventory.json and src/pages/inventory.astro
const inventoryData = {
  items: [
    {
      id: 'gear-sugegasa',
      name: 'Sugegasa Woven Sedge Hat',
      japaneseName: '菅笠',
      slot: 'Equipped',
      weightGrams: 380,
      condition: 'Seasoned',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 32L24 12L44 32Q24 27 4 32Z"/><path d="M14 22Q24 19 34 22"/><path d="M9 27Q24 23 39 27"/><path d="M16 31C16 37 32 37 32 31"/></svg>',
      shortSummary: 'Conical Shikoku sedge hat inscribed with the Dōgyō Ninin mantra, shielding brow and spirit from Atlantic gales to Pacific rains.',
      lore: 'Woven from wild sedge grass in the river valleys of Shikoku and carried westward only to walk home again across Eurasia, this hat is a portable roof and a vow of humility. Its sloped brim sheds torrential mountain downpours and fierce steppe sun alike, creating a quiet sanctuary of shade just wide enough for one walker’s thoughts. Inscribed in sumi ink with the words "Dōgyō Ninin" (Two Walking Together), it reminds every stranger along the road that the pilgrim never travels alone.',
      specs: {
        Material: 'Hand-woven Japanese sedge grass (Suge), bamboo inner ring & cotton chin cord',
        Origin: 'Tokushima Prefecture, Shikoku, Japan',
        Role: 'Primary sun & rain canopy; sacred emblem of the Henro pilgrimage',
      },
    },
    {
      id: 'gear-sandals',
      name: 'Camino Minimalist Trail Sandals',
      japaneseName: '草履・サンダル',
      slot: 'Equipped',
      weightGrams: 340,
      condition: 'Worn',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8C10 8 8 13 9 22C10 31 11 40 16 40C21 40 22 33 21 22C20 13 18 8 14 8Z"/><path d="M34 8C30 8 28 13 29 22C30 33 31 40 36 40C41 40 42 31 43 22C44 13 40 8 34 8Z"/><path d="M15 14L15 20M15 20L10 28M15 20L21 28"/><path d="M35 14L35 20M35 20L29 28M35 20L41 28"/></svg>',
      shortSummary: 'Thin-soled Huarache-style trail sandals bound with continuous nylon webbing, demanding attentive footwork on every stone.',
      lore: 'Heavy leather boots try to conquer the earth by insulating the foot from it; minimalist sandals ask the walker to listen to the ground instead. With only ten millimeters of rubber between skin and continental bedrock, every pebble in Galicia and every mountain pass ahead requires deliberate, unhurried balance. When soaked by sudden storms, they dry in twenty minutes of walking and never trap blisters.',
      specs: {
        Material: '10mm Vibram Morflex sole with continuous tubular nylon heel-and-toe lacing',
        Origin: 'Galicia, Spain (re-laced at Cape Finisterra)',
        Role: 'All-terrain footwear enforcing mindful cadence and natural foot strength',
      },
    },
    {
      id: 'gear-kongozue',
      name: 'Kongo-zue Pilgrim Staff',
      japaneseName: '金剛杖',
      slot: 'Equipped',
      weightGrams: 450,
      condition: 'Seasoned',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="24" y1="4" x2="24" y2="44"/><path d="M20 8H28"/><path d="M19 14H29"/><path d="M21 20H27"/><circle cx="24" cy="6" r="2"/></svg>',
      shortSummary: 'Hand-carved wooden walking staff serving as a third leg on steep descents and the living bone of the pilgrimage.',
      lore: 'In the Shikoku tradition, the Kongo-zue is revered as the physical embodiment of Kōbō Daishi walking beside the pilgrim, never to be carelessly leaned against bridge rails, washed in rivers before crossing, or rested on the ground indoors. Practically, it absorbs thousands of kilograms of knee impact across rocky descents, tests the depth of muddy fords, and keeps territorial village dogs at a respectful distance. By the time it reaches the Inland Sea, its base will be worn shorter by the friction of twelve countries.',
      specs: {
        Material: 'Japanese cypress (Hinoki) shaft with brocade head cover & brass ferrule bell',
        Origin: 'Mount Kōya / Shikoku Temple 1 (Ryozen-ji)',
        Role: 'Third point of contact on mountain grades; spiritual anchor of the walk',
      },
    },
    {
      id: 'gear-rucksack',
      name: '40L Weatherproof Rucksack',
      japaneseName: '背嚢',
      slot: 'Main Pack',
      weightGrams: 890,
      condition: 'Seasoned',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="12" width="24" height="28" rx="3"/><path d="M16 12V9C16 7 19 6 24 6C29 6 32 7 32 9V12"/><path d="M12 20H36"/><rect x="18" y="25" width="12" height="10"/><line x1="24" y1="18" x2="24" y2="23"/></svg>',
      shortSummary: 'Frameless roll-top canvas-and-ripstop pack holding every earthly possession required between the Atlantic and Japan.',
      lore: 'A forty-liter vessel imposes a quiet philosophical law: if a new object enters this pack, an older attachment must leave. Stripped of heavy internal aluminum frames and redundant zippers that fail in desert grit, its roll-top closure seals out driving rain while keeping the center of gravity pressed close to the spine. Everything required to sleep, write, mend, and endure winter passes lives inside this single cylinder.',
      specs: {
        Material: 'Waxed hybrid ripstop canvas with seam-taped roll-top collar',
        Origin: 'Porto, Portugal / Modified in Santiago de Compostela',
        Role: 'Primary load-bearing vessel housing all non-worn shelter, tools, and provisions',
      },
    },
    {
      id: 'gear-bivy-quilt',
      name: 'Ultralight Bivy & Down Quilt',
      japaneseName: '野営寝具',
      slot: 'Shelter & Sleep',
      weightGrams: 920,
      condition: 'Pristine',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 36L24 14L42 36H6Z"/><path d="M24 14V36"/><path d="M14 36L24 24L34 36"/></svg>',
      shortSummary: 'Compact waterproof breathable bivouac sack paired with a 850-fill goose down quilt rated for freezing alpine nights.',
      lore: 'True freedom from anxiety on the open road begins the moment you know you can sleep warmly behind a stone wall, under a church portico, or in an open meadow when no village inn is within reach. Combining a minimalist storm-bivy with a compressible down quilt cuts shelter weight under one kilogram while preserving warmth down to sub-zero elevations. It transforms the entire continent from an unfamiliar wilderness into an hospitable bedroom.',
      specs: {
        Material: '3-layer waterproof-breathable membrane bivy & 850FP hydrophobic down quilt',
        Origin: 'Pyrenees Mountain Outfitter, Europe',
        Role: 'Autonomous night shelter and thermal insulation down to -5°C (23°F)',
      },
    },
    {
      id: 'gear-journal-phone',
      name: 'Trail Journal, Ink Pen & Field Phone',
      japaneseName: '筆録具',
      slot: 'Electronics & Writing',
      weightGrams: 410,
      condition: 'Seasoned',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="8" width="22" height="32" rx="1"/><line x1="15" y1="15" x2="27" y2="15"/><line x1="15" y1="21" x2="27" y2="21"/><line x1="15" y1="27" x2="23" y2="27"/><path d="M36 10L36 34L34 39L32 34L32 10Z"/></svg>',
      shortSummary: 'Stitched Washi-paper field notebook, brass fountain pen, and low-power smartphone for recording essays and waypoints.',
      lore: 'Walked kilometers vanish into memory like mist unless they are distilled into words at dusk. First drafts and roadside sketches are always written by hand in waterproof black ink while the day’s conversations are still warm, before being transcribed onto the field phone to update this digital scroll. Together they bridge the medieval monastic chronicle with a zero-backend static archive accessible across the globe.',
      specs: {
        Material: 'Lay-flat cream cotton-washi notebook, solid brass fountain pen & ruggedized handset',
        Origin: 'Kyoto paper mill & Lisbon field kit',
        Role: 'Inscribing philosophical dispatches, financial ledger entries, and GPS checkpoints',
      },
    },
    {
      id: 'gear-repair-kit',
      name: 'Brass Needle, Cordage & Repair Kit',
      japaneseName: '修繕具',
      slot: 'Main Pack',
      weightGrams: 145,
      condition: 'Pristine',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="38" x2="38" y2="10"/><circle cx="34" cy="14" r="1.5"/><path d="M14 14C20 8 28 20 34 14"/><rect x="12" y="24" width="12" height="12" rx="2"/></svg>',
      shortSummary: 'Sailmaker’s needles, waxed linen thread, spare sandal webbing, and tenacious patches for field self-reliance.',
      lore: 'In a throwaway consumer economy, a torn strap or punctured bivy is an excuse to buy anew; on a fourteen-thousand-kilometer walk, repair is an act of devotion. Every stitch added to a frayed rucksack seam records a chapter of endurance in the spirit of Japanese Boro mending. Weighing less than a single apple, this tin guarantees that no mechanical failure in remote steppes can halt the pilgrimage.',
      specs: {
        Material: 'Heavy-duty sail needles, 50m waxed hemp/nylon cord, Tenacious Tape & brass safety pins',
        Origin: 'Assembled in Finisterra, Spain',
        Role: 'Field maintenance of sandals, sedge hat bindings, and shelter fabrics',
      },
    },
    {
      id: 'gear-provisions',
      name: 'Dried Figs, Oats & 2L Water Vessel',
      japaneseName: '糧食・水',
      slot: 'Consumables',
      weightGrams: 2350,
      condition: 'Pristine',
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8H30V13L34 18V38C34 40 32 42 30 42H18C16 42 14 40 14 38V18L18 13V8Z"/><line x1="14" y1="26" x2="34" y2="26"/><circle cx="24" cy="34" r="3"/></svg>',
      shortSummary: 'Two liters of spring water and dense, non-perishable trail rations carried between village fountains and bakeries.',
      lore: 'Water and simple grain are the heaviest items in the pack and the only ones that continuously turn into footsteps. Carrying rolled oats, sun-dried Iberian figs, olive oil, and two liters of cold fountain water provides two full days of quiet autonomy between rural settlements. When a roadside host offers fresh fruit as Osettai, this ration pouch is where the gift travels until noon.',
      specs: {
        Material: '2L BPA-free collapsible flasks & waxed linen ration sack (500g dry provisions)',
        Origin: 'Replenished daily at village fountains & local markets',
        Role: 'Immediate caloric and hydration reserve across dry stretches',
      },
    },
  ],
};

const inventoryAstroContent = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import inventoryData from '../data/inventory.json';
import siteConfig from '../data/siteConfig.json';

interface GearSpecs {
  Material?: string;
  Origin?: string;
  Role?: string;
  [key: string]: string | undefined;
}

interface GearItem {
  id: string;
  name: string;
  japaneseName: string;
  slot: string;
  weightGrams: number;
  condition: 'Pristine' | 'Seasoned' | 'Worn' | 'Need Replacement' | string;
  icon: string;
  shortSummary: string;
  lore: string;
  specs?: GearSpecs;
}

// Support either inventoryData.items or a raw array fallback
const rawItems = Array.isArray(inventoryData)
  ? inventoryData
  : Array.isArray(inventoryData?.items)
  ? inventoryData.items
  : [];

const items: GearItem[] = rawItems.map((item, idx) => ({
  id: item.id || 'item-' + idx,
  name: item.name || 'Unnamed Gear',
  japaneseName: item.japaneseName || '装備品',
  slot: item.slot || 'Main Pack',
  weightGrams: Number(item.weightGrams || 0),
  condition: item.condition || 'Seasoned',
  icon: item.icon || '印',
  shortSummary: item.shortSummary || '',
  lore: item.lore || '',
  specs: item.specs || {
    Material: 'Field-tested construction',
    Origin: 'Eurasian Trail',
    Role: 'Pilgrimage equipment',
  },
}));

// Automatic Build-Time Weight Calculations
const equippedGrams = items
  .filter((item) => item.slot === 'Equipped')
  .reduce((sum, item) => sum + item.weightGrams, 0);

const basePackGrams = items
  .filter((item) => item.slot !== 'Equipped' && item.slot !== 'Consumables')
  .reduce((sum, item) => sum + item.weightGrams, 0);

const consumablesGrams = items
  .filter((item) => item.slot === 'Consumables')
  .reduce((sum, item) => sum + item.weightGrams, 0);

const totalTrailGrams = items.reduce((sum, item) => sum + item.weightGrams, 0);

const formatKg = (grams: number) => (grams / 1000).toFixed(2) + ' kg';
const formatGrams = (grams: number) => grams.toLocaleString('en-US') + ' g';

// Group items by the 5 canonical RPG equipment slots
const slotOrder = [
  {
    key: 'Equipped',
    jp: '身支度・装着品',
    description: 'Garments and instruments worn or carried in hand at every step.',
  },
  {
    key: 'Main Pack',
    jp: '背嚢・主装備',
    description: 'Core vessel and field maintenance tools riding against the spine.',
  },
  {
    key: 'Shelter & Sleep',
    jp: '野営・寝具',
    description: 'Autonomous sanctuary for mountain passes, porticos, and open fields.',
  },
  {
    key: 'Electronics & Writing',
    jp: '筆録・通信具',
    description: 'Instruments for inscribing dispatches and logging continental coordinates.',
  },
  {
    key: 'Consumables',
    jp: '糧食・飲料水',
    description: 'Daily water and simple provisions sustaining the body between villages.',
  },
];

const groupedSlots = slotOrder.map((slotMeta) => {
  const slotItems = items.filter((item) => item.slot === slotMeta.key);
  const slotWeightGrams = slotItems.reduce((sum, item) => sum + item.weightGrams, 0);
  return {
    ...slotMeta,
    items: slotItems,
    slotWeightGrams,
  };
});

// Include any custom slots if added via PagesCMS later
const knownSlotKeys = new Set(slotOrder.map((s) => s.key));
const extraSlotsMap = new Map<string, GearItem[]>();
items.forEach((item) => {
  if (!knownSlotKeys.has(item.slot)) {
    const existing = extraSlotsMap.get(item.slot) || [];
    existing.push(item);
    extraSlotsMap.set(item.slot, existing);
  }
});
extraSlotsMap.forEach((extraItems, slotKey) => {
  groupedSlots.push({
    key: slotKey,
    jp: '追加装備',
    description: 'Additional trail equipment.',
    items: extraItems,
    slotWeightGrams: extraItems.reduce((sum, i) => sum + i.weightGrams, 0),
  });
});

const getConditionBadgeClasses = (condition: string) => {
  switch (condition) {
    case 'Pristine':
      return 'border-[#1C1A17]/40 bg-[#D8CEB8]/70 text-[#1C1A17]';
    case 'Seasoned':
      return 'border-[#6E2B25]/50 bg-[#6E2B25]/10 text-[#6E2B25]';
    case 'Worn':
      return 'border-[#6E2B25] bg-[#6E2B25]/20 text-[#6E2B25] font-semibold';
    case 'Need Replacement':
      return 'border-[#6E2B25] bg-[#6E2B25] text-[#E6DFCF] font-semibold';
    default:
      return 'border-[#1C1A17]/30 bg-[#D8CEB8]/40 text-[#524D46]';
  }
};
---

<BaseLayout
  title="Pilgrim's Inventory | CAMINO HENRO"
  description="Tactile RPG gear inventory and build-time weight ledger documenting every item carried on foot from Finisterra, Spain to Shikoku, Japan."
>
  <!-- Editorial Header -->
  <header class="pt-2 pb-8 border-b border-[#6E2B25]">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
      <p class="font-jp text-sm sm:text-base tracking-[0.2em] text-[#6E2B25]">
        行脚装備録 / Pilgrim's Gear Inventory
      </p>
      <span class="font-mono text-xs text-[#524D46]">
        STAGE: {siteConfig.currentLocation}
      </span>
    </div>

    <h1 class="font-heading text-3xl sm:text-5xl font-bold tracking-wider uppercase text-[#1C1A17] mb-3">
      The Weight of Sufficiency
    </h1>

    <p class="font-body text-base sm:text-lg text-[#524D46] max-w-2xl leading-relaxed">
      To walk across a continent is to negotiate daily with gravity. Every object in this loadout must justify its weight in grams through daily utility, durability, or quiet philosophical meaning. Select any equipment slot below to inspect its field lore and specifications.
    </p>
  </header>

  <!-- Automatic Build-Time Weight Summary Bar (4-Column RPG Stat Header) -->
  <section class="py-8 border-b border-[#6E2B25]" aria-label="Pack Weight Summary">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="font-mono text-xs uppercase tracking-widest text-[#6E2B25]">
        [ LOADOUT TELEMETRY // BUILD-TIME WEIGHT CALCULATOR ]
      </h2>
      <span class="font-mono text-xs text-[#524D46]">
        {items.length} ACTIVE ITEMS
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#1C1A17]/25 bg-[#D8CEB8]/40 divide-y sm:divide-y-0 sm:divide-x divide-[#1C1A17]/20 font-mono">
      <!-- 1. Base Pack Weight -->
      <div class="p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
            01 / Base Pack Weight
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-[#6E2B25]">
            {formatKg(basePackGrams)}
          </p>
        </div>
        <div class="mt-3 pt-2 border-t border-[#1C1A17]/15 flex items-center justify-between text-xs text-[#524D46]">
          <span>{formatGrams(basePackGrams)}</span>
          <span>Non-Consumable</span>
        </div>
      </div>

      <!-- 2. Equipped / Worn -->
      <div class="p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
            02 / Equipped / Worn
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-[#1C1A17]">
            {formatKg(equippedGrams)}
          </p>
        </div>
        <div class="mt-3 pt-2 border-t border-[#1C1A17]/15 flex items-center justify-between text-xs text-[#524D46]">
          <span>{formatGrams(equippedGrams)}</span>
          <span>On Body &amp; Hand</span>
        </div>
      </div>

      <!-- 3. Consumables -->
      <div class="p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest text-[#524D46] block mb-1">
            03 / Consumables
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-[#1C1A17]">
            {formatKg(consumablesGrams)}
          </p>
        </div>
        <div class="mt-3 pt-2 border-t border-[#1C1A17]/15 flex items-center justify-between text-xs text-[#524D46]">
          <span>{formatGrams(consumablesGrams)}</span>
          <span>Water &amp; Rations</span>
        </div>
      </div>

      <!-- 4. Total Trail Weight -->
      <div class="p-4 sm:p-5 flex flex-col justify-between bg-[#D8CEB8]/75">
        <div>
          <span class="text-[10px] uppercase tracking-widest text-[#6E2B25] font-semibold block mb-1">
            04 / Total Trail Weight
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-[#1C1A17]">
            {formatKg(totalTrailGrams)}
          </p>
        </div>
        <div class="mt-3 pt-2 border-t border-[#6E2B25]/30 flex items-center justify-between text-xs text-[#6E2B25] font-medium">
          <span>{formatGrams(totalTrailGrams)}</span>
          <span>Full Loadout</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Tactile RPG Equipment Grid Grouped by Slot -->
  <div class="py-8 space-y-12">
    {groupedSlots.map((slotGroup, groupIndex) => (
      <section aria-labelledby={'slot-heading-' + groupIndex}>
        <div class="flex flex-wrap items-baseline justify-between gap-2 pb-3 mb-5 border-b border-[#6E2B25]">
          <div>
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs text-[#6E2B25] font-semibold">
                SLOT 0{groupIndex + 1}
              </span>
              <span class="font-jp text-xs text-[#524D46] tracking-widest">
                {slotGroup.jp}
              </span>
            </div>
            <h2
              id={'slot-heading-' + groupIndex}
              class="font-heading text-2xl sm:text-3xl font-semibold uppercase tracking-wider text-[#1C1A17] mt-0.5"
            >
              {slotGroup.key}
            </h2>
          </div>

          <div class="font-mono text-xs text-[#524D46]">
            <span>SLOT SUBTOTAL: </span>
            <strong class="text-[#1C1A17]">{formatGrams(slotGroup.slotWeightGrams)}</strong>
            <span class="text-[#6E2B25]"> ({formatKg(slotGroup.slotWeightGrams)})</span>
          </div>
        </div>

        <p class="font-body text-sm sm:text-base text-[#524D46] mb-5">
          {slotGroup.description}
        </p>

        {slotGroup.items.length > 0 ? (
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slotGroup.items.map((item) => (
              <button
                type="button"
                data-item-id={item.id}
                aria-haspopup="dialog"
                class="inventory-slot-tile group relative w-full text-left bg-[#E6DFCF] hover:bg-[#D8CEB8]/55 border border-[#1C1A17]/25 hover:border-[#6E2B25] p-5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6E2B25]"
              >
                <!-- Tactile #6E2B25 RPG Corner Accents on Hover -->
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#6E2B25] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
                ></span>
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#6E2B25] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
                ></span>
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#6E2B25] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
                ></span>
                <span
                  aria-hidden="true"
                  class="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#6E2B25] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
                ></span>

                <!-- Top Row: Icon + Japanese Subtitle & Condition Badge + Weight -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 shrink-0 border border-[#1C1A17]/25 group-hover:border-[#6E2B25] bg-[#D8CEB8]/45 flex items-center justify-center text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors p-2">
                      {item.icon.trim().startsWith('<svg') ? (
                        <div class="w-8 h-8" set:html={item.icon} />
                      ) : (
                        <span class="font-jp text-lg font-semibold select-none">
                          {item.icon}
                        </span>
                      )}
                    </div>
                    <div>
                      <span class="font-jp text-xs text-[#6E2B25] tracking-widest block">
                        {item.japaneseName}
                      </span>
                      <h3 class="font-heading text-xl font-bold text-[#1C1A17] group-hover:text-[#6E2B25] transition-colors leading-snug">
                        {item.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <!-- Short Summary -->
                <p class="font-body text-sm text-[#524D46] line-clamp-2 mb-4 leading-relaxed">
                  {item.shortSummary}
                </p>

                <!-- Bottom RPG Telemetry Strip: Condition Badge & Gram Weight -->
                <div class="pt-3 border-t border-[#1C1A17]/15 flex items-center justify-between gap-2 font-mono text-xs">
                  <span
                    class={
                      'px-2 py-0.5 border text-[11px] uppercase tracking-wider ' +
                      getConditionBadgeClasses(item.condition)
                    }
                  >
                    {item.condition}
                  </span>

                  <div class="flex items-center gap-3">
                    <span class="text-[#1C1A17] font-semibold">
                      {formatGrams(item.weightGrams)}
                    </span>
                    <span class="text-[11px] uppercase tracking-widest text-[#6E2B25] group-hover:underline underline-offset-4">
                      Inspect →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div class="border border-[#1C1A17]/20 bg-[#D8CEB8]/25 p-6 font-mono text-xs text-[#524D46]">
            No items currently assigned to this slot.
          </div>
        )}
      </section>
    ))}
  </div>

  <!-- Interactive Item Inspection Modal -->
  <div
    id="inventory-modal-backdrop"
    class="fixed inset-0 z-50 hidden items-center justify-center bg-[#1C1A17]/75 backdrop-blur-[2px] p-4 sm:p-6 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-item-name"
  >
    <!-- Washi Parchment Modal Box with Double #6E2B25 and #1C1A17 Frame -->
    <div
      id="inventory-modal-panel"
      class="relative w-full max-w-2xl bg-[#E6DFCF] text-[#1C1A17] border-2 border-[#1C1A17] p-1.5 shadow-2xl my-auto"
    >
      <div class="border-2 border-[#6E2B25] p-5 sm:p-8">
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-[#6E2B25]">
          <div class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#6E2B25]">
            <span>印</span>
            <span id="modal-item-slot">Equipped</span>
          </div>

          <button
            id="modal-close-btn"
            type="button"
            class="border border-[#1C1A17]/40 hover:border-[#6E2B25] bg-[#D8CEB8]/50 hover:bg-[#6E2B25] text-[#1C1A17] hover:text-[#E6DFCF] font-mono text-xs uppercase tracking-widest px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E2B25]"
          >
            Close [ESC]
          </button>
        </div>

        <!-- Modal Header: Icon + Titles + Weight & Condition -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1C1A17]/15">
          <div class="flex items-center gap-4">
            <div
              id="modal-item-icon"
              class="w-16 h-16 shrink-0 border border-[#6E2B25] bg-[#D8CEB8]/50 flex items-center justify-center text-[#6E2B25] p-3"
            ></div>
            <div>
              <p
                id="modal-item-jp"
                class="font-jp text-sm tracking-[0.2em] text-[#6E2B25] mb-0.5"
              ></p>
              <h2
                id="modal-item-name"
                class="font-heading text-2xl sm:text-3xl font-bold text-[#1C1A17] leading-tight"
              ></h2>
            </div>
          </div>

          <div class="flex sm:flex-col items-baseline sm:items-end justify-between gap-2 font-mono border-t sm:border-t-0 pt-3 sm:pt-0 border-[#1C1A17]/15">
            <span
              id="modal-item-weight"
              class="text-lg sm:text-xl font-bold text-[#1C1A17]"
            ></span>
            <span
              id="modal-item-condition"
              class="px-2.5 py-0.5 border text-xs uppercase tracking-wider"
            ></span>
          </div>
        </div>

        <!-- Philosophical & Practical Lore -->
        <div class="py-6 border-b border-[#1C1A17]/15">
          <div class="flex items-baseline justify-between mb-2">
            <h3 class="font-mono text-xs uppercase tracking-widest text-[#524D46]">
              Field Lore &amp; Justification of Weight
            </h3>
            <span class="font-jp text-xs text-[#6E2B25]">由緒・考察</span>
          </div>
          <p
            id="modal-item-lore"
            class="font-body text-base sm:text-lg text-[#1C1A17] leading-relaxed"
          ></p>
        </div>

        <!-- Technical Specifications Table -->
        <div class="pt-6">
          <div class="flex items-baseline justify-between mb-3">
            <h3 class="font-mono text-xs uppercase tracking-widest text-[#524D46]">
              Item Specifications
            </h3>
            <span class="font-jp text-xs text-[#524D46]">仕様明細</span>
          </div>

          <div class="border border-[#1C1A17]/25 bg-[#D8CEB8]/35">
            <table class="w-full text-left border-collapse">
              <tbody
                id="modal-item-specs"
                class="divide-y divide-[#1C1A17]/15 text-sm"
              ></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Serialize Inventory Data for Zero-Latency Client Inspection -->
  <script
    id="inventory-items-json"
    type="application/json"
    set:html={JSON.stringify(items)}
  ></script>

  <script is:inline>
    (function () {
      const dataEl = document.getElementById('inventory-items-json');
      if (!dataEl) return;

      let inventoryItems = [];
      try {
        inventoryItems = JSON.parse(dataEl.textContent || '[]');
      } catch (e) {
        console.error('Failed to parse inventory items JSON', e);
      }

      const itemsById = {};
      inventoryItems.forEach(function (item) {
        if (item && item.id) {
          itemsById[item.id] = item;
        }
      });

      const backdrop = document.getElementById('inventory-modal-backdrop');
      const closeBtn = document.getElementById('modal-close-btn');
      const slotEl = document.getElementById('modal-item-slot');
      const iconEl = document.getElementById('modal-item-icon');
      const jpEl = document.getElementById('modal-item-jp');
      const nameEl = document.getElementById('modal-item-name');
      const weightEl = document.getElementById('modal-item-weight');
      const conditionEl = document.getElementById('modal-item-condition');
      const loreEl = document.getElementById('modal-item-lore');
      const specsTbody = document.getElementById('modal-item-specs');
      const tileButtons = document.querySelectorAll('.inventory-slot-tile');

      let lastFocusedElement = null;

      function getConditionClasses(condition) {
        switch (condition) {
          case 'Pristine':
            return 'px-2.5 py-0.5 border text-xs uppercase tracking-wider border-[#1C1A17]/40 bg-[#D8CEB8]/70 text-[#1C1A17]';
          case 'Seasoned':
            return 'px-2.5 py-0.5 border text-xs uppercase tracking-wider border-[#6E2B25]/50 bg-[#6E2B25]/10 text-[#6E2B25]';
          case 'Worn':
            return 'px-2.5 py-0.5 border text-xs uppercase tracking-wider border-[#6E2B25] bg-[#6E2B25]/20 text-[#6E2B25] font-semibold';
          case 'Need Replacement':
            return 'px-2.5 py-0.5 border text-xs uppercase tracking-wider border-[#6E2B25] bg-[#6E2B25] text-[#E6DFCF] font-semibold';
          default:
            return 'px-2.5 py-0.5 border text-xs uppercase tracking-wider border-[#1C1A17]/30 bg-[#D8CEB8]/40 text-[#524D46]';
        }
      }

      function openModal(itemId, triggerEl) {
        const item = itemsById[itemId];
        if (!item || !backdrop) return;

        lastFocusedElement = triggerEl || document.activeElement;

        if (slotEl) slotEl.textContent = item.slot || 'Equipment';
        if (jpEl) jpEl.textContent = item.japaneseName || '';
        if (nameEl) nameEl.textContent = item.name || '';

        const grams = Number(item.weightGrams || 0);
        const kg = (grams / 1000).toFixed(2);
        if (weightEl) {
          weightEl.textContent = grams.toLocaleString('en-US') + ' g (' + kg + ' kg)';
        }

        if (conditionEl) {
          conditionEl.textContent = item.condition || 'Seasoned';
          conditionEl.className = getConditionClasses(item.condition);
        }

        if (loreEl) {
          loreEl.textContent = item.lore || item.shortSummary || '';
        }

        if (iconEl) {
          const rawIcon = String(item.icon || '印').trim();
          if (rawIcon.indexOf('<svg') === 0) {
            iconEl.innerHTML = '<div class="w-10 h-10">' + rawIcon + '</div>';
          } else {
            iconEl.textContent = rawIcon;
          }
        }

        if (specsTbody) {
          specsTbody.innerHTML = '';
          const specsObj = item.specs || {};
          const keys = Object.keys(specsObj);
          if (keys.length > 0) {
            keys.forEach(function (key) {
              const tr = document.createElement('tr');
              const th = document.createElement('th');
              th.className =
                'py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-[#524D46] bg-[#D8CEB8]/45 w-1/3 border-r border-[#1C1A17]/15';
              th.textContent = key;

              const td = document.createElement('td');
              td.className = 'py-2.5 px-4 font-body text-sm sm:text-base text-[#1C1A17]';
              td.textContent = String(specsObj[key] || '');

              tr.appendChild(th);
              tr.appendChild(td);
              specsTbody.appendChild(tr);
            });
          } else {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.className = 'py-3 px-4 font-mono text-xs text-[#524D46]';
            td.textContent = 'Standard pilgrimage specification.';
            tr.appendChild(td);
            specsTbody.appendChild(tr);
          }
        }

        backdrop.classList.remove('hidden');
        backdrop.classList.add('flex');
        document.body.style.overflow = 'hidden';

        if (closeBtn) {
          closeBtn.focus();
        }
      }

      function closeModal() {
        if (!backdrop || backdrop.classList.contains('hidden')) return;
        backdrop.classList.add('hidden');
        backdrop.classList.remove('flex');
        document.body.style.overflow = '';

        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
          lastFocusedElement.focus();
        }
      }

      tileButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const itemId = btn.getAttribute('data-item-id');
          if (itemId) {
            openModal(itemId, btn);
          }
        });
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }

      if (backdrop) {
        backdrop.addEventListener('click', function (event) {
          if (event.target === backdrop) {
            closeModal();
          }
        });
      }

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          closeModal();
        }
      });
    })();
  </script>
</BaseLayout>
`;

const filesToWrite = {
  'src/data/inventory.json': JSON.stringify(inventoryData, null, 2) + '\n',
  'src/pages/inventory.astro': inventoryAstroContent,
};

for (const [relativePath, content] of Object.entries(filesToWrite)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${relativePath}`);
}

console.log('\nMilestone 2 (RPG Gear Inventory) complete! Run npm run dev and visit http://localhost:4321/inventory');