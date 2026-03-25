# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Read this ENTIRELY before performing any task.

---

## IDENTITY

**Mukoko** — a Digital Twin Social Ecosystem for Africa, delivered as a WeChat-style super app. Built by **Nyuchi Africa**.

**Founder & Super Admin:** Bryan (`bryan@nyuchi.com`)
**Repository:** `https://github.com/nyuchitech/mukoko.git`
**Homepage:** `https://mukoko.com`

**Brand hierarchy** (context only — Bundu Family is a separate app/repo):

```
BUNDU (Container)     — The wilderness. Parent brand. SEPARATE APP.
  └─ NYUCHI (Action)  — The bee. Collective effort, pollination, building.
      └─ MUKOKO (Structure) — The hive. Community gathering space. THIS PROJECT.
          └─ SHAMWARI (Intelligence) — The friend. AI that lives inside the hive.
```

**Ubuntu Principle:** "Munhu munhu muvanhu" — A person is a person through other persons.

**The Ubuntu Test — apply before every feature decision:**

1. Does this strengthen community?
2. Does this respect human dignity?
3. Does this serve the collective good?
4. Would we explain this proudly to our elders?
5. Does this align with "I am because we are"?

---

## WHAT MUKOKO IS

Six interconnected apps sharing one identity, one AI engine, one reputation system, and one token economy:

| App           | Domain               | Purpose                                                   | Standalone Repo        |
| ------------- | -------------------- | --------------------------------------------------------- | ---------------------- |
| **Mukoko ID** | `id.mukoko.com`      | Unified identity, Digital Twin, Memory File, SSO (Stytch) | `mukoko-auth`          |
| **Clips**     | `clips.mukoko.com`   | Context-rich news feed from trusted sources               | `mukoko-news`          |
| **Pulse**     | `pulse.mukoko.com`   | Personalized super app feed — aggregates all apps         | **This monorepo**      |
| **Connect**   | `connect.mukoko.com` | Interest-based Circles (communities)                      | `mukoko-connect` (new) |
| **Novels**    | `novels.mukoko.com`  | African author platform, web novels                       | `mukoko-novels` (new)  |
| **Events**    | `events.mukoko.com`  | Cultural gatherings, ticketing                            | `nhimbe`               |

**Pulse** is the super app's unified feed. It aggregates content from Clips, Events, Connect, Novels, and more — personalized by the **Memory File** (see below). Pulse lives in this monorepo, not in a standalone repo.

**Clips** (`mukoko-news` repo) is the news/articles app. It also includes **Bytes** (TikTok-style short-form scrolling) in its standalone version. Bytes stays in the standalone app; Pulse is the super app's own aggregated feed.

**Utility mini-apps:** Weather (`weather.mukoko.com`, repo: `mukoko-weather`), future Marketplace, Transport.

**Separate products using Mukoko ID (Stytch SSO):** Nyuchi Learning, Zimbabwe Travel, Bundu Family.

---

## ARCHITECTURE

### Stack

| Layer                | Technology                                                                     |
| -------------------- | ------------------------------------------------------------------------------ |
| **Mobile Shell**     | Flutter (Dart) — clean architecture, Riverpod                                  |
| **Mini-Apps**        | Preact + Nyuchi Design System (WebView + standalone PWA on Vercel)             |
| **Bridge**           | MukokoBridge JavaScript API (injected into WebViews)                           |
| **Backend**          | Cloudflare Workers (translation layer) + Cloudflare Containers (heavy compute) |
| **Mini-App Hosting** | Workers for Platforms — each mini-app gets its own worker                      |
| **Database**         | MongoDB Atlas (primary) + Cloudflare KV (edge cache) + D1 (edge-local reads)   |
| **Auth**             | Stytch (sessions, OAuth, MFA, SSO)                                             |
| **AI**               | Cloudflare AI + TFLite/CoreML on-device + FastAPI backend (honey.nyuchi.com)   |
| **Storage**          | Cloudflare R2                                                                  |
| **Blockchain**       | Base (Digital Twin NFT, MUKOKO tokens)                                         |
| **Web Deployment**   | Vercel (landing page + mini-app PWAs)                                          |
| **Monorepo**         | Turborepo + pnpm workspaces                                                    |

### Platforms

- Android API 24+ (primary market)
- iOS 15+
- HarmonyOS / Huawei AppGallery (HMS Core, HMS Push, Petal Maps)
- APK direct download (mukoko.com)
- PWA on Vercel at `*.mukoko.com` subdomains

### Design Pattern

```
Flutter shell = native platform services (auth, wallet, AI, notifications, device APIs)
WebView mini-apps = the six ecosystem apps + utility apps
MukokoBridge = communication layer between shell and mini-apps
Workers = translation layer (routing, auth verification, caching)
Containers = heavy compute (AI inference, media processing, blockchain)
```

### Mini-App Architecture — Two Frontends, One Backend

Each ecosystem app (Clips, Pulse, Connect, Novels, Events, Weather) exists as **two frontends** sharing a single backend:

```
┌─────────────────────────────────────────────────────────┐
│  STANDALONE (own repo)          SUPER APP (this monorepo)│
│  ─────────────────────          ─────────────────────── │
│  Full PWA at *.mukoko.com       Preact UI in mini-apps/ │
│  Own routing, own UI            @mukoko/ui components    │
│  Direct API calls               @mukoko/bridge for shell │
│  Works independently            Deep wallet/auth/nav     │
│                                 integration              │
│         └──────── Both consume the same backend API ────┘│
│                   (standalone repo owns the backend)     │
└─────────────────────────────────────────────────────────┘
```

**Why two frontends?**

- The standalone PWA ensures each app works outside the super app (web users, direct links, app store alternatives)
- The super app frontend ensures consistent UX inside the Flutter shell with access to native capabilities via MukokoBridge
- Backends are never duplicated — the super app frontend calls the same API as the standalone PWA

**Rule:** The standalone repo owns the backend + standalone frontend. This monorepo owns the super app frontend only. Do not duplicate backend logic here.

---

## DATA LAYER

### MongoDB Atlas (Primary Database)

- All application data: users, articles, events, novels, circles, messages, transactions
- Connection via MongoDB driver in Cloudflare Workers/Containers
- Collections mirror the domain: `users`, `articles`, `events`, `novels`, `circles`, `pulse_posts`, `transactions`, `notifications`

### Cloudflare KV (Edge Cache)

- `CONFIG_STORAGE` — App configuration, feature flags
- `CACHE_STORAGE` — API response cache, rate limiting counters
- `USER_STORAGE` — Session cache, user preferences
- `NEWS_STORAGE` — RSS feed cache, article summaries

### Cloudflare D1 (Edge-Local Reads)

- `mukoko_users` — Edge-local user lookups for fast auth verification

### Cloudflare R2 (Object Storage)

- Media uploads, mini-app bundles, brand assets

### Cloudflare Durable Objects

- `ChatRoom` — Live messaging
- `UserSession` — User presence tracking

### Cloudflare Analytics Engine

- `category_clicks`, `news_interactions`, `search_queries`

---

## AUTH — STYTCH

Stytch is the auth provider for the entire ecosystem. NOT Supabase.

- **Sessions:** Stytch session tokens (not Supabase JWT)
- **Methods:** Email magic links, OAuth (Google, GitHub, Apple), SMS OTP, biometric
- **SSO:** Mukoko ID provides SSO to all Nyuchi products (Learning, Travel, Bundu Family)
- **Worker middleware:** Every worker verifies Stytch session token on protected routes
- **Flutter:** Stytch SDK for mobile auth flow + secure token storage (Keychain/Keystore)
- **Mini-apps:** Get Stytch session via `MukokoBridge.auth.getToken()`

---

## MEMORY FILE — THE PERSONALIZATION CORE

The **Memory File** is the central personalization artifact for each user. It is the single source of truth that the entire ecosystem uses to customize the experience.

### What it is

- A structured profile co-created by **Nyuchi Honey** (on-device learning) and **Mukoko ID** (identity)
- Stored in **Mukoko ID** (the identity layer), not on-device only
- **Editable by the user** — full data sovereignty, the user can view, modify, and delete their Memory File
- The memory for **Shamwari AI**, **Pulse feed curation**, and all app personalization

### What it contains

- Interest map (32 categories, weighted by engagement)
- Content preferences (formats, sources, languages)
- Interaction patterns (reading habits, time-of-day, session length)
- Explicit preferences (user-set, overrides inferred data)
- Cross-app context (what the user does in Clips informs Pulse, Connect, etc.)

### How it flows

```
Nyuchi Honey (on-device)          Mukoko ID (cloud)
┌───────────────────┐             ┌───────────────────┐
│ Observes behavior │────sync────▶│ Stores Memory File│
│ Learns locally    │             │ User can edit      │
│ Privacy-first     │◀───read────│ API access for     │
└───────────────────┘             │ Shamwari + Pulse   │
                                  └───────────────────┘
                                          │
                    ┌─────────────────────┤
                    ▼                     ▼
              Pulse Feed            Shamwari AI
              (personalized         (context-aware
               aggregation)          companion)
```

### Rules

- Honey learns on-device — raw behavioral data never leaves the device
- Honey syncs a **summarized** Memory File to Mukoko ID (not raw events)
- The user can always see and edit their Memory File
- Shamwari and Pulse read the Memory File via Mukoko ID API
- Deleting the Memory File resets all personalization

---

## EXISTING INFRASTRUCTURE

### Cloudflare Workers (15 deployed)

| Worker                 | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `mukoko-news-backend`  | News/Clips feed + Bytes (app.mukoko.com) — owned by mukoko-news repo |
| `mukoko-id-api`        | Authentication, profiles — Mukoko ID                                 |
| `mukoko-nhimbe-api`    | Events (canonical — owned by nhimbe repo)                            |
| `mukoko-events-api`    | Events (legacy duplicate — consolidate into nhimbe)                  |
| `nyuchi_api`           | Core Nyuchi platform                                                 |
| `nyuchi-brand-assets`  | Brand CDN (assets.nyuchi.com)                                        |
| `hararemetro-redirect` | Legacy redirect                                                      |

**Note:** Existing workers use itty-router. New workers use Hono. Do not change existing worker routers unless explicitly migrating.

### Connected Repositories (nyuchitech org)

Each ecosystem app has its own standalone repository containing its backend and standalone PWA frontend. The monorepo does **not** replace these repos — it provides the **super app frontend** for each app, ensuring a consistent in-app experience.

| Standalone Repo   | Owns                                   | Super App Frontend In            |
| ----------------- | -------------------------------------- | -------------------------------- |
| `mukoko-news`     | Clips + Bytes backend + standalone PWA | `mini-apps/clips/`               |
| `nhimbe`          | Events backend + standalone PWA        | `mini-apps/events/`              |
| `mukoko-weather`  | Weather backend + standalone PWA       | `mini-apps/weather/`             |
| `mukoko-auth`     | Auth backend (Stytch)                  | `services/id-api/`               |
| `mukoko-connect`  | Connect backend + standalone PWA (new) | `mini-apps/connect/`             |
| `mukoko-novels`   | Novels backend + standalone PWA (new)  | `mini-apps/novels/`              |
| `brand-warehouse` | Brand assets CDN                       | `packages/design-system/assets/` |

**Two frontends per app:**

- **Standalone PWA** (in the app's own repo) — full app at `*.mukoko.com`, works independently
- **Super app frontend** (in this monorepo's `mini-apps/`) — Preact UI loaded in the Flutter shell's WebView, uses `@mukoko/bridge` for deep integration with wallet, auth, navigation, and Shamwari

Separate products (use Mukoko ID SSO, NOT in this repo): `learning`, `zimbabwe-travel`, `bundu-family`

---

## REPOSITORY STRUCTURE

```
mukoko/
├── app/                           # Flutter super app shell (NOT a pnpm workspace)
│   ├── android/ | ios/ | huawei/
│   ├── lib/
│   │   ├── core/                  # Init, routing, DI, config
│   │   ├── features/
│   │   │   ├── auth/              # Stytch integration
│   │   │   ├── wallet/            # Payments, tokens, QR
│   │   │   ├── honey/             # On-device AI, Digital Twin
│   │   │   ├── shamwari/          # AI companion
│   │   │   ├── miniapp_runtime/   # WebView manager, bridge
│   │   │   ├── notifications/     # Push + local
│   │   │   ├── discovery/         # Home screen, mini-app launcher
│   │   │   └── settings/          # Preferences, data saver
│   │   ├── shared/                # Design system widgets, theme
│   │   └── bridge/                # MukokoBridge JS injection
│   └── pubspec.yaml
│
├── mini-apps/                     # Super app frontends (Preact, loaded in Flutter WebView)
│   ├── pulse/                     # Personalized aggregated feed (monorepo-native, no standalone repo)
│   ├── clips/                     # News — super app UI (backend in mukoko-news repo)
│   ├── connect/                   # Circles — super app UI (backend in mukoko-connect repo)
│   ├── novels/                    # Author platform — super app UI (backend in mukoko-novels repo)
│   ├── events/                    # Events — super app UI (backend in nhimbe repo)
│   ├── weather/                   # Weather — super app UI (backend in mukoko-weather repo)
│   └── _template/                 # Starter for new super app mini-app frontends
│
├── services/                      # Cloudflare Workers (super app infrastructure only)
│   ├── gateway/                   # API gateway — routing + Stytch session verification
│   ├── id-api/                    # Mukoko ID (Stytch auth)
│   ├── wallet-api/                # Payments + MUKOKO tokens
│   ├── shamwari-api/              # AI companion (Cloudflare AI)
│   ├── miniapp-registry/          # Mini-app manifest + R2 assets
│   ├── digital-twin/              # NFT + reputation
│   └── _template/                 # Starter for new workers (Hono)
│   # NOTE: App-specific backends (clips, pulse, events, connect, novels, weather)
│   #        live in their standalone repos, NOT here.
│
├── honey/                         # Nuchi Honey (isolated, NOT a pnpm workspace)
│   ├── Dockerfile
│   ├── app/                       # FastAPI service
│   └── docker-compose.yml
│
├── packages/                      # Shared libraries
│   ├── tsconfig/                  # @mukoko/tsconfig
│   ├── eslint-config/             # @mukoko/eslint-config
│   ├── types/                     # @mukoko/types
│   ├── design-system/             # @mukoko/ui (Preact)
│   ├── bridge-sdk/                # @mukoko/bridge (TypeScript)
│   └── api-client/                # @mukoko/api
│
├── web/                           # Landing page (Next.js 15 + Sanity CMS, deployed to Vercel)
│   ├── app/                       # Next.js app router (layout, pages)
│   ├── src/
│   │   ├── components/            # Header, HoneycombBackground, WaitlistForm
│   │   ├── sections/              # Hero, AppShowcase, Footer, HowItWorks, Privacy, Ubuntu
│   │   └── lib/                   # Sanity client, utilities
│   ├── studio/                    # Sanity Studio (blog CMS)
│   │   └── schemaTypes/           # author, category, post schemas
│   ├── public/                    # Static assets
│   └── vercel.json                # Vercel deployment config
│
├── docs/                          # Architecture docs, guides, ADRs
│   ├── adr/                       # Architecture Decision Records
│   │   ├── 001-monorepo-turborepo.md
│   │   ├── 002-preact-over-react.md
│   │   ├── 003-hono-for-new-workers.md
│   │   ├── 004-mongodb-atlas-primary.md
│   │   ├── 005-stytch-auth.md
│   │   ├── 006-vercel-web-deployment.md
│   │   └── 007-workers-for-platforms.md
│   ├── guides/                    # Developer guides
│   │   ├── getting-started.md
│   │   ├── creating-mini-app.md
│   │   ├── creating-service.md
│   │   ├── connected-repos.md
│   │   ├── mongodb-atlas.md
│   │   └── stytch-integration.md
│   └── api/                       # API reference
│
├── .github/                       # CI/CD workflows
├── ARCHITECTURE.md                # Detailed technical specification (45KB)
├── turbo.json                     # Monorepo config
├── pnpm-workspace.yaml            # Workspace definition
└── CLAUDE.md                      # THIS FILE
```

---

## DEVELOPER ENVIRONMENT & TOOLING

### Prerequisites

| Tool    | Version | Notes                    |
| ------- | ------- | ------------------------ |
| Node.js | 22+     | Pinned in `.nvmrc`       |
| pnpm    | 9.15.4+ | Pinned in `package.json` |
| Flutter | Latest  | For `app/` development   |
| Python  | 3.12+   | For `honey/` only        |
| Docker  | Latest  | For `honey/` local dev   |

### Root Configuration Files

| File                  | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `turbo.json`          | Turborepo task graph (build, dev, lint, typecheck, test, deploy)    |
| `pnpm-workspace.yaml` | Workspace: `packages/*`, `services/*`, `mini-apps/*`, `web`         |
| `eslint.config.mjs`   | Root ESLint config — uses `@mukoko/eslint-config`                   |
| `.prettierrc`         | Prettier: semicolons, 2-space indent, 100 char width, single quotes |
| `.nvmrc`              | Locks Node to v22                                                   |
| `.npmrc`              | Auto-install peers, no strict peer deps                             |

### Git Hooks (Husky + lint-staged)

Pre-commit hook runs `lint-staged` automatically on staged files. Configured via `husky` (v9.1.7) and `lint-staged` (v16.4.0) in `package.json`.

### Key Dependency Versions

| Package    | Version | Used In                     |
| ---------- | ------- | --------------------------- |
| turbo      | 2.4.0   | Root monorepo               |
| typescript | 5.7.0   | All TS packages             |
| preact     | 10.25.0 | Mini-apps                   |
| vite       | 6.0     | Mini-apps                   |
| hono       | 4.12.8  | New workers/services        |
| wrangler   | 4.0.0   | Worker deployment           |
| next       | 15      | `web/` landing page         |
| react      | 19      | `web/` only (NOT mini-apps) |
| eslint     | 10.0.0  | Linting                     |
| prettier   | 3.4.0   | Formatting                  |

---

## BUILD & DEV COMMANDS

```bash
# Install dependencies (Node packages only — Flutter and Python managed separately)
pnpm install

# Build all packages
pnpm turbo run build

# Dev mode (all packages)
pnpm turbo run dev

# Lint + typecheck
pnpm turbo run lint typecheck

# Test
pnpm turbo run test

# Format
pnpm format

# Single package
pnpm turbo run build --filter=@mukoko/ui
pnpm turbo run dev --filter=clips
pnpm turbo run test --filter=@mukoko/bridge

# Single service
cd services/gateway && pnpm dev          # wrangler dev
cd services/gateway && pnpm deploy       # wrangler deploy

# Landing page (web/)
cd web && pnpm dev                       # Next.js dev server
cd web && pnpm build                     # Next.js production build
cd web && pnpm test                      # Vitest

# Sanity Studio (web/studio/)
cd web && pnpm sanity dev                # Sanity Studio dev
cd web && pnpm sanity deploy             # Deploy Sanity Studio

# Flutter
cd app && flutter pub get
cd app && flutter analyze
cd app && flutter test
cd app && flutter run

# Honey (Python)
cd honey && pip install -r requirements.txt
cd honey && python -m pytest tests/
cd honey && docker compose up
```

---

## CI/CD & CODE QUALITY

### GitHub Actions (`.github/workflows/ci.yml`)

Triggers on push to `main` and all PRs to `main`. Runs:

```
pnpm turbo run build typecheck lint test
```

Uses pnpm v4 action, Node 22, Turborepo cache. Concurrency group cancels in-progress runs for the same ref.

### Code Ownership (`.github/CODEOWNERS`)

| Path                      | Team                   |
| ------------------------- | ---------------------- |
| Root config               | `@nyuchitech/core`     |
| `app/`                    | `@nyuchitech/mobile`   |
| `packages/design-system/` | `@nyuchitech/design`   |
| `services/`               | `@nyuchitech/backend`  |
| `honey/`                  | `@nyuchitech/ai`       |
| `mini-apps/` + `web/`     | `@nyuchitech/frontend` |

### PR Template

All PRs use `.github/PULL_REQUEST_TEMPLATE.md` which includes the Ubuntu Test checklist.

---

## LANDING PAGE — WEB (`web/`)

The landing page at `mukoko.com` is a **Next.js 15** app (NOT Preact — React 19 is used here only).

| Component     | Technology                             |
| ------------- | -------------------------------------- |
| Framework     | Next.js 15, React 19                   |
| CMS           | Sanity (next-sanity v9, Portable Text) |
| 3D Visuals    | Three.js (honeycomb background)        |
| UI Components | Radix UI primitives                    |
| Styling       | Tailwind CSS 4                         |
| Testing       | Vitest                                 |
| Deployment    | Vercel (`vercel.json`)                 |

**Note:** React is used in `web/` because Next.js requires it. Mini-apps use Preact. Do not confuse the two.

### Pages

- `/` — Home (hero, app showcase, how it works, privacy, ubuntu philosophy, footer)
- `/manifesto` — Brand manifesto

### Sanity Studio

Content schemas for blog: `author`, `category`, `post`. Studio runs at `/studio` route or standalone via `pnpm sanity dev`.

---

## API GATEWAY ROUTING (`services/gateway/`)

The gateway worker routes all API traffic and verifies Stytch sessions:

| Route Path    | Upstream Service          |
| ------------- | ------------------------- |
| `/auth/*`     | `id-api`                  |
| `/clips/*`    | External (mukoko-news)    |
| `/events/*`   | External (nhimbe)         |
| `/pulse/*`    | Pulse API                 |
| `/connect/*`  | External (mukoko-connect) |
| `/novels/*`   | External (mukoko-novels)  |
| `/weather/*`  | External (mukoko-weather) |
| `/wallet/*`   | `wallet-api`              |
| `/shamwari/*` | `shamwari-api`            |
| `/miniapps/*` | `miniapp-registry`        |
| `/twin/*`     | `digital-twin`            |

---

## MUKOKO BRIDGE API

Injected into every mini-app WebView. Contract between Flutter shell and web mini-apps.

```javascript
window.MukokoBridge = {
  auth: {
    getUser()              // Returns user profile + Digital Twin
    getToken()             // Stytch session token for API calls
    onAuthChange(cb)       // Auth state subscription
  },
  honey: {
    getInterests()         // 32-category interest map
    trackInteraction({ type, contentId, duration })
    getSuggestions(context) // Recommendations from Your Honey
  },
  shamwari: {
    ask(question)          // Invoke Shamwari AI (Cloudflare AI)
    summarize(content)     // Content summarization
    translate(text, lang)  // Translation
  },
  wallet: {
    getBalance()           // Fiat + MUKOKO tokens
    requestPayment({ amount, currency, description })
    transferTokens({ to, amount })
    onPaymentResult(cb)
  },
  device: {
    getLocation()          // GPS
    openCamera()           // Camera
    scanQR()               // QR scanner
    share(data)            // Native share sheet
    haptic(type)           // Haptic feedback
  },
  nav: {
    openMiniApp(id, params) // Launch another mini-app
    goBack()
    setTitle(text)
  },
  storage: {
    get(key) / set(key, value) / remove(key)
  },
  reputation: {
    getScore()             // Cross-platform reputation
    getTokenBalance()      // MUKOKO tokens
  }
}
```

**Every mini-app must use `@mukoko/bridge` (typed SDK) rather than `window.MukokoBridge` directly.**

---

## DESIGN SYSTEM — NYUCHI BRAND v6

### Five African Minerals Palette

| Mineral        | Light Mode | Dark Mode | Mukoko Usage                                   |
| -------------- | ---------- | --------- | ---------------------------------------------- |
| **Tanzanite**  | `#4B0082`  | `#B388FF` | **Primary** — CTAs, active states, nav         |
| **Cobalt**     | `#0047AB`  | `#00B0FF` | **Secondary** — Links, info, secondary actions |
| **Gold**       | `#5D4037`  | `#FFD740` | **Accent** — Rewards, wallet, honey            |
| **Malachite**  | `#004D40`  | `#64FFDA` | Shamwari AI, success states                    |
| **Terracotta** | `#8B4513`  | `#D4A574` | Community, Ubuntu                              |

### Typography

- **Display:** Noto Serif
- **Body:** Plus Jakarta Sans
- **Code:** JetBrains Mono

### Design Rules

- Button radius: `12px`, Card radius: `16px`
- Touch targets: `44x44px` minimum
- Five African Minerals strip: 4px vertical left edge (Tanzanite → Cobalt → Gold → Malachite → Terracotta, hidden < 480px)
- Wordmarks: **always lowercase** (`mukoko`, `nyuchi`, `shamwari`)
- Contrast: WCAG AAA (7:1+) — non-negotiable
- Light/dark mode: all colors auto-adapt

---

## CODING STANDARDS

### Flutter (Dart)

- Clean architecture: `presentation/` → `domain/` → `data/`
- State management: `flutter_riverpod`
- Null safety: strict (no `!` operator unless impossible)
- Feature folders: `features/{feature}/presentation|domain|data/`
- All widgets const where possible
- No business logic in widgets — only in providers/use cases

### Mini-Apps (TypeScript/Preact)

- Framework: Preact (NOT React — 3KB vs 40KB)
- Design system: `@mukoko/ui` components only
- Bridge: `@mukoko/bridge` SDK (typed, not raw window access)
- Build: Vite, target < 150KB gzipped output
- API calls: through `@mukoko/api` client
- Style: Tailwind CSS with Nyuchi design tokens
- No localStorage (use `MukokoBridge.storage`)

### Cloudflare Workers (TypeScript)

- New workers: Hono router
- Existing workers: itty-router (do not change unless migrating)
- Auth: Verify Stytch session token on every protected request
- Database: MongoDB Atlas via mongodb driver
- Cache: KV for edge caching, D1 for edge-local reads
- Error handling: structured error responses with codes
- Rate limiting: per-user via KV
- Environment variables for ALL secrets

### Shared File Patterns

**Every mini-app** follows the same structure:

```
mini-apps/{app}/
├── package.json          # @mukoko/{app}, Preact + Vite
├── index.html            # Entry point
├── src/
│   ├── index.tsx         # Mount point
│   └── app.tsx           # Root component
├── public/manifest.json  # PWA manifest
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
```

**Every service** follows the same structure:

```
services/{service}/
├── package.json          # @mukoko/{service}, Hono + wrangler
├── src/
│   ├── index.ts          # Hono app entry
│   ├── middleware/
│   │   ├── auth.ts       # Stytch session verification
│   │   └── index.ts
│   └── lib/
│       └── mongodb.ts    # MongoDB Atlas connection
├── wrangler.jsonc        # Cloudflare config (bindings, env)
├── vitest.config.ts
└── tsconfig.json
```

### General

- TypeScript strict mode everywhere
- No `any` types
- Conventional commits
- No console.log in production (use structured logging)

---

## PAYMENT INTEGRATION

1. **EcoCash** — Econet API, USSD push / app-to-app (Zimbabwe's dominant payment)
2. **InnBucks** — Wallet integration (growing Zimbabwe market)
3. **MUKOKO Tokens** — Base blockchain internal ledger + on-chain
4. **Bank Transfer** — ZimSwitch / RTGS (Phase 2)
5. **Card Payments** — Visa/Mastercard gateway (Phase 2)

### Creator Economics

- Novel authors: **85%** of chapter revenue
- Pulse creators: **80%** of tipping revenue
- Event organizers: **90%** of ticket revenue
- Circle moderators: reputation + token bonuses

---

## DATA EFFICIENCY

Zimbabwe market reality: data is expensive, connectivity is intermittent.

| Action                          | Budget          |
| ------------------------------- | --------------- |
| App install                     | < 25MB          |
| Mini-app first load             | < 150KB gzipped |
| News feed refresh (20 articles) | < 50KB          |
| Your Honey model sync           | < 500KB delta   |
| Image thumbnails                | < 30KB WebP     |

---

## SECURITY

- HTTPS + certificate pinning on all API calls
- Stytch session tokens in platform secure storage (Keychain/Keystore) — NEVER in WebView localStorage
- Mini-app sandboxing: scoped storage, no cross-app data without Bridge
- Your Honey: on-device only, no raw data leaves device
- Wallet: biometric auth for transactions above threshold
- Nuchi Honey: isolated infrastructure, Cloudflare Tunnel, secret auth
- All secrets in environment variables — NEVER in source code

---

## COMMON MISTAKES TO AVOID

1. **DO NOT** use React for mini-apps. Use Preact (3KB, not 40KB).
2. **DO NOT** use Supabase for auth. Use Stytch.
3. **DO NOT** use Supabase as primary database. Use MongoDB Atlas.
4. **DO NOT** store tokens in WebView localStorage. Use Flutter secure storage via Bridge.
5. **DO NOT** send user behavior data to servers. All Your Honey learning is on-device.
6. **DO NOT** hardcode API keys, tokens, or secrets. Environment variables only.
7. **DO NOT** build features that fail the Ubuntu Test.
8. **DO NOT** ignore offline scenarios. Every feature must degrade gracefully.
9. **DO NOT** skip Huawei/HMS support.
10. **DO NOT** capitalize brand wordmarks. Always lowercase: `mukoko`, `nyuchi`, `shamwari`.
11. **DO NOT** change existing worker routers (itty-router) unless explicitly migrating. New workers use Hono.
12. **DO NOT** treat Bundu Family as part of this repo. It is a separate app.
13. **DO NOT** duplicate backend logic in this monorepo. Each app's backend lives in its standalone repo. The `mini-apps/` directory contains super app frontends only.
14. **DO NOT** confuse the super app frontend (`mini-apps/`) with the standalone PWA. They are separate codebases sharing the same backend API.
15. **DO NOT** create page-specific CSS. All pages use the same shared brand primitives from `globals.css` (and ultimately from `@mukoko/ui` registry). No page should have its own parallel styling system. New primitives must be submitted as issues to `nyuchitech/mukoko-registry`.
16. **DO NOT** set touch targets below 48px. Default touch target is **56px**; minimum is **48px** (only for compact inline form elements). All interactive elements must meet these minimums.
17. **DO NOT** use light mode on the marketing site. The marketing site (`web/`) is **dark-mode only** — no `prefers-color-scheme` media queries, no light theme.

---

## QUICK REFERENCE

| Item              | Value                                   |
| ----------------- | --------------------------------------- |
| Primary color     | Tanzanite `#4B0082` / `#B388FF`         |
| Auth provider     | Stytch                                  |
| Primary database  | MongoDB Atlas                           |
| Edge cache        | Cloudflare KV + D1                      |
| Object storage    | Cloudflare R2                           |
| AI                | Cloudflare AI + on-device TFLite/CoreML |
| Web deployment    | Vercel                                  |
| Worker deployment | Cloudflare Workers + Containers         |
| Mini-app workers  | Workers for Platforms                   |
| Framework         | Flutter + Preact WebView mini-apps      |
| State management  | Riverpod                                |
| Blockchain        | Base (NFT + tokens)                     |
| Payments          | EcoCash → InnBucks → MUKOKO tokens      |
| Monorepo          | Turborepo + pnpm                        |
| Node              | 22+                                     |
| Min Android       | API 24 (7.0)                            |
| Min iOS           | 15.0                                    |
| Architecture doc  | `ARCHITECTURE.md` (detailed spec)       |
| ADRs              | `docs/adr/001-007`                      |
| Dev guides        | `docs/guides/`                          |
| CI                | GitHub Actions (`ci.yml`)               |

---

_Ndiri nekuti tiri — I am because we are._
