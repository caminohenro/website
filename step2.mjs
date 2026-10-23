import fs from 'node:fs';
import path from 'node:path';

const files = {
  'src/content/config.ts': `import { defineCollection, z } from 'astro:content';

const essays = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    location: z.string(),
    kilometersWalked: z.number().optional(),
    readingTime: z.string().optional(),
    excerpt: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { essays };
`,

  'src/content/essays/2026-10-10-the-end-of-the-earth.md': `---
title: "At the Zero Kilometer Stone"
subtitle: "Standing at Cape Finisterra and turning eastward toward Japan"
date: 2026-10-10
location: "Finisterra, Galicia, Spain"
kilometersWalked: 0
readingTime: "6 min read"
excerpt: "Where the medieval pilgrims ended their walk at the Atlantic cliffs, another question begins: what does it actually require to feel secure in the world?"
draft: false
---

For centuries, the granite promontory of Cape Finisterra marked the *Finis Terrae*—the literal edge of the known world. Walkers who had crossed the Pyrenees and the dusty plains of Castile arrived at these wind-scoured cliffs to burn their worn boots, wash their hands in the cold Atlantic surf, and gaze out at a horizon that offered no further road. To stand by the zero-kilometer stone at dusk is to feel the strange gravity of endings. Yet as I tightened the straps of my pack this morning and turned my back to the ocean, the stone beneath my sandals felt less like a terminus and more like a threshold. If the medieval pilgrim walked westward to lay down the weight of a past life, turning eastward across the whole breadth of Eurasia asks a different question altogether: how does one walk back into the world without being owned by its anxieties?

Everything I now possess rests against my shoulder blades. A woven sedge hat, a spare tunic, a sleeping quilt, a brass needle, a notebook, and a vessel for water. In modern life, we are taught that material security is an architectural project—a fortress built from savings accounts, insurance policies, redundancies, and locked doors. We accumulate layers of insulation between ourselves and contingency until the sheer maintenance of the fortress consumes the very life it was meant to protect. When you reduce your household to what your own two legs can carry over mountain passes for ten thousand kilometers, that architecture dissolves overnight. You discover quickly that security cannot be carried in a rucksack; if it exists at all, it must be a quality of relationship between the walker and the ground beneath.

> "To carry only what fits upon your back is not an act of deprivation; it is the quiet admission that the world outside your pack is already full of provision, if only you remain porous enough to meet it."

Far to the east, across the Pyrenees, the steppes, and the inland seas, lies the island of Shikoku and its eighty-eight temples. There, pilgrims walk in a circle under the vow of *Dōgyō Ninin*—the understanding that even when walking alone, one always walks in the company of something larger than oneself. By linking the ancient European Camino to the Shikoku Henro by a continuous thread of footsteps, this journey is an attempt to test a simple hypothesis in the laboratory of the open road. Perhaps human society, money, and strangers are not hostile forces we must armor ourselves against, but expressions of Nature itself—no different from rain, shade, or a wild fig tree beside the path.

Tonight, the beam of the Finisterra lighthouse sweeps rhythmically over the dark gorse and wet granite. Tomorrow, the path leads back through Cee, toward Santiago, and then onward against the flow of westbound pilgrims toward the rising sun. Fifteen thousand kilometers is an absurd distance to contemplate all at once, just as an entire human lifespan is an absurd thing to secure in advance. Fortunately, the road never asks you to walk fifteen thousand kilometers; it only asks where you will place your next step when morning comes.
`,

  'src/content/essays/2026-10-14-two-traditions-of-alms.md': `---
title: "Two Traditions of Alms: Donativo and Osettai"
subtitle: "On reciprocity, trust, and the economy of the road"
date: 2026-10-14
location: "Cee, Galicia, Spain"
kilometersWalked: 18
readingTime: "5 min read"
excerpt: "An inquiry into how strangers sustain a walker across continents, and why the road demands a different ledger than modern commerce."
draft: false
---

Just outside the coastal town of Cee, an elderly woman stood beside a stone wall with a basket of small, rain-speckled apples and a thermos of hot mint infusion. She did not have a sign with prices, nor a tin cup rattling for coins. When I bowed my head beneath the brim of my hat to thank her, she simply pressed two apples into my palm, pointed eastward up the muddy incline, and said, *Buen Camino*. On the Iberian paths, this quiet economy is known as *donativo*—that which is given according to the heart and capacity of the giver, and received according to the genuine need of the traveler. It is a transaction that leaves no receipt, yet lingers in the memory long after every commercial purchase has been forgotten.

Modern commerce is designed to sever obligation at the exact moment of payment. You hand banknotes across a counter, receive your loaf of bread, and walk away owing nothing to the baker; both parties remain strangers, their ledgers balanced to zero. The economy of the pilgrimage operates on the opposite premise. When you accept a bowl of soup at a parochial *albergue* in Spain, or when a farmer on the island of Shikoku runs out to offer *Osettai* (お接待)—a tangerine, a cup of green tea, or a folded coin envelope—to a passing *henro*, the exchange deliberately leaves the ledger open. You cannot pay back the person who fed you today; you can only carry their goodwill forward into the next valley.

> "Commerce settles the score so that strangers may remain independent; alms leave the score unsettled so that strangers remember they belong to one another."

In Japan, the custom of *Osettai* is understood not as charity bestowed upon a beggar, but as a mutual participation in the pilgrimage itself. The householder who tends his fields and cannot leave his village offers sustenance to the walker, and through that gift, his spirit travels a few kilometers down the road inside the pilgrim's footsteps. In return, the pilgrim offers the householder the opportunity to practice generosity and remain connected to the wider horizon. Neither party is superior; both are necessary halves of a single movement.

As I walk toward the eastern edge of Asia, keeping an open financial ledger on this platform is my way of honoring both *donativo* and *Osettai*. Every euro contributed and every euro spent on bread, oats, or a dry bunk is inscribed in plain sight—not as an accounting exercise for its own sake, but as a record of shared trust. When we strip away the anonymity of money, we begin to see that every meal and every roof is a direct bridge between human beings who have chosen to trust one another across the dark.
`,

  'src/data/finances.json': JSON.stringify(
    {
      currencySymbol: '€',
      startingReserve: 1200.00,
      lastUpdated: '2026-10-16',
      note: 'Every euro received as Osettai and every euro allocated along the journey is recorded openly in this ledger.',
      entries: [
        {
          id: 'fin-001',
          date: '2026-10-10',
          type: 'osettai',
          category: 'Patron Contribution',
          description: 'Initial blessing from supporter M.',
          location: 'Santiago de Compostela, Spain',
          amount: 50.00,
        },
        {
          id: 'fin-002',
          date: '2026-10-12',
          type: 'expense',
          category: 'Food & Provisions',
          description: 'Bread, cheese, dried figs, and oats for 3 days',
          location: 'Cee, Spain',
          amount: 18.40,
        },
        {
          id: 'fin-003',
          date: '2026-10-14',
          type: 'expense',
          category: 'Shelter',
          description: 'Municipal albergue pilgrim bunk',
          location: 'Finisterra, Spain',
          amount: 15.00,
        },
      ],
    },
    null,
    2
  ),

  'src/data/faq.json': JSON.stringify(
    {
      categories: [
        {
          categoryName: 'The Route & Logistics',
          items: [
            {
              question: 'Where are you from?',
              answer: 'I began this walk from the western coast of the Iberian Peninsula, carrying the cultural memory of the European Camino in my steps. Though I grew up along the Atlantic edge of Europe, on the road my home is simply wherever I unroll my sleeping mat at dusk.',
            },
            {
              question: 'How many kilometers/days to Japan?',
              answer: 'The overland corridor from Cape Finisterra in Spain to the eighty-eight temples of Shikoku spans roughly 14,500 to 16,000 kilometers depending on seasonal mountain passes. Walking at a steady pace with rest days for writing and winter shelter, the journey will unfold over two to three years.',
            },
            {
              question: 'What route will you take to Japan? How will you cross the ocean?',
              answer: 'The route traces the historic Camino ways through Spain and France, crosses Italy and the Balkans into Turkey and the Caucasus, and follows the ancient Silk Road corridors across Central Asia and East Asia. Where land meets the sea between the Asian mainland and Japan, I will cross by surface ferry rather than aircraft to keep the thread of the journey unbroken.',
            },
          ],
        },
        {
          categoryName: 'Philosophy & Material Security',
          items: [
            {
              question: 'Why are you doing this trip?',
              answer: 'I am walking to investigate a foundational question: what does it truly require for a human being to feel materially secure in this world? By stepping outside modern systems of accumulation and walking across Eurasia with only a light pack, I want to experience firsthand how human society and provision function as an extension of Nature.',
            },
            {
              question: "Why Japan / What's in Japan?",
              answer: 'Shikoku, Japan is home to the 1,200-year-old Henro pilgrimage, one of the few living sibling traditions to the Camino de Santiago. Walking from the traditional end of the Camino at Finisterra to the circular pilgrimage of Shikoku unites the two great walking traditions of West and East into a single philosophical inquiry.',
            },
            {
              question: 'What about money? How do you fund your trip?',
              answer: 'I started with a modest initial reserve and live as simply as possible on the trail—sleeping in bivy sacks, pilgrim hostels, or temple courtyards and eating simple staples. Along the way, the journey is sustained by the hospitality of strangers and voluntary Osettai (pilgrimage alms), all of which are transparently documented in the Open Financial Ledger.',
            },
          ],
        },
        {
          categoryName: 'Daily Life on the Trail',
          items: [
            {
              question: 'How many languages do you speak?',
              answer: 'I speak Portuguese, Spanish, and English fluently, along with conversational French and basic Japanese phrases that I study as I walk eastward. Beyond grammar, however, a respectful bow, an open palm, and shared silence translate effortlessly across every border.',
            },
            {
              question: 'What do your parents/partner think about this?',
              answer: 'Like anyone who loves a traveler, their initial reaction mingled natural worry for my safety with deep respect for the calling. As each week passes and dispatches arrive from the road, their apprehension has gradually transformed into quiet companionship from afar.',
            },
            {
              question: 'You walk with these sandals?! 🩴',
              answer: 'Yes—lightweight minimalist trail sandals paired with wool tabi socks when the weather turns cold or wet. Unlike heavy leather boots that trap moisture and cause blisters over thousands of kilometers, open sandals dry in minutes, strengthen the foot naturally, and can be repaired with a simple length of cordage.',
            },
          ],
        },
      ],
    },
    null,
    2
  ),

  'src/data/credits.json': JSON.stringify(
    {
      sections: [
        {
          title: 'Trail Hosts & Roadside Angels',
          entries: [
            {
              name: 'Doña Carmen',
              locationOrRole: 'Cee, Galicia, Spain',
              date: '2026-10-12',
              note: 'For two crisp apples, hot mint tea by the stone wall, and a warm blessing during an autumn downpour.',
            },
            {
              name: 'Hospitalero Mateo',
              locationOrRole: 'Finisterra Municipal Albergue, Spain',
              date: '2026-10-10',
              note: 'For keeping the drying room warm and sharing stories of winter walkers who turned back toward the east.',
            },
          ],
        },
        {
          title: 'Osettai Supporters & Patrons',
          entries: [
            {
              name: 'Supporter M.',
              locationOrRole: 'Santiago de Compostela, Spain',
              date: '2026-10-10',
              note: 'For offering the very first Osettai contribution at the beginning of the eastward road.',
            },
            {
              name: 'Anonymous Reader',
              locationOrRole: 'Lisbon, Portugal',
              date: '2026-10-15',
              note: 'For the kind words of encouragement and support for the pilgrimage archive.',
            },
          ],
        },
        {
          title: 'Technical & Creative Collaborators',
          entries: [
            {
              name: 'Architecture & Scroll Design',
              locationOrRole: 'Astro & Washi Emakimono System',
              date: '2026-10-10',
              note: 'Crafted to ensure dispatches can be written and published from any trailside phone or village library across Eurasia.',
            },
            {
              name: 'Open Source Cartography & Fonts',
              locationOrRole: 'Shippori Mincho, Cormorant Garamond & EB Garamond',
              date: '2026-10-10',
              note: 'For the typographic craft that brings traditional Japanese and European editorial print to the screen.',
            },
          ],
        },
      ],
    },
    null,
    2
  ),
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${relativePath}`);
}

console.log('\nStep 1B complete! Content Collections, sample essays, and JSON data files are ready.');