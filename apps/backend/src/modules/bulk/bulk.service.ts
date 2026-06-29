import { prisma } from '../../database/client';
import { Queue } from 'bullmq';
import { redis } from '../../cache/redis';

const bulkQueue = new Queue('bulk-update', { connection: redis as any });

export class BulkService {
  async createStockJob(
    userId: string,
    input: { shopId: string; items: Array<{ productId: string; variantId: string; stock: number }> },
  ): Promise<{ jobId: string; status: string; total: number; estimatedSeconds: number }> {
    const job = await prisma.bulkJob.create({
      data: {
        userId,
        shopConnectionId: input.shopId,
        type: 'STOCK',
        totalItems: input.items.length,
        payload: input.items,
      },
    });

    const queueJob = await bulkQueue.add('process-stock', {
      jobId: job.id,
      userId,
      shopId: input.shopId,
      items: input.items,
    });

    await prisma.bulkJob.update({
      where: { id: job.id },
      data: { queueJobId: queueJob.id },
    });

    return {
      jobId: job.id,
      status: 'QUEUED',
      total: input.items.length,
      estimatedSeconds: Math.max(5, Math.ceil(input.items.length / 50) * 12),
    };
  }

  async createPriceJob(
    userId: string,
    input: { shopId: string; items: Array<{ productId: string; variantId: string; price: number; originalPrice?: number }> },
  ): Promise<{ jobId: string; status: string; total: number; estimatedSeconds: number }> {
    const job = await prisma.bulkJob.create({
      data: {
        userId,
        shopConnectionId: input.shopId,
        type: 'PRICE',
        totalItems: input.items.length,
        payload: input.items,
      },
    });

    const queueJob = await bulkQueue.add('process-price', {
      jobId: job.id,
      userId,
      shopId: input.shopId,
      items: input.items,
    });

    await prisma.bulkJob.update({
      where: { id: job.id },
      data: { queueJobId: queueJob.id },
    });

    return {
      jobId: job.id,
      status: 'QUEUED',
      total: input.items.length,
      estimatedSeconds: Math.max(5, Math.ceil(input.items.length / 50) * 12),
    };
  }

  async getJobStatus(userId: string, jobId: string): Promise<{
    jobId: string; status: string; progress: number; total: number;
    successCount: number; failedCount: number; errors: unknown;
    startedAt: string | null; completedAt: string | null;
  }> {
    const job = await prisma.bulkJob.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new Error('JOB_NOT_FOUND');

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      total: job.totalItems,
      successCount: job.successCount,
      failedCount: job.failedCount,
      errors: job.errors ?? [],
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  }

  async getHistory(
    userId: string,
    shopId?: string,
    limit = 20,
  ): Promise<Array<{
    jobId: string; type: string; status: string; total: number;
    successCount: number; failedCount: number; createdAt: string;
  }>> {
    const where: Record<string, unknown> = { userId };
    if (shopId) where.shopConnectionId = shopId;

    const jobs = await prisma.bulkJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, type: true, status: true, totalItems: true,
        successCount: true, failedCount: true, createdAt: true,
      },
    });

    return jobs.map((j) => ({
      jobId: j.id,
      type: j.type,
      status: j.status,
      total: j.totalItems,
      successCount: j.successCount,
      failedCount: j.failedCount,
      createdAt: j.createdAt.toISOString(),
    }));
  }
}

export const bulkService = new BulkService();
