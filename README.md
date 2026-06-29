# LookUp

Multi-platform stock, price, and image manager for Shopee & TikTok Shop.

## Quick Start

```bash
# 1. Clone and setup
cp .env.example apps/backend/.env
# Fill in Shopee + TikTok credentials in .env

# 2. Start all services (postgres + redis + backend + nginx)
cd docker
docker-compose up -d

# 3. Run database migrations
cd apps/backend
npm run db:migrate

# 4. Start mobile app
cd apps/mobile
npm install
npm start
```

## Documentation

| Doc | Description |
|-----|-------------|
| `docs/AGENT.md` | Rules & conventions — read first |
| `docs/ROADMAP.md` | Development phases |
| `docs/API.md` | All API contracts |
| `docs/SCHEMA.md` | Database schema |
| `docs/UI_DESIGN.md` | Screen & component specs |
| `docs/PROJECT_MAP.md` | File tree, graphs, data flows |
