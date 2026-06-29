import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getAccessToken } from '@/api/client';
import { API_URL } from '@/constants';

type EventHandler = (data: Record<string, unknown>) => void;

export function useRealtimeEvents(handlers?: Partial<Record<string, EventHandler>>) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const stableHandlers = useRef(handlers);
  stableHandlers.current = handlers;

  const defaultHandler = useCallback(
    (type: string, data: Record<string, unknown>) => {
      if (type === 'shopee_webhook' || type === 'tiktok_webhook') {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
      if (type === 'bulk_job_completed') {
        queryClient.invalidateQueries({ queryKey: ['bulk-history'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
      stableHandlers.current?.[type]?.(data);
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAccessToken();
    if (!token) return;

    const url = `${API_URL}/api/events/stream?token=${token}`;

    let es: EventSource;
    try {
      es = new EventSource(url);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data as string) as Record<string, unknown>;
          defaultHandler(String(data.type ?? 'message'), data);
        } catch { /* empty */ }
      };

      const eventTypes = ['shopee_webhook', 'tiktok_webhook', 'bulk_job_started', 'bulk_job_progress', 'bulk_job_completed'];
      eventTypes.forEach((type) => {
        es.addEventListener(type, (e: Event) => {
          const me = e as MessageEvent;
          try {
            const data = JSON.parse(me.data as string) as Record<string, unknown>;
            defaultHandler(type, data);
          } catch { /* empty */ }
        });
      });
    } catch {
      return;
    }

    return () => {
      es?.close();
    };
  }, [isAuthenticated, defaultHandler]);
}
