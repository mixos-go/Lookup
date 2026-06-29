import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/index';
import { shopsApi } from '@/api/shops';
import { useShopStore } from '@/stores/shopStore';
import { QUERY_KEYS } from '@/constants/queryKeys';

interface ProductFilters {
  search?: string;
  status?: string;
}

export function useProducts(filters: ProductFilters = {}) {
  const { activeShopId } = useShopStore();

  return useQuery({
    queryKey: QUERY_KEYS.products(activeShopId ?? '', filters),
    queryFn: () =>
      productsApi.list({
        shopId: activeShopId!,
        search: filters.search,
        status: filters.status,
      }),
    enabled: !!activeShopId,
    staleTime: 30_000,
  });
}

export function useSyncProducts() {
  const queryClient = useQueryClient();
  const { activeShopId } = useShopStore();

  return useMutation({
    mutationFn: (shopId?: string) => shopsApi.sync(shopId ?? activeShopId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shops() });
    },
  });
}
