# PROJECT_MAP.md — LookUp Full Project Map

> Read `docs/AGENT.md` first. This file is the navigation guide for AI agents and developers. It contains the complete file tree, inter-file relationships, data flows, and architecture graphs.

---

## Complete File Tree

```
lookup/
├── docs/
│   ├── AGENT.md                      ← Rules, conventions (READ FIRST)
│   ├── ROADMAP.md                    ← Development phases & milestones
│   ├── API.md                        ← All endpoint contracts
│   ├── SCHEMA.md                     ← Database schema (Prisma + Redis)
│   ├── UI_DESIGN.md                  ← Screen & component specifications
│   └── PROJECT_MAP.md                ← This file
│
├── apps/
│   ├── mobile/                       ← Expo React Native app
│   │   ├── App.tsx                   ← Root: QueryClient + GestureHandler + SafeArea
│   │   ├── app.json                  ← Expo config
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── api/
│   │       │   ├── client.ts         ← Axios instance, JWT interceptor, auto-refresh
│   │       │   ├── auth.ts           ← /api/auth/* calls
│   │       │   ├── shops.ts          ← /api/shops/* calls
│   │       │   └── index.ts          ← products, inventory, price, bulk APIs
│   │       │
│   │       ├── stores/
│   │       │   ├── authStore.ts      ← User session, isAuthenticated
│   │       │   ├── shopStore.ts      ← Connected shops, active shop
│   │       │   └── bulkStore.ts      ← Multi-select state, bulk job items
│   │       │
│   │       ├── navigation/
│   │       │   ├── RootNavigator.tsx ← Auth gate, main + modal stacks
│   │       │   └── MainTabNavigator.tsx ← 4 bottom tabs
│   │       │
│   │       ├── screens/
│   │       │   ├── LoginScreen.tsx           ← Phase 1
│   │       │   ├── RegisterScreen.tsx        ← Phase 1
│   │       │   ├── HomeScreen.tsx            ← Phase 7 (dashboard)
│   │       │   ├── ProductListScreen.tsx     ← Phase 2 (core list + select)
│   │       │   ├── ProductDetailScreen.tsx   ← Phase 2
│   │       │   ├── ShopListScreen.tsx        ← Phase 1
│   │       │   ├── ConnectShopScreen.tsx     ← Phase 1 (OAuth WebView)
│   │       │   ├── EditStockScreen.tsx       ← Phase 3
│   │       │   ├── EditPriceScreen.tsx       ← Phase 3
│   │       │   ├── EditImageScreen.tsx       ← Phase 5
│   │       │   ├── BulkStockUpdateScreen.tsx ← Phase 4
│   │       │   ├── BulkPriceUpdateScreen.tsx ← Phase 4
│   │       │   ├── ActivityScreen.tsx        ← Phase 7
│   │       │   └── BulkProgressScreen.tsx   ← Phase 4
│   │       │
│   │       ├── components/
│   │       │   ├── atoms/
│   │       │   │   ├── Button.tsx            ← Reusable button (6 variants)
│   │       │   │   ├── Badge.tsx             ← Status labels
│   │       │   │   ├── StockIndicator.tsx    ← Color-coded stock number
│   │       │   │   ├── PlatformTag.tsx       ← Shopee/TikTok label
│   │       │   │   ├── Skeleton.tsx          ← Animated shimmer loader
│   │       │   │   ├── Divider.tsx           ← Line separator
│   │       │   │   └── TextInput.tsx         ← Styled input with label
│   │       │   │
│   │       │   ├── molecules/
│   │       │   │   ├── ProductCard.tsx       ← List item (image + info + select)
│   │       │   │   ├── ShopTag.tsx           ← Shop name with platform color
│   │       │   │   ├── StockInput.tsx        ← Stepper input for stock
│   │       │   │   ├── PriceInput.tsx        ← Currency input with discount calc
│   │       │   │   ├── VariantRow.tsx        ← Table row for variant data
│   │       │   │   ├── SearchBar.tsx         ← Debounced search input
│   │       │   │   ├── EmptyState.tsx        ← No data placeholder
│   │       │   │   ├── ErrorState.tsx        ← Error with retry
│   │       │   │   ├── ProgressBar.tsx       ← Animated fill bar
│   │       │   │   └── JobStatusCard.tsx     ← Bulk job summary card
│   │       │   │
│   │       │   └── organisms/
│   │       │       ├── ProductList.tsx       ← FlashList + skeletons + states
│   │       │       ├── BulkActionBar.tsx     ← Floating action bar (animate in)
│   │       │       ├── ShopSelector.tsx      ← Horizontal shop chip scroll
│   │       │       ├── SummaryCard.tsx       ← Dashboard shop stats card
│   │       │       └── VariantTable.tsx      ← Scrollable variant table
│   │       │
│   │       ├── hooks/
│   │       │   ├── useShops.ts              ← React Query for shops list
│   │       │   ├── useProducts.ts           ← React Query for products + infinite
│   │       │   ├── useProductDetail.ts      ← React Query for single product
│   │       │   ├── useBulkJob.ts            ← Polling hook for job status
│   │       │   └── useRealtimeEvents.ts     ← SSE client hook
│   │       │
│   │       ├── types/
│   │       │   └── index.ts                 ← All TypeScript interfaces
│   │       │
│   │       ├── utils/
│   │       │   ├── format.ts                ← Currency, number formatters
│   │       │   └── platform.ts              ← Platform detection helpers
│   │       │
│   │       └── constants/
│   │           ├── colors.ts                ← Color palette
│   │           ├── queryKeys.ts             ← React Query key factory
│   │           └── index.ts                 ← Barrel export + API_URL
│   │
│   └── backend/                       ← Node.js + Fastify API
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── prisma/
│       │   └── schema.prisma              ← All DB models (see SCHEMA.md)
│       └── src/
│           ├── index.ts                   ← Server bootstrap, graceful shutdown
│           │
│           ├── modules/                   ← Feature modules (route + service + schema)
│           │   ├── auth/
│           │   │   ├── auth.route.ts      ← POST /api/auth/*
│           │   │   ├── auth.service.ts    ← register, login, token management
│           │   │   └── auth.schema.ts     ← Zod validation schemas
│           │   ├── shops/
│           │   │   ├── shop.route.ts      ← GET/DELETE /api/shops, OAuth URLs
│           │   │   └── shop.service.ts    ← listShops, getAuthUrl, disconnect
│           │   ├── products/
│           │   │   ├── product.route.ts   ← GET /api/products, /sync
│           │   │   └── product.service.ts ← listProducts, getDetail, syncProducts
│           │   ├── inventory/
│           │   │   ├── inventory.route.ts ← PATCH /api/inventory/:id
│           │   │   └── inventory.service.ts ← updateStock (routes to integration)
│           │   ├── price/
│           │   │   ├── price.route.ts     ← PATCH /api/price/:id
│           │   │   └── price.service.ts   ← updatePrice (routes to integration)
│           │   ├── images/
│           │   │   └── image.route.ts     ← POST /api/images/upload
│           │   ├── bulk/
│           │   │   ├── bulk.route.ts      ← POST /api/bulk/*, GET status/history
│           │   │   └── bulk.service.ts    ← createJob, getStatus, getHistory
│           │   ├── webhooks/
│           │   │   └── webhook.route.ts   ← POST /webhooks/*, GET /api/events/stream
│           │   └── index.ts               ← registerRoutes() — wires all modules
│           │
│           ├── integrations/              ← External API clients ONLY
│           │   ├── shopee/
│           │   │   ├── shopee.client.ts   ← Axios + HMAC-SHA256 signing
│           │   │   ├── shopee.auth.ts     ← OAuth URL gen, code exchange, refresh
│           │   │   └── shopee.product.ts  ← updateStock, updatePrice
│           │   └── tiktok/
│           │       ├── tiktok.client.ts   ← Axios + access-token header
│           │       ├── tiktok.auth.ts     ← OAuth URL gen, code exchange
│           │       └── tiktok.product.ts  ← updateInventory, updatePrice
│           │
│           ├── database/
│           │   └── client.ts              ← Prisma singleton
│           │
│           ├── cache/
│           │   └── redis.ts               ← IORedis client, getCache/setCache helpers
│           │
│           ├── queues/
│           │   └── bulk-update.worker.ts  ← BullMQ worker (batch processing)
│           │
│           ├── middleware/                ← (to implement: rate limit, error handler)
│           └── utils/
│               ├── env.ts                 ← Zod env validation
│               ├── logger.ts              ← Pino logger
│               └── crypto.ts             ← AES-256-GCM encrypt/decrypt
│
└── docker/
    ├── docker-compose.yml               ← Dev: postgres + redis + backend + nginx
    └── nginx/
        └── nginx.conf                   ← Reverse proxy config
```

---

## Architecture Overview

```mermaid
graph TB
  subgraph Mobile["📱 Expo Mobile App"]
    App["App.tsx\n(QueryClient + Providers)"]
    Nav["RootNavigator\n(Auth Gate)"]
    Tabs["MainTabNavigator\n(4 Tabs)"]
    Screens["Screens\n(14 total)"]
    Components["Components\n(Atoms → Molecules → Organisms)"]
    Stores["Zustand Stores\n(authStore, shopStore, bulkStore)"]
    ApiLayer["API Layer\n(src/api/*)"]
  end

  subgraph Backend["⚙️ Node.js Backend"]
    Fastify["Fastify Server\nsrc/index.ts"]
    Modules["Feature Modules\n(auth, shops, products,\ninventory, price, bulk, webhooks)"]
    Integrations["Integrations\n(shopee.*, tiktok.*)"]
    Worker["BullMQ Worker\nbulk-update.worker.ts"]
  end

  subgraph Infra["🐳 Infrastructure"]
    PG[("PostgreSQL\nUsers, Shops,\nLogs, Jobs")]
    Redis[("Redis\nCache + BullMQ Queue")]
    Nginx["Nginx\nReverse Proxy"]
  end

  subgraph External["🌐 External APIs"]
    ShopeeAPI["Shopee\nOpen API v2"]
    TikTokAPI["TikTok Shop\nAPI 202309"]
  end

  App --> Nav --> Tabs --> Screens
  Screens --> Components
  Screens --> Stores
  Screens --> ApiLayer
  ApiLayer -->|"REST + JWT"| Nginx
  Nginx --> Fastify
  Fastify --> Modules
  Modules --> Integrations
  Modules --> PG
  Modules --> Redis
  Integrations --> ShopeeAPI
  Integrations --> TikTokAPI
  Worker --> Integrations
  Worker --> PG
  Redis -->|"Queue Broker"| Worker
```

---

## Request Data Flow

### 1. Login Flow

```mermaid
sequenceDiagram
  participant App as Mobile App
  participant Store as authStore
  participant API as api/auth.ts
  participant Backend as auth.route.ts
  participant Service as auth.service.ts
  participant DB as PostgreSQL

  App->>Store: login(email, password)
  Store->>API: authApi.login()
  API->>Backend: POST /api/auth/login
  Backend->>Service: authService.login()
  Service->>DB: findUnique(email)
  DB-->>Service: User record
  Service->>Service: bcrypt.compare()
  Service-->>Backend: { id, email, name }
  Backend->>Backend: jwt.sign() → accessToken
  Service->>DB: create RefreshToken
  Backend-->>API: { user, accessToken, refreshToken }
  API-->>Store: result
  Store->>Store: setAccessToken(accessToken)
  Store->>Store: SecureStore.setItem(refreshToken)
  Store-->>App: isAuthenticated = true
  App->>App: Navigate to MainTabs
```

---

### 2. Shopee OAuth Flow

```mermaid
sequenceDiagram
  participant App as Mobile App
  participant WV as WebView
  participant Backend as shop.route.ts
  participant Integration as shopee.auth.ts
  participant Shopee as Shopee OAuth
  participant DB as PostgreSQL

  App->>Backend: GET /api/shops/shopee/auth-url
  Backend->>Integration: shopeeAuth.generateAuthUrl()
  Integration->>DB: create OAuthState (CSRF)
  Integration-->>Backend: { url, state }
  Backend-->>App: { url, state }
  App->>WV: Open OAuth URL
  WV->>Shopee: User authorizes
  Shopee-->>WV: Redirect to /api/shops/shopee/callback?code=...
  WV->>Backend: GET /api/shops/shopee/callback (intercepted deep link)
  Backend->>Integration: shopeeAuth.exchangeCode(code, shopId)
  Integration->>Shopee: POST /api/v2/auth/token/get
  Shopee-->>Integration: { access_token, refresh_token }
  Integration->>DB: encrypt tokens, create ShopConnection
  Backend-->>App: { shop: { id, shopName, platform } }
  App->>App: Close WebView → Show success
```

---

### 3. Bulk Stock Update Flow

```mermaid
sequenceDiagram
  participant App as Mobile App
  participant BulkStore as bulkStore
  participant API as api/bulk.ts
  participant Backend as bulk.route.ts
  participant Service as bulk.service.ts
  participant Queue as BullMQ Queue
  participant Worker as bulk-update.worker.ts
  participant Integration as shopee.product.ts
  participant DB as PostgreSQL

  App->>BulkStore: selectedProducts (long-press select)
  App->>App: Navigate BulkStockUpdateScreen
  App->>App: Fill stock values per variant
  App->>API: bulkApi.createStockJob(shopId, items)
  API->>Backend: POST /api/bulk/stock
  Backend->>Service: createStockJob()
  Service->>DB: create BulkJob (QUEUED)
  Service->>Queue: bulkQueue.add('process-stock', payload)
  Queue-->>Service: { jobId }
  Service-->>Backend: { jobId, status: QUEUED, estimatedSeconds }
  Backend-->>API: 202 Accepted
  API-->>App: { jobId }
  App->>App: Navigate BulkProgressScreen(jobId)

  loop Poll every 2s
    App->>API: bulkApi.getStatus(jobId)
    API->>Backend: GET /api/bulk/:jobId/status
    Backend->>DB: findUnique BulkJob
    DB-->>Backend: { progress, successCount, failedCount }
    Backend-->>App: Job status
    App->>App: Update progress UI
  end

  Worker->>Queue: dequeue job
  Worker->>Worker: process in batches of 50
  Worker->>Integration: shopeeProduct.updateStock()
  Integration->>Integration: Shopee API call + 200ms delay
  Worker->>DB: updateLog per item
  Worker->>DB: update BulkJob progress
  Worker->>DB: BulkJob status = COMPLETED | PARTIAL
```

---

### 4. Token Auto-Refresh Flow

```mermaid
sequenceDiagram
  participant App as Any API call
  participant Interceptor as Axios Interceptor
  participant SecureStore as SecureStore
  participant Backend as /api/auth/refresh

  App->>Interceptor: Request (expired accessToken)
  Interceptor->>Backend: Original request
  Backend-->>Interceptor: 401 Unauthorized
  Interceptor->>Interceptor: isRefreshing = true
  Interceptor->>SecureStore: get refreshToken
  SecureStore-->>Interceptor: refreshToken
  Interceptor->>Backend: POST /api/auth/refresh { refreshToken }
  Backend-->>Interceptor: { newAccessToken, newRefreshToken }
  Interceptor->>Interceptor: setAccessToken(newAccessToken) [in-memory]
  Interceptor->>SecureStore: store newRefreshToken
  Interceptor->>Interceptor: Retry all pending requests
  Interceptor-->>App: Original response
```

---

## Module Dependency Graph

```mermaid
graph LR
  subgraph Backend Modules
    auth["auth\nmodule"]
    shops["shops\nmodule"]
    products["products\nmodule"]
    inventory["inventory\nmodule"]
    price["price\nmodule"]
    images["images\nmodule"]
    bulk["bulk\nmodule"]
    webhooks["webhooks\nmodule"]
  end

  subgraph Integrations
    shopee_client["shopee.client\n(HMAC signing)"]
    shopee_auth["shopee.auth"]
    shopee_product["shopee.product"]
    tiktok_client["tiktok.client\n(header auth)"]
    tiktok_auth["tiktok.auth"]
    tiktok_product["tiktok.product"]
  end

  subgraph Infrastructure
    prisma["prisma\nclient"]
    redis["redis\nclient"]
    worker["bulk\nworker"]
  end

  auth --> prisma
  shops --> shopee_auth
  shops --> tiktok_auth
  shops --> prisma
  products --> shopee_product
  products --> tiktok_product
  products --> redis
  products --> prisma
  inventory --> shopee_product
  inventory --> tiktok_product
  inventory --> prisma
  price --> shopee_product
  price --> tiktok_product
  bulk --> prisma
  bulk --> redis
  worker --> inventory
  worker --> price
  worker --> prisma

  shopee_product --> shopee_client
  shopee_auth --> shopee_client
  tiktok_product --> tiktok_client
  tiktok_auth --> tiktok_client
```

---

## Mobile Store → Screen Dependency

```mermaid
graph TD
  authStore["authStore\n(user, isAuthenticated)"]
  shopStore["shopStore\n(shops, activeShopId)"]
  bulkStore["bulkStore\n(selectedProducts, jobId)"]

  RootNav["RootNavigator"] --> authStore
  ShopSelector["ShopSelector"] --> shopStore
  ProductListScreen["ProductListScreen"] --> shopStore
  ProductListScreen --> bulkStore
  BulkActionBar["BulkActionBar"] --> bulkStore
  BulkStockUpdateScreen["BulkStockUpdateScreen"] --> bulkStore
  BulkPriceUpdateScreen["BulkPriceUpdateScreen"] --> bulkStore
  BulkProgressScreen["BulkProgressScreen"] --> bulkStore
  ShopListScreen["ShopListScreen"] --> shopStore
  HomeScreen["HomeScreen"] --> authStore
  HomeScreen --> shopStore
```

---

## Database Table Relationships

```mermaid
erDiagram
  users {
    string id PK
    string email
    string name
    string password_hash
    datetime created_at
  }

  refresh_tokens {
    string id PK
    string token
    string user_id FK
    datetime expires_at
    datetime revoked_at
  }

  shop_connections {
    string id PK
    string user_id FK
    enum platform
    string platform_shop_id
    string shop_name
    string region
    enum status
    string access_token_enc
    string refresh_token_enc
    datetime token_expires_at
    datetime last_sync_at
  }

  product_cache {
    string id PK
    string shop_connection_id FK
    string platform_product_id
    string name
    int total_stock
    decimal min_price
    decimal max_price
    json raw_data
    datetime cached_at
  }

  update_logs {
    string id PK
    string shop_connection_id FK
    string platform_product_id
    string variant_id
    enum update_type
    enum status
    json previous_value
    json new_value
    string bulk_job_id FK
    datetime created_at
  }

  bulk_jobs {
    string id PK
    string user_id FK
    string shop_connection_id FK
    enum type
    enum status
    int total_items
    int success_count
    int failed_count
    int progress
    json payload
    json errors
    datetime started_at
    datetime completed_at
  }

  webhook_events {
    string id PK
    enum platform
    string event_type
    json payload
    boolean processed
  }

  oauth_states {
    string id PK
    string state
    string user_id FK
    enum platform
    datetime expires_at
  }

  users ||--o{ refresh_tokens : "has"
  users ||--o{ shop_connections : "owns"
  users ||--o{ bulk_jobs : "creates"
  shop_connections ||--o{ product_cache : "has"
  shop_connections ||--o{ update_logs : "has"
  shop_connections ||--o{ bulk_jobs : "targets"
  bulk_jobs ||--o{ update_logs : "generates"
```

---

## File Ownership by Phase

| Phase | Files to Create/Modify |
|-------|----------------------|
| 0 | `index.ts`, `utils/env.ts`, `utils/logger.ts`, `database/client.ts`, `cache/redis.ts`, `docker-compose.yml`, `App.tsx`, `api/client.ts` |
| 1 | `modules/auth/*`, `modules/shops/*`, `integrations/shopee/shopee.auth.ts`, `integrations/tiktok/tiktok.auth.ts`, `screens/LoginScreen.tsx`, `screens/RegisterScreen.tsx`, `screens/ShopListScreen.tsx`, `screens/ConnectShopScreen.tsx`, `stores/authStore.ts`, `stores/shopStore.ts` |
| 2 | `modules/products/*`, `integrations/shopee/shopee.product.ts`, `integrations/tiktok/tiktok.product.ts`, `screens/ProductListScreen.tsx`, `screens/ProductDetailScreen.tsx`, `components/molecules/ProductCard.tsx`, `components/organisms/ShopSelector.tsx`, `hooks/useProducts.ts` |
| 3 | `modules/inventory/*`, `modules/price/*`, `screens/EditStockScreen.tsx`, `screens/EditPriceScreen.tsx`, `components/molecules/StockInput.tsx`, `components/molecules/PriceInput.tsx` |
| 4 | `modules/bulk/*`, `queues/bulk-update.worker.ts`, `screens/BulkStockUpdateScreen.tsx`, `screens/BulkPriceUpdateScreen.tsx`, `screens/BulkProgressScreen.tsx`, `components/organisms/BulkActionBar.tsx`, `stores/bulkStore.ts`, `hooks/useBulkJob.ts` |
| 5 | `modules/images/*`, `integrations/shopee/shopee.images.ts`, `integrations/tiktok/tiktok.images.ts`, `screens/EditImageScreen.tsx` |
| 6 | `modules/webhooks/webhook.route.ts` (full impl), `hooks/useRealtimeEvents.ts` |
| 7 | `screens/HomeScreen.tsx`, `screens/ActivityScreen.tsx`, `components/organisms/SummaryCard.tsx` |
| 8 | `middleware/errorHandler.ts`, `middleware/rateLimiter.ts`, all tests `*.test.ts` |

---

## Key Implementation Notes for Agents

### When adding a new API endpoint:
1. Add route in the correct `modules/<name>/<name>.route.ts`
2. Add business logic in `modules/<name>/<name>.service.ts`
3. Add Zod schema in `modules/<name>/<name>.schema.ts`
4. If it calls Shopee/TikTok, add function in `integrations/`
5. Update `docs/API.md` with the new endpoint contract
6. Add corresponding API function in `apps/mobile/src/api/`

### When adding a new screen:
1. Create `apps/mobile/src/screens/<ScreenName>Screen.tsx`
2. Register in `RootNavigator.tsx` or `MainTabNavigator.tsx`
3. Add to `RootStackParamList` or `MainTabParamList` in `types/index.ts`
4. Update `docs/PROJECT_MAP.md` file tree
5. Reference `docs/UI_DESIGN.md` for the exact spec

### When adding a new store:
1. Create `apps/mobile/src/stores/<domain>Store.ts`
2. Follow Zustand pattern: `create<State>((set, get) => ({...}))`
3. Store only UI state — server state goes in React Query
4. Document in `docs/AGENT.md` store table

---

*Last updated: 2026-06-29 | See AGENT.md for update conventions.*
