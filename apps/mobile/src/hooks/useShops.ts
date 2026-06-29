import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '@/api/shops';
import { useShopStore } from '@/stores/shopStore';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { Shop } from '@/types';

export function useShops() {
  const { setShops } = useShopStore();

  return useQuery<Shop[]>({
    queryKey: QUERY_KEYS.shops(),
    queryFn: async () => {
      const result = await shopsApi.list();
      setShops(result);
      return result;
    },
    staleTime: 60_000,
  });
}

export function useConnectShop() {
  const queryClient = useQueryClient();

  const getShopeeAuthUrl = useMutation({
    mutationFn: () => shopsApi.getShopeeAuthUrl(),
  });

  const getTikTokAuthUrl = useMutation({
    mutationFn: () => shopsApi.getTikTokAuthUrl(),
  });

  const disconnect = useMutation({
    mutationFn: (shopId: string) => shopsApi.disconnect(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shops() });
    },
  });

  const sync = useMutation({
    mutationFn: (shopId: string) => shopsApi.sync(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shops() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { getShopeeAuthUrl, getTikTokAuthUrl, disconnect, sync };
}
