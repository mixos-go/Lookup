import { useEffect, useRef } from 'react';
import EventSource from 'react-native-sse';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/api/client';
import { API_URL } from '@/constants';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';

type SSEEvent =
  | { type: 'inventory_updated'; productId: string; shopId: string; newStock: number }
  | { type: 'price_updated'; productId: string; shopId: string; newPrice: number }
  | { type: 'bulk_progress'; jobId: string; progress: number; successCount: number; status: string }
  | { type: 'shopee_event' | 'tiktok_event'; eventType: string; payload: unknown };

export function useRealtimeEvents(): void {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const esRef = useRef<InstanceType<typeof EventSource> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAccessToken();
    if (!token) return;

    // FIX: react-native-sse supports custom headers — no need for ?token= in URL
    const es = new EventSource(`${API_URL}/api/events/stream`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    esRef.current = es;

    es.addEventListener('connected', () => {
      // Connected successfully
    });

    es.addEventListener('inventory_updated', (e) => {
      if (!e.data) return;
      const data = JSON.parse(e.data) as SSEEvent & { type: 'inventory_updated' };
      // Invalidate the affected product's cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productDetail(data.productId, data.shopId) });
      queryClient.invalidateQueries({ queryKey: ['products', data.shopId] });
    });

    es.addEventListener('price_updated', (e) => {
      if (!e.data) return;
      const data = JSON.parse(e.data) as SSEEvent & { type: 'price_updated' };
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productDetail(data.productId, data.shopId) });
    });

    es.addEventListener('bulk_progress', (e) => {
      if (!e.data) return;
      const data = JSON.parse(e.data) as SSEEvent & { type: 'bulk_progress' };
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulkJobStatus(data.jobId) });
      if (data.status === 'COMPLETED' || data.status === 'PARTIAL') {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    });

    es.addEventListener('error', () => {
      // SSE errors handled silently — polling is the primary mechanism for bulk jobs
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isAuthenticated, queryClient]);
}
