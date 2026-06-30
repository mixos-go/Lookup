# SCHEMA.md — LookUp Database Schema

> Read `docs/AGENT.md` first. ORM: Prisma. Database: PostgreSQL 16. All timestamps in UTC.

---

## Design Principles

- All primary keys are `cuid()` strings, never sequential integers
- All `createdAt`/`updatedAt` managed by Prisma `@updatedAt`
- Sensitive fields (access_token, refresh_token) are AES-256 encrypted before storage
- Soft deletes where applicable (use `deletedAt` timestamp instead of hard delete)
- Foreign keys always indexed
- No JSON blobs for queryable fields — normalize into columns

---

## Prisma Schema

```prisma
// apps/backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Users ────────────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String    @map("password_hash")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  refreshTokens RefreshToken[]
  shops         ShopConnection[]
  bulkJobs      BulkJob[]

  @@map("users")
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

// ─── Shop Connections ─────────────────────────────────────────────────────────

enum Platform {
  SHOPEE
  TIKTOK
}

enum ShopStatus {
  ACTIVE
  TOKEN_EXPIRED
  DISCONNECTED
}

model ShopConnection {
  id               String     @id @default(cuid())
  userId           String     @map("user_id")
  platform         Platform
  platformShopId   String     @map("platform_shop_id")  // Shopee shop_id or TikTok shop_id
  shopName         String     @map("shop_name")
  region           String     // "ID", "MY", "TH", etc.
  status           ShopStatus @default(ACTIVE)

  // Encrypted at application layer before storing
  accessTokenEnc   String     @map("access_token_enc")
  refreshTokenEnc  String     @map("refresh_token_enc")
  tokenExpiresAt   DateTime   @map("token_expires_at")
  // TikTok only: shop_cipher is required on EVERY TikTok API request
  // (separate from shop_id). Obtained from GET /seller/202309/shops
  // after OAuth. Null for Shopee shops.
  shopCipherEnc    String?    @map("shop_cipher_enc")

  lastSyncAt       DateTime?  @map("last_sync_at")
  createdAt        DateTime   @default(now()) @map("created_at")
  updatedAt        DateTime   @updatedAt @map("updated_at")
  disconnectedAt   DateTime?  @map("disconnected_at")

  user       User         @relation(fields: [userId], references: [id])
  bulkJobs   BulkJob[]
  updateLogs UpdateLog[]

  @@unique([userId, platform, platformShopId])
  @@index([userId])
  @@index([status])
  @@map("shop_connections")
}

// ─── Product Cache ─────────────────────────────────────────────────────────────
// This is a local cache of product data pulled from platforms.
// Source of truth is always the platform. Sync via /api/products/sync.

model ProductCache {
  id                 String    @id @default(cuid())
  shopConnectionId   String    @map("shop_connection_id")
  platformProductId  String    @map("platform_product_id")  // Shopee item_id or TikTok product_id
  name               String
  coverImageUrl      String?   @map("cover_image_url")
  status             String    // raw status string from platform
  totalStock         Int       @default(0) @map("total_stock")
  minPrice           Decimal   @map("min_price") @db.Decimal(15, 2)
  maxPrice           Decimal   @map("max_price") @db.Decimal(15, 2)
  currency           String    @default("IDR")
  variantCount       Int       @default(1) @map("variant_count")
  rawData            Json      @map("raw_data")   // full platform response cached
  platformUpdatedAt  DateTime? @map("platform_updated_at")
  cachedAt           DateTime  @default(now()) @map("cached_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  // No FK to ShopConnection via Prisma — we manage this manually
  // because shop can be deleted but we keep cache history

  @@unique([shopConnectionId, platformProductId])
  @@index([shopConnectionId])
  @@index([status])
  @@index([totalStock])
  @@map("product_cache")
}

// ─── Update Logs ──────────────────────────────────────────────────────────────
// Audit trail for every update sent to platform.

enum UpdateType {
  STOCK
  PRICE
  IMAGE
  PRODUCT_INFO
}

enum UpdateStatus {
  SUCCESS
  FAILED
  PENDING
}

model UpdateLog {
  id               String       @id @default(cuid())
  shopConnectionId String       @map("shop_connection_id")
  platformProductId String      @map("platform_product_id")
  variantId        String?      @map("variant_id")
  updateType       UpdateType   @map("update_type")
  status           UpdateStatus
  previousValue    Json?        @map("previous_value")
  newValue         Json         @map("new_value")
  platformResponse Json?        @map("platform_response")
  errorMessage     String?      @map("error_message")
  bulkJobId        String?      @map("bulk_job_id")
  createdAt        DateTime     @default(now()) @map("created_at")

  shopConnection ShopConnection @relation(fields: [shopConnectionId], references: [id])

  @@index([shopConnectionId])
  @@index([platformProductId])
  @@index([updateType])
  @@index([createdAt])
  @@index([bulkJobId])
  @@map("update_logs")
}

// ─── Bulk Jobs ────────────────────────────────────────────────────────────────

enum BulkJobType {
  STOCK
  PRICE
}

enum BulkJobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  PARTIAL       // some succeeded, some failed
}

model BulkJob {
  id               String        @id @default(cuid())
  userId           String        @map("user_id")
  shopConnectionId String        @map("shop_connection_id")
  type             BulkJobType
  status           BulkJobStatus @default(QUEUED)
  totalItems       Int           @map("total_items")
  successCount     Int           @default(0) @map("success_count")
  failedCount      Int           @default(0) @map("failed_count")
  progress         Int           @default(0)  // 0-100
  payload          Json          // serialized list of items to process
  errors           Json?         // Array of { productId, variantId, errorCode, message }
  queueJobId       String?       @map("queue_job_id")  // BullMQ job ID
  startedAt        DateTime?     @map("started_at")
  completedAt      DateTime?     @map("completed_at")
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  user           User           @relation(fields: [userId], references: [id])
  shopConnection ShopConnection @relation(fields: [shopConnectionId], references: [id])

  @@index([userId])
  @@index([shopConnectionId])
  @@index([status])
  @@index([createdAt])
  @@map("bulk_jobs")
}

// ─── Webhook Events ───────────────────────────────────────────────────────────
// Incoming webhook events from Shopee/TikTok, stored before processing.

model WebhookEvent {
  id          String   @id @default(cuid())
  platform    Platform
  eventType   String   @map("event_type")
  payload     Json
  signature   String?
  processed   Boolean  @default(false)
  processedAt DateTime? @map("processed_at")
  error       String?
  receivedAt  DateTime @default(now()) @map("received_at")

  @@index([platform])
  @@index([processed])
  @@index([receivedAt])
  @@map("webhook_events")
}

// ─── OAuth State ──────────────────────────────────────────────────────────────
// CSRF state tokens for OAuth flows. Short-lived.

model OAuthState {
  id        String   @id @default(cuid())
  state     String   @unique
  userId    String   @map("user_id")
  platform  Platform
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([state])
  @@index([expiresAt])
  @@map("oauth_states")
}
```

---

## Entity Relationship Description

### User → ShopConnection (One-to-Many)
One user can connect multiple shops. Each shop is tied to one platform (Shopee or TikTok). A user can have multiple Shopee shops and multiple TikTok shops simultaneously.

### ShopConnection → ProductCache (One-to-Many)
Each shop's products are cached locally per-shop. The cache is identified by `shopConnectionId + platformProductId` (unique pair). Cache is refreshed on sync or when invalidated by webhook.

### ShopConnection → UpdateLog (One-to-Many)
Every update sent to Shopee or TikTok creates an UpdateLog entry. This provides full audit trail per shop. Logs are never deleted.

### ShopConnection → BulkJob (One-to-Many)
Bulk jobs are scoped per shop. A job belongs to both a User (for auth) and a ShopConnection (for platform context).

### BulkJob → UpdateLog (One-to-Many via bulkJobId)
Items processed by a bulk job each create their own UpdateLog. Link via `bulkJobId` field on UpdateLog.

### User → RefreshToken (One-to-Many)
Multiple device sessions supported. Each device gets its own refresh token. Revoking one doesn't affect others.

---

## Redis Key Schema

All Redis keys use `lookup:` prefix.

| Key Pattern | Type | TTL | Content |
|-------------|------|-----|---------|
| `lookup:product:{shopId}:{productId}` | String (JSON) | 5m | Full product detail from platform |
| `lookup:product_list:{shopId}:{page}:{filters_hash}` | String (JSON) | 2m | Paginated product list |
| `lookup:token_check:{shopConnectionId}` | String | 30s | Token validity flag |
| `lookup:sse:{userId}` | PubSub channel | - | Real-time event channel |
| `bull:bulk-update` | BullMQ queue | - | Managed by BullMQ |

---

## Database Indexes Summary

| Table | Index | Reason |
|-------|-------|--------|
| `users` | `email` UNIQUE | Login lookup |
| `refresh_tokens` | `token` UNIQUE | Token lookup on refresh |
| `refresh_tokens` | `userId` | Cascade operations |
| `shop_connections` | `userId` | List user's shops |
| `shop_connections` | `(userId, platform, platformShopId)` UNIQUE | Prevent duplicate connections |
| `shop_connections` | `status` | Filter active shops |
| `product_cache` | `(shopConnectionId, platformProductId)` UNIQUE | Cache lookup |
| `product_cache` | `totalStock` | Sort/filter by stock |
| `update_logs` | `shopConnectionId` | Audit by shop |
| `update_logs` | `createdAt` | Time-range queries |
| `bulk_jobs` | `userId` + `status` | List user's active jobs |
| `webhook_events` | `processed` + `receivedAt` | Process unhandled events |

---

## Migration Naming Convention

```
YYYYMMDD_description.sql
e.g.:
20260629_initial_schema.sql
20260701_add_product_cache.sql
20260710_add_webhook_events.sql
```

---

## Encryption

Fields marked `_enc` in the schema are AES-256-GCM encrypted using the `ENCRYPTION_KEY` env var before being stored. Decryption happens in `src/utils/crypto.ts`. The encryption key must be 32 bytes (256 bits) — generate with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never store plaintext OAuth tokens in the database.

---

*Last updated: 2026-06-29 | See AGENT.md for update conventions.*
