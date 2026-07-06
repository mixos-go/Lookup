// src/types/index.ts — All shared TypeScript types for LookUp mobile

export type Platform = 'SHOPEE' | 'TIKTOK';
export type ShopStatus = 'ACTIVE' | 'TOKEN_EXPIRED' | 'DISCONNECTED';
// Shopee returns: NORMAL (active), UNLIST (delisted by seller), BANNED, DELETED
// TikTok returns: ACTIVE, INACTIVE, SELLER_DEACTIVATED, PLATFORM_DEACTIVATED
// SOLD_OUT is derived (totalStock === 0, not a platform status)
export type ProductStatus =
  | 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT'       // normalised / legacy
  | 'NORMAL' | 'UNLIST' | 'BANNED' | 'DELETED' // Shopee native
  | 'SELLER_DEACTIVATED' | 'PLATFORM_DEACTIVATED'; // TikTok native
export type BulkJobStatusValue = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type BulkJobType = 'STOCK' | 'PRICE';
export type UpdateType = 'STOCK' | 'PRICE' | 'IMAGE';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

// ─── Shops ────────────────────────────────────────────────────────────────────
export interface Shop {
  id: string;
  platformShopId: string;
  shopName: string;
  platform: Platform;
  region: string;
  status: ShopStatus;
  productCount?: number;
  connectedAt: string;
  lastSyncAt: string | null;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export interface ProductSummary {
  id: string;
  platformProductId: string;
  name: string;
  coverImage: string;
  status: ProductStatus;
  totalStock: number;
  priceRange: { min: number; max: number; currency: string };
  variantCount: number;
  updatedAt: string;
}

export interface ProductVariant {
  variantId: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  originalPrice: number;
  currency: string;
  attributes: Record<string, string>;
}

export interface ProductImage {
  imageId: string;
  url: string;
  order: number;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  category: string;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

// ─── Bulk Jobs ────────────────────────────────────────────────────────────────
export interface BulkStockItem {
  productId: string;
  variantId: string;
  stock: number;
  productName?: string;
  variantName?: string;
}

export interface BulkPriceItem {
  productId: string;
  variantId: string;
  price: number;
  originalPrice?: number;
  productName?: string;
  variantName?: string;
}

export interface BulkJobError {
  productId: string;
  variantId: string;
  errorCode: string;
  message: string;
}

export interface BulkJobStatus {
  jobId: string;
  status: BulkJobStatusValue;
  progress: number;
  total: number;
  successCount: number;
  failedCount: number;
  errors: BulkJobError[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface BulkJobSummary {
  jobId: string;
  type: BulkJobType;
  status: string;
  total: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ProductDetail: { productId: string; shopId: string; productName: string };
  EditStock: { productId: string; shopId: string };
  EditPrice: { productId: string; shopId: string };
  EditImage: { productId: string; shopId: string };
  ConnectShop: undefined;
  BulkStockUpdate: undefined;
  BulkPriceUpdate: undefined;
  BulkProgress: { jobId: string; type: BulkJobType };
  Profile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Shops: undefined;
  Activity: undefined;
};
