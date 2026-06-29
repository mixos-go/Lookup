// src/stores/bulkStore.ts
import { create } from 'zustand';
import type { ProductSummary, BulkStockItem, BulkPriceItem } from '@/types';

interface BulkState {
  isSelectMode: boolean;
  selectedProducts: ProductSummary[];
  bulkStockItems: BulkStockItem[];
  bulkPriceItems: BulkPriceItem[];
  activeJobId: string | null;

  enterSelectMode: () => void;
  exitSelectMode: () => void;
  toggleProduct: (product: ProductSummary) => void;
  selectAll: (products: ProductSummary[]) => void;
  clearSelection: () => void;
  setBulkStockItems: (items: BulkStockItem[]) => void;
  setBulkPriceItems: (items: BulkPriceItem[]) => void;
  setActiveJobId: (jobId: string | null) => void;
  isSelected: (productId: string) => boolean;
}

export const useBulkStore = create<BulkState>((set, get) => ({
  isSelectMode: false,
  selectedProducts: [],
  bulkStockItems: [],
  bulkPriceItems: [],
  activeJobId: null,

  enterSelectMode: () => set({ isSelectMode: true }),

  exitSelectMode: () => set({ isSelectMode: false, selectedProducts: [] }),

  toggleProduct: (product) => {
    const { selectedProducts } = get();
    const exists = selectedProducts.some((p) => p.id === product.id);
    set({
      selectedProducts: exists
        ? selectedProducts.filter((p) => p.id !== product.id)
        : [...selectedProducts, product],
    });
  },

  selectAll: (products) => set({ selectedProducts: products }),

  clearSelection: () => set({ selectedProducts: [], isSelectMode: false }),

  setBulkStockItems: (items) => set({ bulkStockItems: items }),

  setBulkPriceItems: (items) => set({ bulkPriceItems: items }),

  setActiveJobId: (jobId) => set({ activeJobId: jobId }),

  isSelected: (productId) => get().selectedProducts.some((p) => p.id === productId),
}));
