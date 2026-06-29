# API.md — LookUp API Reference

> Read `docs/AGENT.md` first. This covers: (1) Internal Backend API, (2) Shopee External API integration, (3) TikTok External API integration.

---

## Internal Backend API

**Base URL (dev):** `http://localhost:3000`
**Base URL (prod):** `https://api.lookup.app`
**Format:** All requests/responses in JSON. Multipart for image uploads.
**Auth:** `Authorization: Bearer <accessToken>` on all `/api/*` routes except auth.

### Standard Response Envelope

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 100 }   // only on paginated responses
}

// Error
{
  "success": false,
  "error": {
    "code": "SHOP_NOT_FOUND",
    "message": "Shop with id abc123 not found",
    "details": {}   // optional, zod validation errors etc
  }
}
```

### Standard Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | JWT valid but no permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request body failed Zod validation |
| `PLATFORM_ERROR` | 502 | Shopee/TikTok API returned error |
| `RATE_LIMITED` | 429 | Too many requests |
| `SHOP_NOT_CONNECTED` | 400 | Shop OAuth not completed |
| `TOKEN_EXPIRED` | 401 | Shopee/TikTok access token expired |

---

## Module: Auth

### POST /api/auth/register
Register new user account.

**Request Body:**
```typescript
{
  email: string;       // valid email
  password: string;    // min 8 chars
  name: string;        // min 2 chars
}
```

**Response 201:**
```typescript
{
  success: true;
  data: {
    user: { id: string; email: string; name: string; };
    accessToken: string;    // JWT, expires in 15m
    refreshToken: string;   // opaque token, expires in 30d
  }
}
```

---

### POST /api/auth/login

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response 200:** Same shape as register.

---

### POST /api/auth/refresh

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;  // rotated
  }
}
```

---

### POST /api/auth/logout

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response 200:**
```typescript
{ success: true; data: { message: "Logged out" } }
```

---

## Module: Shops

### GET /api/shops/shopee/auth-url
Generate Shopee OAuth authorization URL for user to open in WebView.

**Query Params:** none

**Response 200:**
```typescript
{
  success: true;
  data: {
    url: string;        // Shopee OAuth URL with HMAC signed params
    state: string;      // CSRF state token (store this, verify in callback)
  }
}
```

---

### GET /api/shops/shopee/callback
Called by Shopee after user authorizes. Handle via deep link or server redirect.

**Query Params:**
```
code: string        // authorization code from Shopee
shop_id: string     // Shopee shop ID
state: string       // must match state from auth-url
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    shop: {
      id: string;             // internal shop ID
      platformShopId: string; // Shopee's shop_id
      shopName: string;
      platform: "SHOPEE";
      region: string;         // e.g. "ID", "MY"
      connectedAt: string;
    }
  }
}
```

---

### GET /api/shops/tiktok/auth-url
Generate TikTok Shop OAuth URL.

**Response 200:**
```typescript
{
  success: true;
  data: {
    url: string;
    state: string;
  }
}
```

---

### GET /api/shops/tiktok/callback

**Query Params:**
```
code: string
state: string
```

**Response 200:** Same structure as Shopee callback with `platform: "TIKTOK"`.

---

### GET /api/shops
List all connected shops for current user.

**Response 200:**
```typescript
{
  success: true;
  data: {
    shops: Array<{
      id: string;
      platformShopId: string;
      shopName: string;
      platform: "SHOPEE" | "TIKTOK";
      region: string;
      status: "ACTIVE" | "TOKEN_EXPIRED" | "DISCONNECTED";
      productCount: number;
      connectedAt: string;
      lastSyncAt: string | null;
    }>
  }
}
```

---

### DELETE /api/shops/:shopId
Disconnect a shop (revoke tokens, remove from DB).

**Response 200:**
```typescript
{ success: true; data: { message: "Shop disconnected" } }
```

---

## Module: Products

### GET /api/products
List products from a specific shop with pagination and search.

**Query Params:**
```typescript
shopId: string;         // required — internal shop ID
page?: number;          // default 1
limit?: number;         // default 20, max 100
search?: string;        // search by name or SKU
status?: "ACTIVE" | "INACTIVE" | "SOLD_OUT" | "ALL";   // default "ALL"
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    products: Array<{
      id: string;               // internal ID
      platformProductId: string; // Shopee item_id or TikTok product_id
      name: string;
      coverImage: string;       // URL
      status: "ACTIVE" | "INACTIVE" | "SOLD_OUT";
      totalStock: number;       // sum of all variant stocks
      priceRange: {
        min: number;
        max: number;
        currency: string;       // "IDR", "MYR", etc
      };
      variantCount: number;
      updatedAt: string;
    }>;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }
}
```

---

### GET /api/products/:productId
Get full product detail including all variants.

**Query Params:**
```
shopId: string   // required
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    product: {
      id: string;
      platformProductId: string;
      name: string;
      description: string;
      images: Array<{ url: string; imageId: string; order: number; }>;
      status: string;
      category: string;
      variants: Array<{
        variantId: string;
        name: string;           // e.g. "Merah / XL"
        sku: string;
        stock: number;
        price: number;
        originalPrice: number;
        currency: string;
        attributes: Record<string, string>;  // { "color": "Red", "size": "XL" }
      }>;
      createdAt: string;
      updatedAt: string;
    }
  }
}
```

---

### POST /api/products/sync
Force sync products from platform to cache.

**Request Body:**
```typescript
{ shopId: string; }
```

**Response 200:**
```typescript
{
  success: true;
  data: { synced: number; message: string; }
}
```

---

## Module: Inventory (Stock)

### PATCH /api/inventory/:productId
Update stock for one or more variants of a product.

**Request Body:**
```typescript
{
  shopId: string;
  updates: Array<{
    variantId: string;
    stock: number;        // min: 0, max: 999999
  }>;
}
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    updated: Array<{
      variantId: string;
      previousStock: number;
      newStock: number;
    }>;
    platform: "SHOPEE" | "TIKTOK";
    updatedAt: string;
  }
}
```

**Possible errors:** `VALIDATION_ERROR`, `SHOP_NOT_CONNECTED`, `PLATFORM_ERROR`

---

## Module: Price

### PATCH /api/price/:productId
Update price for one or more variants.

**Request Body:**
```typescript
{
  shopId: string;
  updates: Array<{
    variantId: string;
    price: number;            // min: 1
    originalPrice?: number;   // must be >= price (for showing crossed-out price)
  }>;
}
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    updated: Array<{
      variantId: string;
      previousPrice: number;
      newPrice: number;
    }>;
    updatedAt: string;
  }
}
```

---

## Module: Images

### POST /api/images/upload
Upload an image to the platform's media library.

**Request:** `multipart/form-data`
```
shopId: string
platform: "SHOPEE" | "TIKTOK"
file: File   // max 5MB, jpg/png/webp only
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    imageId: string;    // platform image ID (use in update_product)
    imageUrl: string;
    width: number;
    height: number;
  }
}
```

---

### PATCH /api/products/:productId/images
Update image list/order for a product.

**Request Body:**
```typescript
{
  shopId: string;
  images: Array<{
    imageId: string;
    order: number;    // 0-indexed, 0 = cover
  }>;
}
```

**Response 200:**
```typescript
{
  success: true;
  data: { message: "Images updated" }
}
```

---

## Module: Bulk Operations

### POST /api/bulk/stock
Create a bulk stock update job.

**Request Body:**
```typescript
{
  shopId: string;
  items: Array<{
    productId: string;
    variantId: string;
    stock: number;
  }>;
}
// max 200 items per request
```

**Response 202:**
```typescript
{
  success: true;
  data: {
    jobId: string;
    status: "QUEUED";
    total: number;
    estimatedSeconds: number;
  }
}
```

---

### POST /api/bulk/price
Create a bulk price update job. Same structure as bulk/stock but with price fields.

**Request Body:**
```typescript
{
  shopId: string;
  items: Array<{
    productId: string;
    variantId: string;
    price: number;
    originalPrice?: number;
  }>;
}
```

**Response 202:** Same as bulk/stock.

---

### GET /api/bulk/:jobId/status
Poll job progress.

**Response 200:**
```typescript
{
  success: true;
  data: {
    jobId: string;
    status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
    progress: number;       // 0-100
    total: number;
    successCount: number;
    failedCount: number;
    errors: Array<{
      productId: string;
      variantId: string;
      errorCode: string;
      message: string;
    }>;
    startedAt: string | null;
    completedAt: string | null;
  }
}
```

---

### GET /api/bulk/history
List recent bulk jobs for current user.

**Query Params:**
```
shopId?: string   // filter by shop
limit?: number    // default 20
```

**Response 200:**
```typescript
{
  success: true;
  data: {
    jobs: Array<{
      jobId: string;
      type: "STOCK" | "PRICE";
      status: string;
      total: number;
      successCount: number;
      failedCount: number;
      createdAt: string;
    }>
  }
}
```

---

## Module: Webhooks (Public, No Auth)

### POST /webhooks/shopee
Receive Shopee push notifications.

**Headers:** `Authorization: <Shopee-generated signature>`

**Body:** Shopee webhook payload (varies by event type)

**Response:** Always `200 OK` immediately, process async.

---

### POST /webhooks/tiktok
Receive TikTok Shop webhook events.

**Headers:** Custom TikTok signature headers

**Body:** TikTok event payload

**Response:** Always `200 OK` immediately.

---

### GET /api/events/stream
Server-Sent Events stream for real-time client updates.

**Headers:** `Accept: text/event-stream`

**Events pushed:**
```
event: inventory_updated
data: { "productId": "...", "shopId": "...", "variantId": "...", "newStock": 5 }

event: price_updated
data: { "productId": "...", "shopId": "...", "newPrice": 50000 }

event: bulk_progress
data: { "jobId": "...", "progress": 45, "successCount": 90 }
```

---

## External: Shopee Open API v2

**Base URL:** `https://partner.shopeemobile.com`
**Auth:** HMAC-SHA256 signature on every request.

**Signature formula:**
```
sign = HMAC_SHA256(
  partner_key,
  "{partner_id}{api_path}{timestamp}{access_token}{shop_id}"
)
```

### Key Endpoints Used

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/shop/get_shop_info` | Get shop detail |
| GET | `/api/v2/product/get_item_list` | List products |
| GET | `/api/v2/product/get_item_base_info` | Product detail |
| POST | `/api/v2/product/update_stock` | Update stock |
| POST | `/api/v2/product/update_price_info` | Update price |
| POST | `/api/v2/product/update_item` | Update product (images) |
| POST | `/api/v2/media_space/upload_image` | Upload image |
| GET | `/api/v2/auth/token/get` | Exchange code for token |
| POST | `/api/v2/auth/access_token/get` | Refresh access token |

**Rate Limit:** Varies by endpoint. Typically 10-100 calls/second. Implement 200ms delay between batch calls.

**Shopee Update Stock Request:**
```typescript
POST /api/v2/product/update_stock
{
  item_id: number;
  stock_list: Array<{
    model_id: number;    // 0 if no variant
    seller_stock: Array<{ stock: number }>;
  }>;
}
```

**Shopee Update Price Request:**
```typescript
POST /api/v2/product/update_price_info
{
  item_id: number;
  price_list: Array<{
    model_id: number;
    original_price: number;
    current_price?: number;
  }>;
}
```

---

## External: TikTok Shop Open API

**Base URL:** `https://open-api.tiktokglobalshop.com`
**Auth:** `x-tts-access-token: <access_token>` header

### Key Endpoints Used

| Method | Path | Description |
|--------|------|-------------|
| GET | `/seller/202309/shops` | List shops |
| GET | `/product/202309/products` | List products |
| GET | `/product/202309/products/{id}` | Product detail |
| PUT | `/product/202309/products/{id}` | Update product |
| PUT | `/product/202309/inventories` | Update stock |
| PUT | `/product/202309/products/{id}/prices` | Update price |
| POST | `/product/202309/images/upload` | Upload image |
| POST | `/api/v2/token/oauth/access_token` | Get access token |
| POST | `/api/v2/token/refresh_token` | Refresh access token |

**TikTok Update Inventory Request:**
```typescript
PUT /product/202309/inventories
{
  skus: Array<{
    id: string;        // SKU/variant ID
    inventory: Array<{
      warehouse_id: string;
      quantity: number;
    }>;
  }>;
}
```

**TikTok Update Price Request:**
```typescript
PUT /product/202309/products/{product_id}/prices
{
  skus: Array<{
    id: string;
    sales_attributes: Array<{}>;
    price: {
      amount: string;        // string representation of price
      currency: string;      // "IDR"
    };
  }>;
}
```

**QPS Limit:** 20 requests/second for most endpoints.

---

*Last updated: 2026-06-29 | See AGENT.md for update conventions.*
