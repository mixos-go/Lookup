# AGENT.md — LookUp Central Agent Rules

> **This file is the single source of truth for any AI agent or developer working on this codebase.**
> Read this entire file before touching any code. Every decision made here has a reason.

---

## 📌 Project Identity

| Key | Value |
|-----|-------|
| **Project Name** | LookUp |
| **Purpose** | Multi-platform stock, price, and image management for Shopee & TikTok Shop |
| **Architecture** | Monorepo — Expo (mobile) + Node.js (backend) |
| **Language** | TypeScript everywhere |
| **Primary Doc** | This file (`docs/AGENT.md`) |

---

## 📂 Linked Documentation

All documentation is in `docs/`. Every agent MUST read the relevant doc before working on that domain.

| File | Domain | When to Read |
|------|--------|--------------|
| `docs/AGENT.md` | Rules & conventions | **Always. First.** |
| `docs/ROADMAP.md` | Milestones & phases | Before planning any feature |
| `docs/API.md` | All API contracts | Before writing any endpoint or API call |
| `docs/SCHEMA.md` | Database design | Before any Prisma/DB work |
| `docs/UI_DESIGN.md` | Components, screens, layouts | Before any mobile UI work |
| `docs/PROJECT_MAP.md` | File tree, relationships, graphs | Before navigating or adding files |

---

## 🗂 Repository Structure

```
lookup/
├── apps/
│   ├── mobile/          → Expo React Native app (seller-facing)
│   └── backend/         → Node.js API server
├── docker/              → Docker Compose & nginx configs
├── docs/                → All markdown documentation
├── .env.example         → Environment variable template
└── README.md
```

### apps/mobile/src/ layout

```
src/
├── api/            → Typed HTTP clients (calls to OWN backend only)
├── components/
│   ├── atoms/      → Single-purpose, no logic (Button, Badge, Avatar)
│   ├── molecules/  → Composed atoms (ProductCard, ShopTag, StockInput)
│   └── organisms/  → Full sections (ProductList, BulkActionBar, ShopSelector)
├── screens/        → One file per screen, named <ScreenName>Screen.tsx
├── navigation/     → Stack/Tab navigators only, no business logic
├── stores/         → Zustand stores, one file per domain
├── hooks/          → Custom hooks, prefix with `use`
├── types/          → Shared TypeScript types/interfaces
├── utils/          → Pure functions, no React
└── constants/      → Enums, static config, palette
```

### apps/backend/src/ layout

```
src/
├── modules/        → Feature modules (each has: route, service, schema)
│   ├── auth/
│   ├── shops/
│   ├── products/
│   ├── inventory/
│   ├── price/
│   ├── images/
│   ├── webhooks/
│   └── bulk/
├── integrations/   → External API clients (Shopee, TikTok) — isolated here only
│   ├── shopee/
│   └── tiktok/
├── database/       → Prisma client singleton, migration helpers
├── queues/         → BullMQ worker definitions
├── cache/          → Redis helpers and cache keys
├── middleware/     → Auth guard, error handler, rate limiter
└── utils/          → Shared pure utilities
```

---

## ⚙️ Coding Rules

### TypeScript

- **Strict mode always on.** No `any`, no `ts-ignore` without a comment explaining why.
- Use `type` for data shapes. Use `interface` only for extendable contracts.
- All async functions must have explicit return types.
- Use `zod` for all runtime validation — both on API request bodies and responses from Shopee/TikTok.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `product-service.ts` |
| Components | PascalCase | `ProductCard.tsx` |
| Screens | PascalCase + Screen suffix | `BulkUpdateScreen.tsx` |
| Hooks | camelCase + use prefix | `useProductList.ts` |
| Stores | camelCase + Store suffix | `shopStore.ts` |
| Types | PascalCase | `ShopConnection`, `ProductVariant` |
| Env vars | SCREAMING_SNAKE | `SHOPEE_PARTNER_ID` |
| DB tables | snake_case | `shop_connections` |
| DB columns | snake_case | `access_token` |

### Backend Module Structure

Every module in `src/modules/` must follow this exact pattern:

```
modules/products/
├── product.route.ts     → Fastify route registrations
├── product.service.ts   → Business logic
├── product.schema.ts    → Zod schemas for request/response
└── product.types.ts     → TypeScript types for this module
```

No exceptions. No logic in route files. No DB calls outside service files.

### Integration Files

Files inside `src/integrations/shopee/` and `src/integrations/tiktok/` are the **only** places that may call Shopee or TikTok external APIs. Services call integration functions. Integration functions never call services.

```
integrations/shopee/
├── shopee.client.ts     → Axios instance + HMAC signing
├── shopee.product.ts    → Product-related API calls
├── shopee.inventory.ts  → Stock API calls
├── shopee.auth.ts       → OAuth token refresh
└── shopee.types.ts      → Raw Shopee API response types
```

### Mobile API Layer

- The mobile app **never** calls Shopee or TikTok APIs directly.
- All calls go through `src/api/` which points to the backend.
- Each file in `src/api/` maps to one backend module.

```typescript
// ✅ Correct
import { updateStock } from '@/api/inventory';

// ❌ Wrong — never do this in mobile
import axios from 'axios';
axios.post('https://partner.shopeemobile.com/api/v2/...')
```

---

## 🔄 State Management Rules

### Zustand Stores

One store per domain. Stores only hold **UI state** and **cached data**.

| Store | Holds |
|-------|-------|
| `authStore` | Current user session, JWT |
| `shopStore` | Connected shops list, active shop |
| `productStore` | Product list cache, selected products for bulk |
| `bulkStore` | Bulk job progress, results |
| `uiStore` | Loading states, modals, toasts |

### TanStack Query

Use React Query for all **server state** (products, inventory, prices). Zustand is for UI state only.

```typescript
// Query keys must be defined in constants/queryKeys.ts
export const QUERY_KEYS = {
  products: (shopId: string) => ['products', shopId],
  inventory: (productId: string) => ['inventory', productId],
} as const;
```

---

## 🌐 Environment Variables

Never hardcode any URL, key, or secret. All env vars are defined in `.env.example`.

### Mobile (Expo) — `apps/mobile/.env`

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Only `EXPO_PUBLIC_` prefixed vars are exposed to the app bundle. Never put secrets here.

### Backend — `apps/backend/.env`

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
SHOPEE_PARTNER_ID=...
SHOPEE_PARTNER_KEY=...
TIKTOK_APP_KEY=...
TIKTOK_APP_SECRET=...
```

---

## 🐳 Docker & Infrastructure

- Local dev uses `docker/docker-compose.yml` (PostgreSQL + Redis + backend together)
- The mobile Expo app runs locally with Metro, pointing at the backend container
- Production backend deploys to Railway (supports Docker + managed Postgres + Redis)
- Never commit `.env` files — only `.env.example`

Services in docker-compose:

| Service | Image | Port |
|---------|-------|------|
| `postgres` | postgres:16-alpine | 5432 |
| `redis` | redis:7-alpine | 6379 |
| `backend` | ./apps/backend | 3000 |
| `nginx` | nginx:alpine | 80 |

---

## 📋 Documentation Update Rules

**An agent MUST update the relevant markdown files when:**

| Change | Update Required |
|--------|----------------|
| New API endpoint added | `docs/API.md` → add under correct module section |
| New DB table/column | `docs/SCHEMA.md` → update Prisma schema section + ER diagram description |
| New screen added | `docs/UI_DESIGN.md` → add screen spec, `docs/PROJECT_MAP.md` → update file tree |
| New file/folder created | `docs/PROJECT_MAP.md` → update tree and dependency section |
| Milestone completed | `docs/ROADMAP.md` → mark milestone done with date |
| New env var needed | `.env.example` → add with comment |

**Format for marking roadmap items complete:**
```
- [x] Milestone Name — ✅ Done YYYY-MM-DD
```

---

## 🚫 Forbidden Patterns

- No `console.log` in production code — use the logger utility (`src/utils/logger.ts`)
- No raw SQL — Prisma ORM only
- No inline styles in React Native — use StyleSheet or NativeWind classes
- No API secrets in mobile bundle
- No business logic in navigation files
- No direct Shopee/TikTok calls outside `integrations/`
- No `useEffect` for data fetching — use React Query
- No unhandled Promise rejections — all async must be try/catch or `.catch()`
- No plural screen names — `ProductScreen` not `ProductsScreen`
- No index files re-exporting everything — import from the file directly

---

## 🔐 Authentication Flow

1. User opens app → `authStore` checks for stored JWT
2. If no JWT → redirect to `LoginScreen`
3. Login hits `POST /api/auth/login` on backend
4. Backend returns `{ accessToken, refreshToken }`
5. Store `accessToken` in memory (Zustand), `refreshToken` in SecureStore
6. All API requests attach `Authorization: Bearer <accessToken>`
7. On 401 → auto-refresh using `refreshToken` → retry request
8. OAuth for Shopee/TikTok is separate — handled in `ConnectShopScreen`

---

## 🔁 Bulk Update Queue Rules

- Bulk jobs use BullMQ with Redis as broker
- Each bulk job processes max 50 items per batch
- Failed items are retried 3 times with exponential backoff
- Job progress is pushed to client via polling endpoint `GET /api/bulk/:jobId/status`
- Never do bulk operations synchronously in a request handler

---

## 📱 Mobile Performance Rules

- All list screens use `@shopify/flash-list` — never FlatList for product lists
- Images use `expo-image` with caching enabled
- Skeleton loading for every data-fetching screen (no spinners alone)
- No screen mounts network calls in `useEffect` — use React Query `useQuery`
- Navigation transitions must be 60fps — no heavy logic on screen mount

---

## 🧪 Testing Conventions

- Backend: Vitest for unit + integration tests
- Mobile: Jest + React Native Testing Library
- Test files colocated: `product.service.test.ts` next to `product.service.ts`
- Integration tests for all external API clients using MSW mocks
- Min coverage for services: 80%

---

*Last updated: 2026-06-29 | Version: 1.0.0*
