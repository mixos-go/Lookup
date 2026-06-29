# LookUp

Multi-platform stock, price, and image management tool for Shopee & TikTok Shop sellers.

## Architecture

**Monorepo** (pnpm workspaces):
- `apps/backend` — Node.js/Fastify REST API, TypeScript strict, Prisma/PostgreSQL, Redis/BullMQ
- `apps/mobile` — Expo React Native (iOS + Android), NativeWind, TanStack Query

## Running the project

### Backend
```bash
cd apps/backend
pnpm install
pnpm db:migrate
pnpm dev
```

### Mobile
```bash
cd apps/mobile
pnpm install
pnpm start
```

## Environment variables

### Backend (`apps/backend/.env`)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
PORT=3000
CORS_ORIGIN=*
ENCRYPTION_KEY=...          # 32-byte hex for AES-256-GCM
SHOPEE_PARTNER_ID=...
SHOPEE_PARTNER_KEY=...
SHOPEE_REDIRECT_URL=...
TIKTOK_APP_KEY=...
TIKTOK_APP_SECRET=...
TIKTOK_REDIRECT_URL=...
```

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Deployment

Backend → Railway (multi-container). Config in `railway.json` and `apps/backend/Dockerfile`.
Mobile → Expo EAS. Config in `apps/mobile/eas.json`.

## User preferences

- No emojis anywhere in the codebase
- Use Feather icons exclusively (`@expo/vector-icons`)
- TypeScript strict mode throughout
- Indonesian language for UI text (labels, placeholders, messages)
- No index barrel files re-exporting everything — import from specific files
