export const QUERY_KEYS = {
  shops: () => ['shops'] as const,
  products: (shopId: string, filters?: object) => ['products', shopId, filters] as const,
  productDetail: (productId: string, shopId: string) => ['product', productId, shopId] as const,
  bulkJobStatus: (jobId: string) => ['bulk-job', jobId] as const,
  bulkHistory: (shopId?: string) => ['bulk-history', shopId] as const,
} as const;
