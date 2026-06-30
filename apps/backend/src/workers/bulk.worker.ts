import { Worker, type Job } from 'bullmq';
import { redis } from '../cache/redis';
import { prisma } from '../database/client';
import { inventoryService } from '../modules/inventory/inventory.service';
import { priceService } from '../modules/price/price.service';
import { logger } from '../utils/logger';

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 250; // Respect platform rate limits

interface BulkJobData {
  jobId: string;
  userId: string;
  shopId: string;
  items: Array<{
    productId: string;
    variantId: string;
    stock?: number;
    price?: number;
    originalPrice?: number;
  }>;
}

async function publishProgress(userId: string, jobId: string, progress: number, extra = {}): Promise<void> {
  await redis.publish(
    `lookup:bulk:${userId}`,
    JSON.stringify({ type: 'bulk_progress', jobId, progress, ...extra }),
  );
}

export const bulkWorker = new Worker<BulkJobData>(
  'bulk-update',
  async (job: Job<BulkJobData>) => {
    const { jobId, userId, shopId, items } = job.data;
    const isStockJob = job.name === 'process-stock';

    await prisma.bulkJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    const errors: Array<{ productId: string; variantId: string; errorCode: string; message: string }> = [];
    let successCount = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      for (const item of batch) {
        try {
          if (isStockJob) {
            await inventoryService.updateStock(userId, item.productId, {
              shopId,
              updates: [{ variantId: item.variantId, stock: item.stock! }],
            });
          } else {
            await priceService.updatePrice(userId, item.productId, {
              shopId,
              updates: [{ variantId: item.variantId, price: item.price!, originalPrice: item.originalPrice }],
            });
          }
          successCount++;
        } catch (err: any) {
          errors.push({
            productId: item.productId,
            variantId: item.variantId,
            errorCode: err.message?.includes('Shopee') ? 'SHOPEE_ERROR' : 'PLATFORM_ERROR',
            message: err.message ?? 'Unknown error',
          });
        }
      }

      const progress = Math.round(((i + batch.length) / items.length) * 100);

      await prisma.bulkJob.update({
        where: { id: jobId },
        data: { progress, successCount, failedCount: errors.length },
      });

      // Push SSE update to client
      await publishProgress(userId, jobId, progress, { successCount, failedCount: errors.length });
      await job.updateProgress(progress);

      // Delay between batches to respect platform rate limits
      if (i + BATCH_SIZE < items.length) {
        await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
      }
    }

    const finalStatus = errors.length === 0 ? 'COMPLETED' : successCount > 0 ? 'PARTIAL' : 'FAILED';

    await prisma.bulkJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        progress: 100,
        successCount,
        failedCount: errors.length,
        errors,
        completedAt: new Date(),
      },
    });

    // Final SSE push
    await publishProgress(userId, jobId, 100, { status: finalStatus, successCount, failedCount: errors.length });

    logger.info({ jobId, status: finalStatus, successCount, failedCount: errors.length }, 'Bulk job completed');
  },
  {
    connection: redis as any,
    concurrency: 3,
    limiter: { max: 10, duration: 1000 }, // Max 10 jobs/second
  },
);

bulkWorker.on('failed', async (job, err) => {
  if (!job) return;
  logger.error({ jobId: job.data.jobId, err }, 'Bulk job failed');
  await prisma.bulkJob.update({
    where: { id: job.data.jobId },
    data: { status: 'FAILED', errors: [{ errorCode: 'WORKER_ERROR', message: err.message }] },
  }).catch(() => {});
});
