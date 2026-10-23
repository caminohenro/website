# CAMINO HENRO (カミノ遍路) — Master Technical & Design Specification (`SPEC.md`)

## 1. Project Overview & Core Philosophy
- **Title:** カミノ遍路 / CAMINO HENRO
- **Tagline:** "From the End of the Earth to the Land of the Rising Sun"
- **Author / Pilgrim Alias:** Henro
- **Concept:** A philosophical pilgrimage journal and dispatch platform documenting a continuous walk across Eurasia from Finisterra, Spain to Shikoku, Japan in search of a strong foundation for a sense of material security in life.
- **Primary User Actions (in strict priority order):**
  1. **Read** long-form philosophical essays in a distraction-free, meditative layout.
  2. **Share** essays effortlessly via direct link copy, native mobile share sheet, or social platforms.
  3. **Support** the pilgrimage via *Osettai* (traditional pilgrimage alms) linking to Stripe.

---

## 2. Tech Stack & Architecture Rules
- **Framework:** Astro (latest stable, static output `output: 'static'`) + Tailwind CSS.
- **Zero-Backend Data Architecture:**
  - All essays are Markdown files inside `src/content/essays/`.
  - All structured data lives in local JSON files inside `src/data/` (`siteConfig.json`, `finances.json`, `faq.json`, `credits.json`, `inventory.json`, `route.json`).
  - Mobile/trail publishing is powered by **PagesCMS** via a root `.pages.yml` file committed to the repository.
- **Asset Initialization Instruction for Agent:**
  - Check `./assets-to-use/` in the workspace root.
  - Copy `apple-bg.jpeg` and any crest/logo image found in `./assets-to-use/` into `public/assets/`.
  - If the crest filename differs, normalize or reference it cleanly in `siteConfig.json` (`crestImage: "/assets/..."`). If no crest image is present yet, render an SVG placeholder seal combining a woven sedge hat (*sugegasa*), scallop shell, and crossed pilgrim staves in `#6E2B25`.

---

## 3. Visual Aesthetic, Color Palette & Scroll Physics (*Emakimono* Layout)

### 3.1 Color Tokens
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `washi` | `#E6DFCF` | Central scrolling parchment column background & modal surfaces |
| `washi-dark` | `#D8CEB8` | Subtle card backgrounds, table header fills, and hover states |
| `sumi` | `#1C1A17` | Primary body ink, headings, and primary iconography |
| `sumi-muted` | `#524D46` | Metadata, dates, coordinates, footnotes, and captions |
| `crimson` | `#6E2B25` | Aged Bengala Crimson — dividers, stamps, active states, and primary CTA buttons |
| `crimson-light` | `#8C3B33` | Button hover state and highlighted links |

### 3.2 Typography
Load from Google Fonts in `src/layouts/BaseLayout.astro`:
- **Japanese Display & Titles:** `'Shippori Mincho'`, `'Noto Serif JP'`, serif
- **English Headings:** `'Cormorant Garamond'`, Georgia, serif (semi-bold, tracked slightly wide)
- **Long-Form Essay Body:** `'EB Garamond'` or `'Newsreader'`, Georgia, serif (`1.2rem` / `19.2px` desktop, `1.125rem` / `18px` mobile, `line-height: 1.85`)
- **Ledger, Coordinates & RPG Stats:** `'JetBrains Mono'`, monospace

### 3.3 The Fixed Background & Bottom Apple Reveal Mechanic
Inspired by *miracleproject.earth* and traditional Japanese *emakimono* (vertical picture scrolls):
1. **Stationary Background Layer (`.fixed-landscape`):**
   - `position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none;`
   - Uses `/assets/apple-bg.jpeg` with `background-size: cover; background-position: center center; background-repeat: no-repeat;`
   - Apply a subtle darkened atmospheric overlay (`background: rgba(28, 26, 23, 0.22);`) so the side margins frame the bright parchment scroll without hiding the road texture.
2. **Central *Washi* Scroll Column (`.washi-scroll-column`):**
   - Centered horizontally in the viewport: `position: relative; z-index: 10; width: 100%; max-width: 46rem; margin: 0 auto; background-color: #E6DFCF; color: #1C1A17;`
   - Because the yellow apple in `apple-bg.jpeg` sits in the middle third of the image, this centered `46rem` (`736px`) column naturally covers the apple on standard desktop and mobile screens while reading.
   - **Containerless Feel:** No rounded plastic card corners (`border-radius: 0`), no heavy drop shadows—only subtle 1px vertical hairline borders (`rgba(28, 26, 23, 0.18)`) and a subtle CSS paper grain texture overlay.
3. **The Bottom Reveal Spacer (`.apple-reveal-window`):**
   - Placed immediately after the closing `</footer>` of `.washi-scroll-column` on every page.
   - `height: 90vh; width: 100%; background: transparent; pointer-events: none; position: relative; z-index: 1;`
   - As the reader scrolls past the footer at the bottom of any page, the `#E6DFCF` parchment scroll slides completely up and out of the middle third of the viewport, uncovering the centered yellow apple on the unpaved road.
   - Include a small, subtle scroll hint in the footer (`"↓ Scroll past the scroll's end"` / `"巻末の林檎"` in muted ink) so curious readers discover the apple.

---

## 4. Modular Feature Flag System (`src/data/siteConfig.json`)

Create `src/data/siteConfig.json` so Edition 2 pages can be toggled on at any time without code rewrites:

```json
{
  "siteTitleJp": "カミノ遍路",
  "siteTitleEn": "CAMINO HENRO",
  "tagline": "From the End of the Earth to the Land of the Rising Sun",
  "pilgrimAlias": "Henro",
  "routeSummary": "Finisterra, Spain → Shikoku, Japan",
  "currentLocation": "Finisterra, Galicia, Spain",
  "crestImage": "/assets/crest.png",
  "backgroundImage": "/assets/apple-bg.jpeg",
  "stripeDonationUrl": "https://buy.stripe.com/test_placeholder",
  "giscus": {
    "repo": "YOUR_GITHUB_USERNAME/camino-henro",
    "repoId": "",
    "category": "General",
    "categoryId": ""
  },
  "features": {
    "enableInventory": false,
    "enableMap": false,
    "enableForum": false
  }
}
```

- **Navigation Bar Behavior:**
  - Always display Edition 1 links: **Home** (`/`), **Essays** (`/essays`), **Finances** (`/finances`), **FAQ** (`/faq`), **Credits** (`/credits`), and **Osettai / Donate** (`/donate` — styled with a subtle `#6E2B25` Bengala Crimson border seal).
  - Automatically display **Inventory** (`/inventory`) if `features.enableInventory === true`.
  - Automatically display **Map** (`/map`) if `features.enableMap === true`.
  - Automatically display **Forum** (`/forum`) if `features.enableForum === true`.

---

## 5. Milestone-by-Milestone Build Specifications

### MILESTONE 1: Edition 1 Complete (6 Core Pages + Data Schemas + PagesCMS)

#### 5.1.1 Home Page (`src/pages/index.astro`)
- **Hero Header:**
  - Circular pilgrim crest stamp centered at top.
  - Dual-language title: `カミノ遍路` above `CAMINO HENRO` in large serif display, followed by `"From the End of the Earth to the Land of the Rising Sun"`.
  - Aged Bengala Crimson (`#6E2B25`) horizontal ornamental rule.
- **Expedition Status Strip:**
  - Compact 3-column metadata bar in monospace font showing: `CURRENT STAGE` (from `siteConfig.json`), `TRAIL RESERVES` (dynamically calculated from `finances.json`), and `LATEST DISPATCH`.
- **The Manifesto Section:**
  - Structured long-form philosophical introduction explaining the walk from Finisterra to Shikoku and the inquiry into material security. (Populate from user's text in `./assets-to-use/` if present, otherwise use rich, editable initial copy).
- **Recent Dispatches (Essay Stream):**
  - Lists the 4 most recent non-draft essays from `src/content/essays/` with publication date, location, kilometer marker, title, excerpt, and a `"Read Dispatch →"` link.
- **Bottom Osettai Callout:**
  - A dignified invitation to support the walk via *Osettai* or share the dispatches with a friend.

#### 5.1.2 Blog / Essays Archive (`src/pages/essays/index.astro`) & Essay Reader (`src/pages/essays/[...slug].astro`)
- **Content Collection (`src/content/config.ts` & `src/content/essays/*.md`):**
  - Frontmatter fields:
    - `title` (string, required)
    - `subtitle` (string, optional)
    - `date` (date, required)
    - `location` (string, e.g., `"Finisterra, Spain"`)
    - `kilometersWalked` (number, optional)
    - `readingTime` (string, optional, or auto-calculated)
    - `excerpt` (string, required)
    - `draft` (boolean, default `false`)
  - Include 2 sample philosophical essays in `src/content/essays/` (or import user drafts from `./assets-to-use/`).
- **Distraction-Free Essay Reader (`/essays/[...slug]`):**
  - Minimal top breadcrumb (`← Back to Dispatches`).
  - Essay header with Japanese-style vertical or stamped date/location metadata, title, and subtitle.
  - Generous typographic measure (`60ch–65ch`), drop-cap on the first paragraph in `#6E2B25`, and clean blockquote styling.
  - **Share & Osettai Bar at Essay End:**
    1. **Share Dispatch:** `"Copy Direct Link"` button (with `"Link Copied"` toast confirmation), Native Mobile Share button (`navigator.share`), plus direct share links for X/Twitter, Reddit, and Email.
    2. **Offer Osettai:** Secondary button linking to `/donate` or directly to the Stripe URL.
    3. **Next / Previous Essay** navigation links.

#### 5.1.3 Open Financial Ledger (`src/pages/finances.astro` & `src/data/finances.json`)
- **Schema (`src/data/finances.json`):**
  ```json
  {
    "currencySymbol": "€",
    "startingReserve": 1200.00,
    "lastUpdated": "2026-10-16",
    "note": "Every euro received as Osettai and every euro spent on food, shelter, and gear replacement is recorded openly.",
    "entries": [
      {
        "id": "fin-001",
        "date": "2026-10-10",
        "type": "osettai",
        "category": "Patron Contribution",
        "description": "Initial trail blessing from supporter M.",
        "location": "Santiago de Compostela, Spain",
        "amount": 50.00
      },
      {
        "id": "fin-002",
        "date": "2026-10-12",
        "type": "expense",
        "category": "Food & Provisions",
        "description": "Bread, cheese, dried figs, and oats for 3 days",
        "location": "Cee, Spain",
        "amount": 18.40
      },
      {
        "id": "fin-003",
        "date": "2026-10-14",
        "type": "expense",
        "category": "Shelter",
        "description": "Municipal albergue pilgrim bunk",
        "location": "Finisterra, Spain",
        "amount": 15.00
      }
    ]
  }
  ```
- **Automatic Build-Time Calculations in `finances.astro`:**
  - `totalOsettai` = sum of all entries where `type === "osettai"`.
  - `totalExpenses` = sum of all entries where `type === "expense"`.
  - `currentReserves` = `startingReserve + totalOsettai - totalExpenses`.
  - `dailyBurnRate` = `totalExpenses` divided by number of unique active trail days (or configurable trail day count).
- **UI Presentation:**
  - Styled after a traditional Japanese merchant/temple account ledger (*daifukucho*):
    - 3 prominent summary cards at top: **Current Trail Reserves** (highlighted in `#6E2B25`), **Total Osettai Received**, and **Total Trail Expenditures**.
    - Category breakdown bar (Food, Shelter, Gear, Visas/Transit).
    - Filterable itemized ledger table (All / Osettai / Expenses) displaying Date, Location, Category, Description, and signed Amount (`+€50.00` in deep ink vs `-€18.40` in muted crimson).

#### 5.1.4 FAQ Page (`src/pages/faq.astro` & `src/data/faq.json`)
- Categorized accordion or clean editorial Q&A layout reading from `src/data/faq.json`.
- Categories:
  1. **The Route & Logistics** (Finisterra to Shikoku path, border crossings, seasons, visas)
  2. **Philosophy & Material Security** (Why walk on foot, the meaning of "Henro", relationship to money and trust)
  3. **Daily Life on the Trail** (Sleeping arrangements, foot care, writing dispatches from the road)

#### 5.1.5 Credits / Roll of Gratitude (`src/pages/credits.astro` & `src/data/credits.json`)
- Reads from `src/data/credits.json` with three sections:
  1. **Trail Hosts & Roadside Angels** (Name/Alias, Location, Date, Note of gratitude)
  2. **Osettai Supporters & Patrons**
  3. **Technical & Creative Collaborators**

#### 5.1.6 Donate / *Osettai* Page (`src/pages/donate.astro`)
- Explains the Shikoku pilgrimage cultural tradition of *Osettai* (お接待)—freely given alms, food, or lodging offered to pilgrims in good faith—and how it bridges with the European Camino tradition of *donativo*.
- Prominent, dignified primary CTA button (`"Offer Osettai via Stripe →"`) linking to `siteConfig.stripeDonationUrl`.
- Suggested contribution tiers (e.g., *A Hot Meal on a Rainy Day — €10*, *A Night's Pilgrim Bunk — €20*, *A Pair of Trail Socks / Gear Repair — €35*, or *Custom Amount*) that all link to the Stripe payment page, plus a transparent link back to the `/finances` open ledger.

---

### MILESTONE 2: Edition 2 Module A — RPG Gear Inventory (`src/pages/inventory.astro` & `src/data/inventory.json`)
*(Only build when requested; set `features.enableInventory = true` in `siteConfig.json` when built)*
- **Data File (`src/data/inventory.json`):**
  - Array of gear items with: `id`, `name`, `japaneseName`, `slot` (`"Equipped"`, `"Main Pack"`, `"Shelter & Sleep"`, `"Electronics & Writing"`, `"Consumables"`), `weightGrams` (number), `condition` (`"Pristine"`, `"Seasoned"`, `"Worn"`, `"Need Replacement"`), `icon` (SVG identifier or emoji/image path), `shortSummary`, `lore` (philosophical/practical field notes on why this item earns its weight), and `specs` (key-value pairs like Brand, Material, Acquired In).
- **UI & Interactivity:**
  - **Automatic Weight Summary Bar:** Calculates and displays **Base Pack Weight** (all non-consumable pack items in kg), **Equipped/Worn Weight**, and **Total Trail Weight** directly from `inventory.json`.
  - **Classic RPG Grid Layout:** Styled like a tactile ink-and-parchment RPG equipment screen (`#E6DFCF` slots with `#1C1A17` borders and `#6E2B25` active hover corners).
  - **Interactive Item Inspection Modal:** Clicking any item card opens a keyboard-accessible (`Esc` to close) RPG inspection modal showing the item's full lore, gram weight, durability badge, and technical specs.

---

### MILESTONE 3: Edition 2 Module B — Interactive Eurasia Map (`src/pages/map.astro` & `src/data/route.json`)
*(Only build when requested; set `features.enableMap = true` in `siteConfig.json` when built)*
- **Data File (`src/data/route.json`):**
  - `stats`: `{ "totalPlannedKm": 14500, "completedKm": 115, "daysOnTrail": 5, "countriesCrossed": 1 }`
  - `plannedWaypoints`: Array of `[lat, lng, label]` coordinates tracing the macro overland corridor from Finisterra, Spain → Pyrenees → France → Italy → Balkans → Turkey → Georgia → Central Asia → China/Korea → Shikoku, Japan.
  - `checkpoints`: Array of logged trail locations with `id`, `title`, `date`, `lat`, `lng`, `kmMarker`, `summary`, and optional `essaySlug`.
- **Zero-API-Key Map Implementation:**
  - Use **Leaflet.js** (via CDN or npm) with free OpenStreetMap raster tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
  - Apply a custom CSS cartographic filter to the `.leaflet-tile-pane` (`filter: sepia(0.55) contrast(1.05) brightness(0.92) hue-rotate(-10deg);`) so the map looks like an antique hand-inked scroll map embedded inside the Washi column.
  - Draw the `plannedWaypoints` as a dashed `#524D46` ink line, and draw completed `checkpoints` as a solid `#6E2B25` Aged Bengala Crimson line with clickable circular stamp markers that open a popup linking to the dispatch written at that location.

---

### MILESTONE 4: Edition 2 Module C — Community Forum (`src/pages/forum.astro`)
*(Only build when requested; set `features.enableForum = true` in `siteConfig.json` when built)*
- Build `/forum` as a clean community discussion board powered by **Giscus (GitHub Discussions)** reading repo details from `siteConfig.json`.
- Include a graceful fallback setup card if `siteConfig.giscus.repoId` is still empty, showing exact 3-step instructions for pasting the `repoId` and `categoryId` from `giscus.app`.
- Also add an optional collapsible `"Reader Reflections / Discussions"` drawer at the bottom of individual essay pages (`src/pages/essays/[...slug].astro`) when `enableForum` is `true`.

---

## 6. Mobile & Trail Publishing Configuration (`.pages.yml`)

Create `.pages.yml` in the root of the repository during **Milestone 1** so that both Edition 1 and Edition 2 files are immediately editable from a mobile browser via `app.pagescms.org`:

```yaml
media:
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
                - { label: "Trail Expense", value: "expense" }
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
```
