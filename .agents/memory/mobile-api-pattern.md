---
name: Mobile API pattern
description: How to call the Axios apiClient in mobile and unwrap responses correctly.
---

# Mobile API Pattern

## Rule
`apiClient` is an Axios instance. Every call returns `AxiosResponse<T>`.
Always destructure the response then access `.data` for the backend payload:

```ts
// Backend sends: { success: true, data: { ... } }
const { data } = await apiClient.get<{ success: boolean; data: YourType }>('/api/...');
// data is { success: true, data: YourType }
return data.data; // the actual payload
```

## Wrong pattern
```ts
const result = await apiClient.get('/api/...');
return result; // AxiosResponse — NOT the payload
```

## Where to find it
- `apps/mobile/src/api/client.ts` — Axios instance with JWT + auto-refresh interceptors
- `apps/mobile/src/api/index.ts` — canonical examples: productsApi, inventoryApi, priceApi, bulkApi

**Why:** Axios wraps the response body in `.data`. The backend also nests payload in `.data.data`. Forgetting either layer silently returns wrong types with no runtime error until runtime.
