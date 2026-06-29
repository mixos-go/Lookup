import { prisma } from '../../database/client';
import { Queue } from 'bullmq';
import { redis } from '../../cache/redis';

const bulkQueue = new Queue('bulk-update', { connection: redis as any });

export class BulkService {
  async createStockJob(userId: string, input: { shopId: string; items: any[] }) {
    const job = await prisma.bulkJob.create({
      data: {
        userId, shopConnectionId: input.shopId, type: 'STOCK',
        totalItems: input.items.length, payload: input.items,
      },
    });

    const queueJob = await bulkQueue.add('process-stock', { jobId: job.id, userId, ...input });
    await prisma.bulkJob.update({ where: { id: job.id }, data: { queueJobId: queueJob.id } });

    return { jobId: job.id, status: 'QUEUED', total: input.items.length, estimatedSeconds: Math.ceil(input.items.length / 50) * 12 };
  }

  async getJobStatus(userId: string, jobId: string) {
    const job = await prisma.bulkJob.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new Error('JOB_NOT_FOUND');
    return { jobId: job.id, status: job.status, progress: job.progress, total: job.totalItems, successCount: job.successCount, failedCount: job.failedCount, errors: job.errors, startedAt: job.startedAt, completedAt: job.completedAt };
  }

  async getHistory(userId: string) {
    return prisma.bulkJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, type: true, status: true, totalItems: true, successCount: true, failedCount: true, createdAt: true },
    });
  }
}
export const bulkService = new BulkService();
