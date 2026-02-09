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

| App | Domain | Purpose | Status |
|-----|--------|---------|--------|
| **Mukoko ID** | `id.mukoko.com` | Unified identity, Digital Twin, SSO (Stytch) | Existing |
| **Clips** | `clips.mukoko.com` | Context-rich news from trusted sources | Migrating from mukoko-news |
| **Pulse** | `pulse.mukoko.com` | Trending short-form content, African creativity | New build |
| **Connect** | `connect.mukoko.com` | Interest-based Circles (communities) | New build |
| **Novels** | `novels.mukoko.com` | African author platform, web novels | New build |
| **Events** | `events.mukoko.com` | Cultural gatherings, ticketing | Migrating from nhimbe |

**Utility mini-apps:** Weather, future Marketplace, Transport.

**Separate products using Mukoko ID (Stytch SSO):** Nyuchi Learning, Zimbabwe Travel, Bundu Family.

---

## ARCHITECTURE

### Stack
| Layer | Technology |
|-------|-----------|
| **Mobile Shell** | Flutter (Dart) — clean architecture, Riverpod |
| **Mini-Apps** | Preact + Nyuchi Design System (WebView + standalone PWA on Vercel) |
| **Bridge** | MukokoBridge JavaScript API (injected into WebViews) |
| **Backend** | Cloudflare Workers (translation layer) + Cloudflare Containers (heavy compute) |
| **Mini-App Hosting** | Workers for Platforms — each mini-app gets its own worker |
| **Database** | MongoDB Atlas (primary) + Cloudflare KV (edge cache) + D1 (edge-local reads) |
| **Auth** | Stytch (sessions, OAuth, MFA, SSO) |
| **AI** | Cloudflare AI + TFLite/CoreML on-device + FastAPI backend (honey.nyuchi.com) |
| **Storage** | Cloudflare R2 |
| **Blockchain** | Base (Digital Twin NFT, MUKOKO tokens) |
| **Web Deployment** | Vercel (landing page + mini-app PWAs) |
| **Monorepo** | Turborepo + pnpm workspaces |

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

## EXISTING INFRASTRUCTURE

### Cloudflare Workers (15 deployed)
| Worker | Purpose |
|--------|---------|
| `mukoko-news-backend` | News aggregation (app.mukoko.com) — becomes Clips API |
| `mukoko-id-api` | Authentication, profiles — Mukoko ID |
| `mukoko-nhimbe-api` | Events — becomes Events API |
| `mukoko-events-api` | Events API |
| `nyuchi_api` | Core Nyuchi platform |
| `nyuchi-brand-assets` | Brand CDN (assets.nyuchi.com) |
| `hararemetro-redirect` | Legacy redirect |

**Note:** Existing workers use itty-router. New workers use Hono. Do not change existing worker routers unless explicitly migrating.

### Connected Repositories (nyuchitech org)
| Repo | Migrates To |
|------|-------------|
| `mukoko-news` | `mini-apps/clips/` + `services/clips-api/` |
| `mukoko-weather` | `mini-apps/weather/` + `services/weather-api/` |
| `mukoko-auth` | `services/id-api/` |
| `nhimbe` | `mini-apps/events/` + `services/events-api/` |
| `brand-warehouse` | `packages/design-system/assets/` |

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
├── mini-apps/                     # Preact PWAs (deployed to Vercel)
│   ├── clips/                     # News (from mukoko-news)
│   ├── pulse/                     # Trending content
│   ├── connect/                   # Circles / communities
│   ├── novels/                    # Author platform
│   ├── events/                    # From nhimbe
│   ├── weather/                   # Utility
│   └── _template/                 # Starter for new mini-apps
│
├── services/                      # Cloudflare Workers + Containers
│   ├── gateway/                   # API gateway
│   ├── id-api/                    # Mukoko ID (Stytch)
│   ├── clips-api/                 # News/Clips
│   ├── events-api/                # Events
│   ├── pulse-api/                 # Trending content
│   ├── connect-api/               # Circles
│   ├── novels-api/                # Author platform
│   ├── weather-api/               # Weather
│   ├── wallet-api/                # Payments + tokens
│   ├── shamwari-api/              # AI companion (Cloudflare AI)
│   ├── miniapp-registry/          # Mini-app manifest + R2 assets
│   └── digital-twin/              # NFT + reputation
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
├── web/                           # Landing page (deployed to Vercel)
├── docs/                          # Architecture docs, guides, ADRs
├── .github/                       # CI/CD workflows
├── turbo.json                     # Monorepo config
├── pnpm-workspace.yaml            # Workspace definition
└── CLAUDE.md                      # THIS FILE
```

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

| Mineral | Light Mode | Dark Mode | Mukoko Usage |
|---------|-----------|-----------|--------------|
| **Tanzanite** | `#4B0082` | `#B388FF` | **Primary** — CTAs, active states, nav |
| **Cobalt** | `#0047AB` | `#00B0FF` | **Secondary** — Links, info, secondary actions |
| **Gold** | `#5D4037` | `#FFD740` | **Accent** — Rewards, wallet, honey |
| **Malachite** | `#004D40` | `#64FFDA` | Shamwari AI, success states |
| **Terracotta** | `#8B4513` | `#D4A574` | Community, Ubuntu |

### Typography
- **Display:** Noto Serif
- **Body:** Plus Jakarta Sans
- **Code:** JetBrains Mono

### Design Rules
- Button radius: `12px`, Card radius: `16px`
- Touch targets: `44x44px` minimum
- Zimbabwe flag strip: 4px vertical left edge (hidden < 480px)
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

| Action | Budget |
|--------|--------|
| App install | < 25MB |
| Mini-app first load | < 150KB gzipped |
| News feed refresh (20 articles) | < 50KB |
| Your Honey model sync | < 500KB delta |
| Image thumbnails | < 30KB WebP |

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

---

## QUICK REFERENCE

| Item | Value |
|------|-------|
| Primary color | Tanzanite `#4B0082` / `#B388FF` |
| Auth provider | Stytch |
| Primary database | MongoDB Atlas |
| Edge cache | Cloudflare KV + D1 |
| Object storage | Cloudflare R2 |
| AI | Cloudflare AI + on-device TFLite/CoreML |
| Web deployment | Vercel |
| Worker deployment | Cloudflare Workers + Containers |
| Mini-app workers | Workers for Platforms |
| Framework | Flutter + Preact WebView mini-apps |
| State management | Riverpod |
| Blockchain | Base (NFT + tokens) |
| Payments | EcoCash → InnBucks → MUKOKO tokens |
| Monorepo | Turborepo + pnpm |
| Node | 22+ |
| Min Android | API 24 (7.0) |
| Min iOS | 15.0 |

---

*Ndiri nekuti tiri — I am because we are.*
