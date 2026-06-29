import { Worker } from 'bullmq';
import { redis } from '../cache/redis';
import { prisma } from '../database/client';
import { inventoryService } from '../modules/inventory/inventory.service';
import { priceService } from '../modules/price/price.service';
import { logger } from '../utils/logger';

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200;

export const bulkWorker = new Worker('bulk-update', async (job) => {
  const { jobId, userId, shopId, items } = job.data;

  await prisma.bulkJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', startedAt: new Date() } });

  const errors: any[] = [];
  let successCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      try {
        if (job.name === 'process-stock') {
          await inventoryService.updateStock(userId, item.productId, { shopId, updates: [{ variantId: item.variantId, stock: item.stock }] });
        } else {
          await priceService.updatePrice(userId, item.productId, { shopId, updates: [{ variantId: item.variantId, price: item.price, originalPrice: item.originalPrice }] });
        }
        successCount++;
      } catch (err: any) {
        errors.push({ productId: item.productId, variantId: item.variantId, errorCode: 'PLATFORM_ERROR', message: err.message });
      }
    }

    const progress = Math.round(((i + batch.length) / items.length) * 100);
    await prisma.bulkJob.update({ where: { id: jobId }, data: { progress, successCount, failedCount: errors.length } });
    await job.updateProgress(progress);

    if (i + BATCH_SIZE < items.length) await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  const finalStatus = errors.length === 0 ? 'COMPLETED' : successCount > 0 ? 'PARTIAL' : 'FAILED';
  await prisma.bulkJob.update({
    where: { id: jobId },
    data: { status: finalStatus, progress: 100, successCount, failedCount: errors.length, errors, completedAt: new Date() },
  });

  logger.info({ jobId, status: finalStatus, successCount, failed: errors.length }, 'Bulk job completed');
}, { connection: redis as any, concurrency: 3 });
