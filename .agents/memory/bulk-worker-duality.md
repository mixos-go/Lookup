---
name: Bulk worker duality
description: Two bulk worker files exist; only the original one in queues/ is imported by index.ts.
---

# Bulk Worker Duality

Two bulk worker files exist in the backend:
1. `src/queues/bulk-update.worker.ts` — original, imported by `src/index.ts`
2. `src/workers/bulk.worker.ts` — newer version with explicit SSE redis pubsub events

The **original** in `queues/` is what actually runs. The `workers/bulk.worker.ts` is not currently imported.

**Why:** The workers/ version was created to add SSE progress broadcasting via redis pubsub,
but the queues/ version already updates `BulkJob.progress` in Postgres, which the SSE route
polls to serve progress events. Both approaches work; avoid importing both simultaneously
(double-processing).

**How to apply:** If adding SSE broadcasting, import `workers/bulk.worker.ts` and remove the
`queues/bulk-update.worker.ts` import from `src/index.ts`. Never import both.
