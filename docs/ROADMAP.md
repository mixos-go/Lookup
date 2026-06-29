# ROADMAP.md — LookUp Development Phases

> Read `docs/AGENT.md` first. Update this file by marking milestones with ✅ and a date when completed.

---

## Overview

| Phase | Name | Duration | Status |
|-------|------|----------|--------|
| 0 | Foundation & Infrastructure | Week 1-2 | 🔲 Not Started |
| 1 | Auth & Shop Connection | Week 3-4 | 🔲 Not Started |
| 2 | Product Management Core | Week 5-6 | 🔲 Not Started |
| 3 | Stock & Price Update | Week 7-8 | 🔲 Not Started |
| 4 | Bulk Operations | Week 9-10 | 🔲 Not Started |
| 5 | Image Management | Week 11 | 🔲 Not Started |
| 6 | Real-time & Webhooks | Week 12 | 🔲 Not Started |
| 7 | Multi-shop UX Polish | Week 13 | 🔲 Not Started |
| 8 | Production Hardening | Week 14-15 | 🔲 Not Started |

---

## Phase 0 — Foundation & Infrastructure

**Goal:** Codebase bisa jalan locally, Docker services up, CI working.

### Backend

- [ ] Init Node.js + TypeScript + Fastify project di `apps/backend`
- [ ] Setup Prisma dengan PostgreSQL connection
- [ ] Jalankan migration pertama (users, shop_connections tables)
- [ ] Setup Redis connection + BullMQ
- [ ] Buat logger utility (Winston/Pino)
- [ ] Buat error handler middleware global
- [ ] Setup environment config validation (Zod)
- [ ] Health check endpoint `GET /health`
- [ ] Setup Vitest + test scripts

### Mobile

- [ ] Init Expo project dengan TypeScript template di `apps/mobile`
- [ ] Install dan konfigurasi: Zustand, TanStack Query, Axios
- [ ] Install React Navigation (Stack + Bottom Tab)
- [ ] Setup NativeWind
- [ ] Buat `src/api/client.ts` — base Axios instance dengan interceptors
- [ ] Setup token refresh interceptor
- [ ] Buat folder structure sesuai `AGENT.md`
- [ ] Setup absolute imports (`@/...`)

### Infrastructure

- [ ] Tulis `docker/docker-compose.yml` (postgres, redis, backend, nginx)
- [ ] Tulis `docker/docker-compose.prod.yml` untuk Railway
- [ ] Buat `nginx/nginx.conf` sebagai reverse proxy ke backend
- [ ] Setup `.env.example` dengan semua variabel
- [ ] Setup `.gitignore` yang proper
- [ ] Verifikasi `docker-compose up` berjalan tanpa error

**Deliverable:** `docker-compose up` → semua services green. Expo app bisa hit `/health`.

---

## Phase 1 — Auth & Shop Connection

**Goal:** User bisa register/login, lalu connect toko Shopee & TikTok via OAuth.

### Backend

- [ ] `POST /api/auth/register` — user registration
- [ ] `POST /api/auth/login` — return JWT access + refresh token
- [ ] `POST /api/auth/refresh` — refresh access token
- [ ] `POST /api/auth/logout` — invalidate refresh token
- [ ] JWT middleware (protect semua `/api/*` kecuali auth routes)
- [ ] Shopee OAuth flow:
  - [ ] `GET /api/shops/shopee/auth-url` — generate OAuth URL dengan HMAC signing
  - [ ] `GET /api/shops/shopee/callback` — exchange code → access_token, simpan ke DB
  - [ ] `POST /api/shops/shopee/refresh` — auto-refresh Shopee token
- [ ] TikTok OAuth flow:
  - [ ] `GET /api/shops/tiktok/auth-url` — generate OAuth URL
  - [ ] `GET /api/shops/tiktok/callback` — exchange code → token, simpan ke DB
  - [ ] `POST /api/shops/tiktok/refresh` — auto-refresh TikTok token
- [ ] `GET /api/shops` — list semua connected shops milik user
- [ ] `DELETE /api/shops/:shopId` — disconnect toko
- [ ] Token encryption at rest (encrypt access_token di DB)

### Mobile

- [ ] `LoginScreen` — email + password form
- [ ] `RegisterScreen` — register form
- [ ] `ShopListScreen` — list connected shops (Shopee + TikTok)
- [ ] `ConnectShopScreen` — pilih platform, open WebView untuk OAuth
- [ ] In-app WebView OAuth handler (intercept callback URL)
- [ ] `authStore` — session management
- [ ] `shopStore` — connected shops
- [ ] Auto-redirect ke login jika tidak ada session

**Deliverable:** User bisa login dan connect minimal 1 toko Shopee + 1 toko TikTok.

---

## Phase 2 — Product Management Core

**Goal:** Bisa lihat daftar produk dari semua toko yang connected, dengan detail lengkap.

### Backend

- [ ] Shopee integration client (`integrations/shopee/shopee.client.ts`)
  - [ ] HMAC-SHA256 request signing
  - [ ] Auto-inject partner_id, timestamp, access_token
  - [ ] Error normalization
- [ ] TikTok integration client (`integrations/tiktok/tiktok.client.ts`)
  - [ ] Authorization header builder
  - [ ] Error normalization
- [ ] `GET /api/products?shopId=&page=&limit=&search=` — list produk dari satu toko
- [ ] `GET /api/products/:productId?shopId=` — detail produk (dengan variants/SKU)
- [ ] Product caching di Redis (TTL: 5 menit)
- [ ] `GET /api/products/sync?shopId=` — force sync dari platform ke cache

### Mobile

- [ ] `ProductListScreen` — list semua produk satu toko
  - [ ] FlashList dengan infinite scroll
  - [ ] Search bar
  - [ ] Filter: by status (active, inactive, sold out)
  - [ ] Skeleton loading
- [ ] `ProductDetailScreen` — detail produk
  - [ ] Gambar carousel
  - [ ] Variant/SKU table
  - [ ] Stok per variant
  - [ ] Harga per variant
- [ ] `ShopSwitcherBar` — component di atas list untuk ganti toko aktif
- [ ] `productStore` — product list cache + selected state

**Deliverable:** Bisa browse semua produk dari semua toko yang terhubung.

---

## Phase 3 — Stock & Price Update

**Goal:** Bisa update stok dan harga produk individual maupun per-variant.

### Backend

- [ ] `PATCH /api/inventory/:productId` — update stok (support per-variant)
  - [ ] Shopee: hit `POST /api/v2/product/update_stock`
  - [ ] TikTok: hit `PUT /product/202309/inventories`
  - [ ] Return updated inventory state
- [ ] `PATCH /api/price/:productId` — update harga
  - [ ] Shopee: hit `POST /api/v2/product/update_price_info`
  - [ ] TikTok: hit `PUT /product/202309/products/{id}/prices`
- [ ] Input validation dengan Zod (min 0 stock, valid price range)
- [ ] Audit log: setiap update dicatat di tabel `update_logs`
- [ ] Optimistic update support (return immediately, confirm via webhook/poll)

### Mobile

- [ ] `EditStockScreen` — edit stok per produk
  - [ ] Input field per SKU/variant
  - [ ] Confirmation dialog sebelum submit
  - [ ] Success/error toast
- [ ] `EditPriceScreen` — edit harga per produk
  - [ ] Original price + discounted price inputs
  - [ ] Preview calculated discount %
- [ ] `StockBadge` component — visual indicator stok (hijau/kuning/merah)
- [ ] Inline edit di ProductDetailScreen untuk quick update

**Deliverable:** Seller bisa update stok dan harga produk satu per satu.

---

## Phase 4 — Bulk Operations

**Goal:** Bisa select multiple produk dan update stok/harga sekaligus.

### Backend

- [ ] BullMQ setup: `bulk-update` queue dengan Redis
- [ ] `POST /api/bulk/stock` — create bulk stock update job
  - [ ] Validate payload (max 200 items)
  - [ ] Enqueue job, return `{ jobId }`
- [ ] `POST /api/bulk/price` — create bulk price update job
- [ ] `GET /api/bulk/:jobId/status` — polling endpoint
  - [ ] Return: `{ status, progress, total, success, failed, errors }`
- [ ] BullMQ Worker (`queues/bulk-update.worker.ts`):
  - [ ] Process 50 items per batch
  - [ ] Delay 200ms antara batch (respect rate limit)
  - [ ] Retry failed items 3x dengan exponential backoff
  - [ ] Update job progress setiap batch selesai
- [ ] `GET /api/bulk/history` — history bulk jobs milik user

### Mobile

- [ ] Multi-select mode di `ProductListScreen`
  - [ ] Long-press untuk aktifkan mode
  - [ ] Checkbox per item
  - [ ] "Select All" button
  - [ ] Count badge: "X produk dipilih"
- [ ] `BulkActionBar` — floating bar di bawah saat ada produk terpilih
  - [ ] Tombol "Update Stok" dan "Update Harga"
- [ ] `BulkStockUpdateScreen` — isi stok baru untuk semua selected products
  - [ ] Bisa set same value untuk semua (Apply to All)
  - [ ] Atau input individual
- [ ] `BulkPriceUpdateScreen` — same pattern untuk harga
- [ ] `BulkProgressScreen` — live progress bar polling
  - [ ] Success count, failed count
  - [ ] Error list untuk yang gagal
  - [ ] Retry failed items button
- [ ] `bulkStore` — selected products, job state, progress

**Deliverable:** Bisa bulk update stok/harga untuk 100+ produk sekaligus dengan progress tracking.

---

## Phase 5 — Image Management

**Goal:** Bisa update gambar produk dari mobile.

### Backend

- [ ] `POST /api/images/upload` — upload gambar ke platform
  - [ ] Shopee: `POST /api/v2/media_space/upload_image`
  - [ ] TikTok: `POST /product/202309/images/upload`
  - [ ] Accept multipart/form-data
  - [ ] Validate: max 5MB, format jpg/png/webp
  - [ ] Return: `{ imageUrl, imageId }`
- [ ] `PATCH /api/products/:productId/images` — update image list produk
  - [ ] Reorder images
  - [ ] Remove image
  - [ ] Set cover image

### Mobile

- [ ] `EditImageScreen` — manage gambar produk
  - [ ] Grid view gambar existing
  - [ ] Drag to reorder (react-native-draggable-flatlist)
  - [ ] Tap + untuk add gambar baru
  - [ ] Swipe atau long-press untuk hapus
  - [ ] Upload progress indicator per gambar
- [ ] Image picker integration (expo-image-picker)
- [ ] Image compression sebelum upload (expo-image-manipulator)
- [ ] Camera support untuk foto langsung

**Deliverable:** Seller bisa manage gambar produk langsung dari HP.

---

## Phase 6 — Real-time & Webhooks

**Goal:** App mendapat update otomatis ketika ada perubahan di platform.

### Backend

- [ ] TikTok Webhook receiver (`modules/webhooks/`)
  - [ ] `POST /webhooks/tiktok` — endpoint publik
  - [ ] Verify signature TikTok
  - [ ] Handle event: `product.updated`, `inventory.updated`
  - [ ] Invalidate Redis cache setelah event
- [ ] Shopee Webhook receiver
  - [ ] `POST /webhooks/shopee`
  - [ ] Handle event: `SHOP_UPDATE`, `ITEM_BANNED`
- [ ] Server-Sent Events (SSE) endpoint
  - [ ] `GET /api/events/stream` — client subscribe untuk real-time updates
  - [ ] Push event saat webhook diterima

### Mobile

- [ ] SSE client di `hooks/useRealtimeEvents.ts`
- [ ] Auto-invalidate React Query cache saat ada SSE event
- [ ] Visual indicator "Live" di header saat connected
- [ ] Toast notification saat ada perubahan dari platform

**Deliverable:** Perubahan stok dari platform langsung reflect di app tanpa refresh manual.

---

## Phase 7 — Multi-shop UX Polish

**Goal:** Pengalaman manage multi-toko yang smooth dan intuitif.

### Mobile

- [ ] `HomeScreen` (Dashboard)
  - [ ] Summary card per toko: total produk, stok kritis, perlu update
  - [ ] Quick action buttons
  - [ ] Recent update history
- [ ] Cross-shop product search — cari produk di semua toko sekaligus
- [ ] `ShopCompareScreen` — bandingkan harga produk yang sama di Shopee vs TikTok
- [ ] Notifikasi lokal: stok kritis (< threshold yang di-set user)
- [ ] Export CSV ringkasan stok semua toko
- [ ] Dark mode support
- [ ] Onboarding flow untuk user baru (3-step walkthrough)

**Deliverable:** App terasa polished dan professional untuk seller multi-platform.

---

## Phase 8 — Production Hardening

**Goal:** Siap deploy ke production dengan reliability dan security yang proper.

### Backend

- [ ] Rate limiting per user (100 req/menit)
- [ ] Request validation hardening
- [ ] Security headers (Helmet)
- [ ] API key rotation mechanism untuk shop connections
- [ ] Database connection pooling optimization
- [ ] Query performance audit + indexes
- [ ] Logging: structured JSON logs ke stdout (Railway-compatible)
- [ ] Error tracking integration (Sentry)
- [ ] Health check endpoint yang detail (`/health/detailed`)
- [ ] Graceful shutdown

### Mobile

- [ ] Sentry crash reporting
- [ ] Expo Updates (OTA update)
- [ ] App icon + splash screen final
- [ ] Deep linking untuk OAuth callback
- [ ] Accessibility audit (a11y labels)
- [ ] Performance profiling (remove unnecessary re-renders)
- [ ] Build EAS untuk TestFlight + internal testing

### Infrastructure

- [ ] `docker-compose.prod.yml` finalized
- [ ] Railway deployment scripts
- [ ] Environment secrets management
- [ ] Database backup strategy
- [ ] Monitoring: Uptime check untuk backend

**Deliverable:** App live di TestFlight. Backend running di Railway dengan monitoring.

---

## Dependency Map

Phase 1 requires Phase 0 ✓
Phase 2 requires Phase 1 ✓
Phase 3 requires Phase 2 ✓
Phase 4 requires Phase 3 ✓
Phase 5 requires Phase 2 (independent dari Phase 3-4)
Phase 6 requires Phase 2 ✓
Phase 7 requires Phase 3 + Phase 4 + Phase 5 + Phase 6 ✓
Phase 8 requires all previous phases ✓

---

*Last updated: 2026-06-29 | Read AGENT.md for update conventions.*
