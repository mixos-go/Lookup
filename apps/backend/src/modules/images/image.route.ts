import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../database/client';
import { shopeeProduct } from '../../integrations/shopee/shopee.product';
import { tiktokProduct } from '../../integrations/tiktok/tiktok.product';
import { invalidateCache } from '../../cache/redis';

const UpdateImagesSchema = z.object({
  shopId: z.string().min(1),
  images: z.array(
    z.object({ imageId: z.string().min(1), order: z.number().int().min(0) }),
  ).min(1),
});

export async function imageRoutes(app: FastifyInstance): Promise<void> {
  // ─── POST /api/images/upload ───────────────────────────────────────────────────
  app.post('/api/images/upload', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }

    const shopId = (data.fields?.shopId?.value ?? '') as string;
    if (!shopId) {
      return reply.status(400).send({ success: false, error: { code: 'MISSING_SHOP_ID' } });
    }

    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId: req.user.sub, disconnectedAt: null },
    });
    if (!shop) {
      return reply.status(404).send({ success: false, error: { code: 'SHOP_NOT_FOUND' } });
    }

    // Read multipart file stream into buffer
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);
    const mimeType: string = data.mimetype ?? 'image/jpeg';

    // Validate size — 5 MB max
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.status(400).send({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'Maximum file size is 5MB' },
      });
    }

    // Validate MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(mimeType)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_MIME', message: 'Only jpg, png, webp allowed' },
      });
    }

    const result = shop.platform === 'SHOPEE'
      ? await shopeeProduct.uploadImage(shop, buffer, mimeType)
      : await tiktokProduct.uploadImage(shop, buffer, mimeType);

    return reply.send({ success: true, data: result });
  });

  // ─── PATCH /api/products/:productId/images ─────────────────────────────────────
  app.patch('/api/products/:productId/images', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId, images } = UpdateImagesSchema.parse(req.body);
    const { productId } = req.params as { productId: string };

    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId: req.user.sub, disconnectedAt: null },
    });
    if (!shop) {
      return reply.status(404).send({ success: false, error: { code: 'SHOP_NOT_FOUND' } });
    }

    // Sort by order ascending → first image = cover
    const sortedImageIds = [...images]
      .sort((a, b) => a.order - b.order)
      .map((img) => img.imageId);

    if (shop.platform === 'SHOPEE') {
      // Shopee: update_item with image_id_list in desired order
      await shopeeProduct.updateProductImages(shop, productId, sortedImageIds);
    } else {
      // TikTok: use PUT /product/202309/products/{id} to update main_images
      await tiktokProduct.updateProductImages(shop, productId, sortedImageIds);
    }

    // Invalidate product detail cache
    await invalidateCache(`product:${shopId}:${productId}`);

    return reply.send({ success: true, data: { message: 'Images updated', imageCount: sortedImageIds.length } });
  });
}
