# ROADMAP.md — LookUp Development Phases

> Read `docs/AGENT.md` first. Update this file by marking milestones with ✅ and a date when completed.

---

## Overview

| Phase | Name | Duration | Status |
|-------|------|----------|--------|
| 0 | Foundation & Infrastructure | Week 1-2 | ✅ Done |
| 1 | Auth & Shop Connection | Week 3-4 | ✅ Done |
| 2 | Product Management Core | Week 5-6 | ✅ Done |
| 3 | Stock & Price Update | Week 7-8 | ✅ Done |
| 4 | Bulk Operations | Week 9-10 | ✅ Done |
| 5 | Image Management | Week 11 | ✅ Done |
| 6 | Real-time & Webhooks | Week 12 | ✅ Done |
| 7 | Multi-shop UX Polish | Week 13 | 🔲 Not Started |
| 8 | Production Hardening | Week 14-15 | 🔲 Not Started |

---

## Phase 0 — Foundation & Infrastructure ✅ Done 2026-06-30

### Backend
- [x] Init Node.js + TypeScript + Fastify project di `apps/backend`
- [x] Setup Prisma dengan PostgreSQL connection
- [x] Migration pertama (users, shop_connections tables)
- [x] Setup Redis connection + BullMQ
- [x] Logger utility (Pino)
- [x] Error handler middleware global
- [x] Environment config validation (Zod)
- [x] Health check endpoint `GET /health`

### Mobile
- [x] Init Expo project dengan TypeScript template di `apps/mobile`
- [x] Install dan konfigurasi: Zustand, TanStack Query, Axios
- [x] Install React Navigation (Stack + Bottom Tab)
- [x] Buat `src/api/client.ts` — Axios instance dengan JWT interceptors
- [x] Setup token refresh interceptor
- [x] Folder structure sesuai `AGENT.md`
- [x] Absolute imports (`@/...`)

### Infrastructure
- [x] `docker/docker-compose.yml` (postgres, redis, backend, nginx)
- [x] `nginx/nginx.conf` sebagai reverse proxy
- [x] `.env.example` dengan semua variabel
- [x] `.gitignore`

---

## Phase 1 — Auth & Shop Connection ✅ Done 2026-06-30

### Backend
- [x] `POST /api/auth/register`
- [x] `POST /api/auth/login` — JWT access + refresh
- [x] `POST /api/auth/refresh` — rotate refresh token
- [x] `POST /api/auth/logout`
- [x] JWT middleware (protect `/api/*`)
- [x] Shopee OAuth flow: auth-url → callback → token exchange
- [x] TikTok OAuth flow: auth-url → callback → token exchange
- [x] FIX: Callback reads userId dari OAuthState (tidak dari JWT) ✅ 2026-06-30
- [x] FIX: Callback redirect ke deep link `lookup://oauth/callback` ✅ 2026-06-30
- [x] Token encryption at rest (AES-256-GCM)
- [x] `GET /api/shops` — list connected shops
- [x] `DELETE /api/shops/:shopId` — disconnect shop

### Mobile
- [x] `LoginScreen`
- [x] `RegisterScreen`
- [x] `ShopListScreen` — list + sync + disconnect
- [x] `ConnectShopScreen` — pilih platform, open browser OAuth
- [x] FIX: Deep link handler di `App.tsx` untuk OAuth callback ✅ 2026-06-30
- [x] `authStore` — session management
- [x] `shopStore` — connected shops + active shop

---

## Phase 2 — Product Management Core ✅ Done 2026-06-30

### Backend
- [x] Shopee integration client (HMAC-SHA256 signing)
- [x] TikTok integration client (header auth)
- [x] `GET /api/products` — list dengan pagination, search, status filter
- [x] FIX: Status filter di-pass ke platform API, bukan client-side ✅ 2026-06-30
- [x] `GET /api/products/:productId` — detail dengan variants
- [x] `POST /api/products/sync` — force sync ke product_cache
- [x] Product caching di Redis (TTL 2 menit)

### Mobile
- [x] `ProductListScreen` — FlashList + search + filter + select mode
- [x] `ProductDetailScreen` — cover image, variant table, action bar
- [x] `ShopSelector` — horizontal scroll chip di atas list
- [x] `ProductCard` molecule
- [x] `productStore` + `bulkStore`
- [x] `useProducts`, `useProductDetail` hooks

---

## Phase 3 — Stock & Price Update ✅ Done 2026-06-30

### Backend
- [x] `PATCH /api/inventory/:productId` — update stok per variant
- [x] `PATCH /api/price/:productId` — update harga per variant
- [x] Shopee: update_stock + update_price_info endpoints
- [x] TikTok: inventories + prices endpoints
- [x] FIX: TikTok warehouse_id diambil dari API seller ✅ 2026-06-30
- [x] Audit log di tabel `update_logs`

### Mobile
- [x] `EditStockScreen` — StockInput per variant
- [x] `EditPriceScreen` — PriceInput dengan harga coret
- [x] `StockInput` molecule (stepper)
- [x] `PriceInput` molecule (currency + discount %)

---

## Phase 4 — Bulk Operations ✅ Done 2026-06-30

### Backend
- [x] BullMQ queue `bulk-update`
- [x] `POST /api/bulk/stock` — create bulk stock job
- [x] `POST /api/bulk/price` — create bulk price job
- [x] `GET /api/bulk/:jobId/status` — polling endpoint
- [x] `GET /api/bulk/history` — job history
- [x] FIX: Worker di-import di `index.ts` ✅ 2026-06-30
- [x] Worker: batch 50 items, delay 250ms, retry 3x
- [x] FIX: Worker push progress via Redis pub/sub ke SSE ✅ 2026-06-30

### Mobile
- [x] Multi-select mode di `ProductListScreen`
- [x] `BulkActionBar` floating (animated)
- [x] `BulkStockUpdateScreen`
- [x] `BulkPriceUpdateScreen`
- [x] `BulkProgressScreen` — polling + animated progress
- [x] `bulkStore`

---

## Phase 5 — Image Management ✅ Done 2026-06-30

### Backend
- [x] `POST /api/images/upload` — multipart upload ke platform
- [x] FIX: `form-data` ditambahkan ke dependencies ✅ 2026-06-30
- [x] Shopee: upload_image endpoint
- [x] TikTok: images/upload endpoint
- [x] `PATCH /api/products/:productId/images` — update urutan gambar

### Mobile
- [x] `EditImageScreen` — grid, add, remove, cover badge
- [x] expo-image-picker integration
- [x] Upload progress indicator

---

## Phase 6 — Real-time & Webhooks ✅ Done 2026-06-30

### Backend
- [x] Shopee webhook receiver `POST /webhooks/shopee`
- [x] TikTok webhook receiver `POST /webhooks/tiktok`
- [x] WebhookEvent table — store sebelum process
- [x] FIX: SSE endpoint `GET /api/events/stream` — auth via header OR ?token= ✅ 2026-06-30
- [x] Redis pub/sub untuk push event ke SSE clients

### Mobile
- [x] FIX: `useRealtimeEvents.ts` — pakai `react-native-sse` (bukan native EventSource) ✅ 2026-06-30
- [x] Auto-invalidate React Query cache saat SSE event masuk
- [x] ActivityScreen — riwayat bulk jobs

---

## Phase 7 — Multi-shop UX Polish

**Goal:** Pengalaman manage multi-toko yang smooth dan intuitif.

### Mobile
- [ ] `HomeScreen` — dashboard lengkap dengan summary per toko
- [ ] Cross-shop product search
- [ ] Notifikasi lokal stok kritis
- [ ] Export CSV ringkasan stok semua toko
- [ ] Dark mode support
- [ ] Onboarding flow (3-step walkthrough)

---

## Phase 8 — Production Hardening

**Goal:** Siap deploy production dengan reliability dan security yang proper.

### Backend
- [ ] Rate limiting per-user per-route
- [ ] Shopee/TikTok token auto-refresh middleware (cek `tokenExpiresAt` sebelum call)
- [ ] Structured error logging (Sentry)
- [ ] Database index audit
- [ ] Graceful shutdown handling
- [ ] API key rotation mechanism

### Mobile
- [ ] Sentry crash reporting
- [ ] Expo Updates (OTA)
- [ ] App icon + splash screen final
- [ ] Accessibility audit (a11y)
- [ ] EAS Build setup (TestFlight + internal track)

### Infrastructure
- [ ] `docker-compose.prod.yml` finalized
- [ ] Railway deployment config
- [ ] Database backup strategy
- [ ] Uptime monitoring

---

## Third-Party API Compliance Fixes — 2026-06-30

Audit terhadap dokumentasi resmi Shopee Open API v2 dan TikTok Shop API v202309
menemukan 4 ketidaksesuaian kritis yang sudah diperbaiki:

- [x] TikTok: tambah `shop_cipher` (bukan `shop_id` di header) — wajib di setiap
      request TikTok v202309+, disimpan terenkripsi di `shopCipherEnc`
- [x] TikTok: implementasi signature HMAC-SHA256 yang benar
      (`path + sorted_params + body`, bukan hanya header token)
- [x] TikTok: fix field mapping `GET /seller/202309/shops` — pakai `id`/`cipher`/`name`
      bukan `shop_id`/`shop_name` yang tidak ada di response asli
- [x] Shopee: fix `item_status` filter — hapus nilai `SOLD_OUT`/`INACTIVE` yang tidak
      valid (Shopee hanya terima `NORMAL`/`BANNED`/`DELETED`/`UNLIST`); sold-out
      sekarang difilter client-side dari stock=0
- [x] Mobile: hapus 4 dead API files (`stock.api.ts`, `price.api.ts`, `shop.api.ts`,
      `product.api.ts`) yang memanggil endpoint backend yang tidak ada

## Expo/EAS Runtime Completeness Fix — 2026-06-30

Audit menemukan folder `apps/mobile/` tidak lengkap untuk menjalankan `expo start`
atau `eas build` — file konfigurasi runtime wajib hilang seluruhnya:

- [x] `babel.config.js` — **kritis**: tanpa ini, SEMUA import `@/...` di seluruh
      codebase (puluhan file) tidak resolve saat runtime meski lolos TypeScript
- [x] `metro.config.js` — wajib untuk NativeWind v4 CSS processing
- [x] `tailwind.config.js` + `src/global.css` — wajib untuk NativeWind v4
- [x] `eas.json` — wajib untuk `eas build`, 3 profile (development/preview/production)
      dengan `EXPO_PUBLIC_API_URL` berbeda per environment
- [x] `assets/` folder — `icon.png`, `splash.png`, `adaptive-icon.png`,
      `favicon.png` di-generate sebagai placeholder brand-blue (ganti dengan
      desain asli sebelum submit ke store)
- [x] `.gitignore`, `.easignore`, `.env.example` (mobile-specific)
- [x] `app.json` — tambah `runtimeVersion`, `updates.url`, `owner`,
      `buildNumber`/`versionCode` untuk EAS Build & Update
- [x] `package.json` — tambah 2 dependency yang hilang:
      `@react-navigation/native-stack` (dipakai di 13 file, beda package dari
      `@react-navigation/stack`) dan `babel-plugin-module-resolver`
      (diperlukan babel.config.js untuk resolve alias `@/`)
- [x] `DEPLOY.md` — tambah panduan lengkap setup mobile + EAS build + submit

*Last updated: 2026-06-30 | Phases 0-6 selesai oleh Replit + 2 bug fixes pass + third-party API compliance audit + Expo/EAS completeness fix.*
