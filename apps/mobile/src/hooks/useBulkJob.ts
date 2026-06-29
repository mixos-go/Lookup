import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bulkApi } from '@/api/index';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { BulkStockItem, BulkPriceItem, BulkJobSummary } from '@/types';

export function useBulkJob() {
  const queryClient = useQueryClient();

  const createStockJob = useMutation({
    mutationFn: ({ shopId, items }: { shopId: string; items: BulkStockItem[] }) =>
      bulkApi.createStockJob(shopId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-history'] });
    },
  });

  const createPriceJob = useMutation({
    mutationFn: ({ shopId, items }: { shopId: string; items: BulkPriceItem[] }) =>
      bulkApi.createPriceJob(shopId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-history'] });
    },
  });

  return { createStockJob, createPriceJob };
}

export function useBulkJobStatus(jobId: string | null) {
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);

  const DONE = ['COMPLETED', 'FAILED', 'PARTIAL'];

  const query = useQuery({
    queryKey: QUERY_KEYS.bulkJobStatus(jobId ?? ''),
    queryFn: () => bulkApi.getStatus(jobId!),
    refetchInterval: pollingInterval,
    enabled: !!jobId,
    staleTime: 0,
  });

  useEffect(() => {
    const status = query.data?.status as string | undefined;
    if (status && DONE.includes(status)) {
      setPollingInterval(false);
    } else {
      setPollingInterval(2000);
    }
  }, [query.data?.status]);

  return query;
}

export function useBulkHistory(shopId?: string) {
  return useQuery<BulkJobSummary[]>({
    queryKey: QUERY_KEYS.bulkHistory(shopId),
    queryFn: () => bulkApi.getHistory(shopId),
    staleTime: 15_000,
  });
}
