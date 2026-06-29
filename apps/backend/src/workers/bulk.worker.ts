import { Worker } from 'bullmq';
import { redis } from '../cache/redis';
import { prisma } from '../database/client';
import { shopeeProduct } from '../integrations/shopee/shopee.product';
import { tiktokProduct } from '../integrations/tiktok/tiktok.product';
import { logger } from '../utils/logger';

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const bulkWorker = new Worker(
  'bulk-update',
  async (job) => {
    const { jobId, shopId, items } = job.data as {
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
    };

    const isStockJob = job.name === 'process-stock';

    await prisma.bulkJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    await redis.publish('lookup:sse:all', JSON.stringify({
      type: 'bulk_job_started',
      jobId,
      jobType: isStockJob ? 'STOCK' : 'PRICE',
    }));

    const shop = await prisma.shopConnection.findFirst({ where: { id: shopId } });
    if (!shop) throw new Error('Shop not found');

    const errors: Array<{ productId: string; variantId: string; message: string }> = [];
    let successCount = 0;

    const totalBatches = Math.ceil(items.length / BATCH_SIZE);

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batch = items.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);

      const byProduct = batch.reduce<Record<string, typeof batch>>((acc, item) => {
        if (!acc[item.productId]) acc[item.productId] = [];
        acc[item.productId].push(item);
        return acc;
      }, {});

      for (const [productId, productItems] of Object.entries(byProduct)) {
        try {
          if (isStockJob) {
            const updates = productItems.map((i) => ({
              variantId: i.variantId,
              stock: i.stock ?? 0,
            }));
            if (shop.platform === 'SHOPEE') {
              await shopeeProduct.updateStock(shop, productId, updates);
            } else {
              await tiktokProduct.updateInventory(shop, productId, updates);
            }
          } else {
            const updates = productItems.map((i) => ({
              variantId: i.variantId,
              price: i.price ?? 0,
              originalPrice: i.originalPrice,
            }));
            if (shop.platform === 'SHOPEE') {
              await shopeeProduct.updatePrice(shop, productId, updates);
            } else {
              await tiktokProduct.updatePrice(shop, productId, updates);
            }
          }
          successCount += productItems.length;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          logger.warn({ productId, err }, 'Bulk update item failed');
          productItems.forEach((i) => {
            errors.push({ productId: i.productId, variantId: i.variantId, message });
          });
        }
      }

      const progress = Math.round(((batchIdx + 1) / totalBatches) * 100);
      await prisma.bulkJob.update({
        where: { id: jobId },
        data: { progress, successCount, failedCount: errors.length },
      });

      await redis.publish('lookup:sse:all', JSON.stringify({
        type: 'bulk_job_progress',
        jobId,
        progress,
        successCount,
        failedCount: errors.length,
      }));

      if (batchIdx < totalBatches - 1) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    const finalStatus =
      errors.length === 0 ? 'COMPLETED' :
      successCount === 0 ? 'FAILED' : 'PARTIAL';

    await prisma.bulkJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        progress: 100,
        successCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
      },
    });

    await redis.publish('lookup:sse:all', JSON.stringify({
      type: 'bulk_job_completed',
      jobId,
      status: finalStatus,
      successCount,
      failedCount: errors.length,
    }));

    logger.info({ jobId, finalStatus, successCount, failedCount: errors.length }, 'Bulk job completed');
  },
  {
    connection: redis as unknown as Parameters<typeof Worker>[2] extends { connection: infer C } ? C : never,
    concurrency: 2,
  },
);

bulkWorker.on('failed', async (job, err) => {
  if (job) {
    logger.error({ jobId: job.data?.jobId, err }, 'Bulk worker job failed');
    await prisma.bulkJob.update({
      where: { id: job.data?.jobId },
      data: { status: 'FAILED', completedAt: new Date() },
    }).catch(() => { /* swallow */ });
  }
});
