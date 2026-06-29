// src/stores/shopStore.ts
import { create } from 'zustand';
import type { Shop } from '@/types';

interface ShopState {
  shops: Shop[];
  activeShopId: string | null;
  setShops: (shops: Shop[]) => void;
  setActiveShop: (shopId: string) => void;
  getActiveShop: () => Shop | null;
}

export const useShopStore = create<ShopState>((set, get) => ({
  shops: [],
  activeShopId: null,

  setShops: (shops) => {
    set({ shops, activeShopId: shops[0]?.id ?? null });
  },

  setActiveShop: (shopId) => set({ activeShopId: shopId }),

  getActiveShop: () => {
    const { shops, activeShopId } = get();
    return shops.find((s) => s.id === activeShopId) ?? null;
  },
}));
