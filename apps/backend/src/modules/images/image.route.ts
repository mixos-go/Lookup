import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { shopeeProduct } from '../../integrations/shopee/shopee.product';
import { tiktokProduct } from '../../integrations/tiktok/tiktok.product';
import { prisma } from '../../database/client';

const UpdateImagesSchema = z.object({
  shopId: z.string(),
  images: z.array(z.object({ imageId: z.string(), order: z.number().int().min(0) })),
});

export async function imageRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/images/upload', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    }

    const { shopId, platform } = data.fields as Record<string, { value: string }>;
    const shopIdVal = shopId?.value ?? '';
    const platformVal = platform?.value ?? '';

    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopIdVal, userId: req.user.sub },
    });
    if (!shop) {
      return reply.status(404).send({ success: false, error: { code: 'SHOP_NOT_FOUND', message: 'Shop not found' } });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);
    const mimeType = data.mimetype;

    let result: { imageId: string; imageUrl: string; width: number; height: number };

    if (shop.platform === 'SHOPEE') {
      result = await shopeeProduct.uploadImage(shop, buffer, mimeType);
    } else {
      result = await tiktokProduct.uploadImage(shop, buffer, mimeType);
    }

    return reply.send({ success: true, data: result });
  });

  app.patch('/api/products/:productId/images', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const input = UpdateImagesSchema.parse(req.body);
    const { productId } = req.params;

    const shop = await prisma.shopConnection.findFirst({
      where: { id: input.shopId, userId: req.user.sub },
    });
    if (!shop) {
      return reply.status(404).send({ success: false, error: { code: 'SHOP_NOT_FOUND', message: 'Shop not found' } });
    }

    const sorted = [...input.images].sort((a, b) => a.order - b.order);
    const imageIds = sorted.map((i) => i.imageId);

    if (shop.platform === 'SHOPEE') {
      const { createShopeeClient } = await import('../../integrations/shopee/shopee.client');
      const client = createShopeeClient(shop);
      await client.post('/api/v2/product/update_item', {
        item_id: Number(productId),
        image: { image_id_list: imageIds },
      });
    } else {
      const { createTikTokClient } = await import('../../integrations/tiktok/tiktok.client');
      const client = createTikTokClient(shop);
      await client.put(`/product/202309/products/${productId}`, {
        main_images: imageIds.map((id) => ({ uri: id })),
      });
    }

    await prisma.updateLog.create({
      data: {
        shopConnectionId: shop.id,
        platformProductId: productId,
        updateType: 'IMAGE',
        status: 'SUCCESS',
        newValue: { imageIds },
      },
    });

    return reply.send({ success: true, data: { message: 'Images updated' } });
  });
}
