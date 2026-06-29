import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, inventoryApi, priceApi } from '@/api/index';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { ProductDetail } from '@/types';

export function useProductDetail(productId: string, shopId: string) {
  return useQuery<ProductDetail>({
    queryKey: QUERY_KEYS.productDetail(productId, shopId),
    queryFn: () => productsApi.detail(productId, shopId),
    staleTime: 20_000,
    enabled: !!productId && !!shopId,
  });
}

export function useUpdateStock(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { shopId: string; updates: Array<{ variantId: string; stock: number }> }) =>
      inventoryApi.updateStock(productId, input.shopId, input.updates),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productDetail(productId, vars.shopId) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdatePrice(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      shopId: string;
      updates: Array<{ variantId: string; price: number; originalPrice?: number }>;
    }) => priceApi.updatePrice(productId, input.shopId, input.updates),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productDetail(productId, vars.shopId) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
