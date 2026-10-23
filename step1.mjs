import fs from 'node:fs';
import path from 'node:path';

const files = {
  'package.json': JSON.stringify(
    {
      name: 'camino-henro',
      type: 'module',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'astro dev',
        start: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
      },
      dependencies: {
        astro: '^4.15.0',
        '@astrojs/tailwind': '^5.1.0',
        tailwindcss: '^3.4.10',
      },
    },
    null,
    2
  ),

  'astro.config.mjs': `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  integrations: [tailwind()],
});
`,

  'tailwind.config.mjs': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'washi': '#E6DFCF',
        'washi-dark': '#D8CEB8',
        'sumi': '#1C1A17',
        'sumi-muted': '#524D46',
        'crimson': '#6E2B25',
        'crimson-light': '#8C3B33',
      },
      fontFamily: {
        'jp': ['"Shippori Mincho"', '"Noto Serif JP"', 'serif'],
        'heading': ['"Cormorant Garamond"', 'Georgia', 'serif'],
        'body': ['"EB Garamond"', 'Georgia', 'serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
`,

  'tsconfig.json': JSON.stringify(
    {
      extends: 'astro/tsconfigs/strict',
    },
    null,
    2
  ),

  'src/data/siteConfig.json': JSON.stringify(
    {
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
        enableForum: false,
      },
    },
    null,
    2
  ),

  'public/assets/crest.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <g fill="none" stroke="#6E2B25" stroke-linecap="round" stroke-linejoin="round">
    <!-- Outer and Inner Circular Stamp Borders -->
    <circle cx="120" cy="120" r="110" stroke-width="6" />
    <circle cx="120" cy="120" r="102" stroke-width="2" stroke-dasharray="14 6 4 6" />

    <!-- Crossed Pilgrim Staves (Kongozue) -->
    <line x1="52" y1="192" x2="188" y2="56" stroke-width="6" />
    <line x1="188" y1="192" x2="52" y2="56" stroke-width="6" />
    <!-- Staff Top Notches -->
    <line x1="176" y1="62" x2="182" y2="68" stroke-width="3" />
    <line x1="64" y1="62" x2="58" y2="68" stroke-width="3" />

    <!-- Woven Sedge Hat (Sugegasa) Silhouette at Top -->
    <path d="M 48 86 L 120 38 L 192 86 Q 120 74 48 86 Z" fill="#6E2B25" stroke="#6E2B25" stroke-width="3" />
    <path d="M 88 60 Q 120 53 152 60" stroke="#E6DFCF" stroke-width="2" />
    <path d="M 68 73 Q 120 64 172 73" stroke="#E6DFCF" stroke-width="2" />

    <!-- Camino Scallop Shell in Center -->
    <path d="M 120 182 L 74 134 C 68 106 94 94 120 94 C 146 94 172 106 166 134 Z" fill="#E6DFCF" stroke="#6E2B25" stroke-width="4.5" />
    <!-- Scallop Shell Ribs -->
    <line x1="120" y1="182" x2="120" y2="94" stroke-width="3" />
    <line x1="120" y1="182" x2="103" y2="97" stroke-width="2.5" />
    <line x1="120" y1="182" x2="87" y2="106" stroke-width="2.5" />
    <line x1="120" y1="182" x2="77" y2="120" stroke-width="2.5" />
    <line x1="120" y1="182" x2="137" y2="97" stroke-width="2.5" />
    <line x1="120" y1="182" x2="153" y2="106" stroke-width="2.5" />
    <line x1="120" y1="182" x2="163" y2="120" stroke-width="2.5" />
    <!-- Scallop Base Ears -->
    <path d="M 105 178 L 135 178 L 130 188 L 110 188 Z" fill="#6E2B25" stroke-width="2" />
  </g>
</svg>
`,

  'public/assets/apple-bg.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="duskSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B0B0A" />
      <stop offset="60%" stop-color="#191714" />
      <stop offset="100%" stop-color="#24201B" />
    </linearGradient>
    <linearGradient id="earthRoad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#221E1A" />
      <stop offset="45%" stop-color="#2D2721" />
      <stop offset="100%" stop-color="#1A1714" />
    </linearGradient>
    <radialGradient id="appleSurface" cx="38%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#F7DB74" />
      <stop offset="55%" stop-color="#E5B842" />
      <stop offset="100%" stop-color="#B0821E" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="55%" r="70%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.65" />
    </radialGradient>
  </defs>

  <!-- Sky and Distant Horizon -->
  <rect width="1920" height="420" fill="url(#duskSky)" />
  <path d="M 0 420 Q 320 350 680 410 T 1280 395 T 1920 420 L 1920 450 L 0 450 Z" fill="#141210" />

  <!-- Dark Textured Shoulder / Fields -->
  <rect y="420" width="1920" height="660" fill="#151310" />

  <!-- Receding Unpaved Earthen Road -->
  <polygon points="890,420 1030,420 1740,1080 180,1080" fill="url(#earthRoad)" />

  <!-- Subtle Wheel Ruts and Stone Texture Lines -->
  <path d="M 915 420 Q 820 740 420 1080" stroke="#181512" stroke-width="18" fill="none" opacity="0.6" />
  <path d="M 1005 420 Q 1100 740 1500 1080" stroke="#181512" stroke-width="18" fill="none" opacity="0.6" />
  <path d="M 960 420 L 960 1080" stroke="#3A322A" stroke-width="2" stroke-dasharray="12 28" fill="none" opacity="0.25" />

  <!-- Pebbles on the Earthen Road -->
  <g fill="#3D352E" opacity="0.55">
    <ellipse cx="780" cy="650" rx="8" ry="4" />
    <ellipse cx="1140" cy="710" rx="11" ry="5" />
    <ellipse cx="640" cy="830" rx="14" ry="6" />
    <ellipse cx="1290" cy="880" rx="16" ry="7" />
    <ellipse cx="850" cy="760" rx="7" ry="3" />
    <ellipse cx="1060" cy="620" rx="6" ry="3" />
    <ellipse cx="910" cy="890" rx="12" ry="5" />
  </g>

  <!-- Soft Ground Shadow Beneath the Apple -->
  <ellipse cx="960" cy="719" rx="46" ry="13" fill="#0B0A08" opacity="0.8" />

  <!-- Warm Golden-Yellow Apple in the Lower-Middle Third -->
  <circle cx="960" cy="680" r="42" fill="url(#appleSurface)" stroke="#8F6814" stroke-width="1.5" />
  <!-- Apple Calyx Dimple -->
  <path d="M 948 643 Q 960 651 972 643" stroke="#7A5710" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <!-- Stem -->
  <path d="M 960 647 Q 962 631 970 624" stroke="#4A3520" stroke-width="4" fill="none" stroke-linecap="round" />
  <!-- Small Leaf -->
  <path d="M 963 633 Q 985 620 994 634 Q 979 646 963 633 Z" fill="#5E6F3A" stroke="#3D4A24" stroke-width="1.2" />

  <!-- Atmospheric Vignette -->
  <rect width="1920" height="1080" fill="url(#vignette)" />
</svg>
`,

  '.pages.yml': `media:
  name: assets
  label: Site & Essay Media
  input: public/assets
  output: /assets

content:
  - name: essays
    label: Essays & Dispatches
    type: collection
    path: src/content/essays
    filename: "{year}-{month}-{day}-{primary}.md"
    view:
      primary: title
      fields: [title, location, date, draft]
      sort: [date]
      order: desc
    fields:
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
            label: Show RPG Inventory Page
            type: boolean
          - name: enableMap
            label: Show Interactive Map Page
            type: boolean
          - name: enableForum
            label: Show Community Forum Page
            type: boolean
`,
};

// Also copy the SVG placeholders to fallback filenames as requested
files['public/assets/crest.png'] = files['public/assets/crest.svg'];
files['public/assets/apple-bg.jpeg'] = files['public/assets/apple-bg.svg'];

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${relativePath}`);
}

console.log('\nStep 1A scaffolding complete! Now run: npm install');