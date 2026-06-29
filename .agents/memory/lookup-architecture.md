---
name: LookUp architecture
description: Core stack decisions for the LookUp monorepo — backend, mobile, infra, conventions.
---

# LookUp Architecture

## Monorepo layout
- `apps/backend` — Node.js/Fastify, TypeScript strict, Prisma/PostgreSQL, Redis/BullMQ
- `apps/mobile` — Expo React Native, NativeWind, NativeBase, TanStack Query
- Root: pnpm workspaces (`pnpm-workspace.yaml`)

## Backend
- Fastify with `@fastify/jwt` for auth (decorator `app.authenticate`)
- Routes registered via `registerModules(app)` in `src/modules/index.ts`
- Prisma client at `src/database/client.ts`
- Redis at `src/cache/redis.ts` (ioredis)
- BullMQ queue name: `bulk-update`
- Worker: `src/queues/bulk-update.worker.ts` (imported in index.ts)
- SSE events published via redis pubsub channel `job-progress:{jobId}`
- Platform integrations: `src/integrations/shopee/` and `src/integrations/tiktok/`

## Mobile
- Path alias `@/` → `src/`
- Constants (Colors, API_URL, QUERY_KEYS) in `src/constants/`
- API layer: `src/api/index.ts` (products, inventory, price, bulk) + `src/api/shops.ts` + `src/api/client.ts`
- Navigation: React Navigation native stack in `src/navigation/`
- Icons: Feather only from `@expo/vector-icons`; no emojis anywhere

## Deployment
- Backend → Railway (multi-container): `railway.json` at project root, `apps/backend/Dockerfile` (pnpm)
- Worker container: `apps/backend/Dockerfile.worker`
- Mobile → Expo EAS (`eas.json`)

**Why:** Strict TypeScript + monorepo enables shared types later. pnpm over npm for workspace link efficiency.
