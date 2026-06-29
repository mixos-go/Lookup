---
name: Backend Dockerfile pnpm
description: Backend Dockerfile must use pnpm with --filter flag; npm ci will fail in pnpm workspace.
---

# Backend Dockerfile — pnpm required

The workspace root uses pnpm (`pnpm-workspace.yaml`). Using `npm ci` in the Dockerfile will fail
because there is no root `package-lock.json`.

## Correct pattern
```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --filter @lookup/backend
```

The `--filter @lookup/backend` installs only backend dependencies, keeping the image lean.

**Why:** pnpm workspace protocol requires pnpm itself; npm/yarn cannot resolve workspace:* links.
**How to apply:** Any time a Dockerfile or CI script needs to install deps for this monorepo.
