# [ FX Prompty ]

> **Discover. Copy. Create.**
> A modern, premium, production-ready AI Image Prompt Library for Midjourney, DALL-E 3, Flux.1, and Stable Diffusion XL.
> Created with ❤️ by [Himanshu Pandey](https://github.com/himanshupandit566-alt)

---

## 🌟 Overview

**[ FX Prompty ]** is a curated prompt inspiration library designed with a dark aesthetic, combining Pinterest-style visual discovery with a prompt management workflow.

### Key Capabilities
- **Visual Discovery**: Pinterest-style responsive image grid with card aspect ratios, loading skeletons, and graceful fallbacks.
- **30+ Curated Prompts**: Diverse styles including Cinematic Male/Female, Vintage Bollywood, Cyberpunk, Luxury Fashion, Anime, Fantasy Warriors, Supercars, and Product Photography.
- **Prompt Details**: View full prompt parameters, camera settings, lighting specifications, and negative prompts without truncation.
- **One-Tap Copy**: Modern Clipboard API with legacy fallback and visual toast feedback.
- **Save to Favorites**: Persistent client-side favorites stored in `localStorage` across browser refreshes.
- **TXT Export**: Download formatted plain-text (.txt) prompt files conforming to UTF-8 specifications.
- **Native Sharing**: Web Share API integration with automatic clipboard fallback.
- **Search & Filters**: Real-time keyword search across titles, descriptions, categories, tags, and prompt text.
- **17 Filterable Categories**: Cinematic Portraits, Realistic Photography, Fashion, Luxury, Anime, Fantasy, Cars, Gaming, Wallpapers, etc.
- **Sorting Modes**: Featured, Most Popular, Latest, and Alphabetical (A-Z).
- **Prompt Studio (Creator)**: Custom prompt creation interface allowing users to preview and publish prompts to their local library.
- **Mobile First**: Fixed bottom navigation bar with active indicators and safe-area insets.
- **PWA Ready**: Manifest, responsive theme colors, and offline metadata.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite 5
- **Styling**: Tailwind CSS with custom dark color palette & animations
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **Persistence**: Browser `localStorage`

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure Node.js (v18+) and npm are available in your environment.

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```
The preview server runs at `http://localhost:4173`.

---

## 🧪 Testing

Run the automated data integrity and export test suites:
```bash
npx tsx tests/verify-prompts.test.js
npx tsx tests/verify-export.test.ts
```

---

## 📁 Project Architecture

```
├── public/
│   ├── logo.svg              # Brand vector logo
│   └── manifest.json         # PWA Manifest configuration
├── src/
│   ├── types/
│   │   └── prompt.ts         # TypeScript definitions
│   ├── data/
│   │   ├── categories.ts     # 17 Curated category definitions
│   │   └── prompts.ts        # 30 Curated AI prompts dataset
│   ├── context/
│   │   └── FavoritesContext.tsx # Favorites & custom prompt persistence
│   ├── utils/
│   │   ├── clipboard.ts      # Resilient clipboard copy with fallback
│   │   ├── exportPrompt.ts   # Plain text UTF-8 export generator
│   │   └── sharePrompt.ts    # Web Share API with clipboard fallback
│   ├── components/
│   │   ├── Navbar.tsx        # Responsive desktop & mobile header
│   │   ├── BottomNav.tsx     # Mobile fixed navigation bar
│   │   ├── HeroSection.tsx   # Hero with search bar and quick tags
│   │   ├── CategoryChips.tsx # Horizontally scrollable category chips
│   │   ├── TrendingSection.tsx # Horizontally scrollable trending cards
│   │   ├── FilterSortBar.tsx # Filter, ratio, and sort controls
│   │   ├── ImageCard.tsx     # Pinterest-style image card
│   │   ├── Toast.tsx         # Floating toast manager
│   │   └── Footer.tsx        # Dark footer with brand metadata
│   ├── pages/
│   │   ├── HomePage.tsx      # Main discovery homepage
│   │   ├── ExplorePage.tsx   # Searchable prompt gallery
│   │   ├── PromptDetailPage.tsx # 2-column detailed prompt viewer
│   │   ├── FavoritesPage.tsx # Saved prompts management
│   │   ├── CategoryPage.tsx  # Category-filtered view
│   │   ├── SettingsPage.tsx  # Preferences & storage management
│   │   ├── AdminPage.tsx     # Local prompt creator studio
│   │   └── NotFoundPage.tsx  # 404 Route handler
│   ├── App.tsx               # Routing & application layout
│   ├── index.css             # Tailwind & theme styles
│   └── main.tsx              # Application entry point
├── tests/
│   ├── verify-prompts.test.js # Data integrity & search tests
│   └── verify-export.test.ts  # Plain-text TXT export tests
└── package.json
```

---

## 📄 License
MIT License. Created for the creative AI community.
