// tiktok.order.ts — Order sync using the OFFICIAL TikTok Shop SDK

import { createTikTokSdkClient, getShopCredentials, CONTENT_TYPE_JSON } from './tiktok.sdk-client';
import type { OrderV202309Api } from './sdk/api/orderV202309Api';
import type { ShopConnection } from '@prisma/client';

export interface TikTokOrderSummary {
  id: string;
  status: string;
  buyerName?: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  paidTime?: number;
  createTime?: number;
  updateTime?: number;
  raw: unknown;
}

export const tiktokOrder = {
  async getOrderList(
    shop: ShopConnection,
    pageSize: number,
    pageToken?: string,
  ): Promise<{
    orders: TikTokOrderSummary[];
    nextPageToken: string;
    hasMore: boolean;
  }> {
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const orderApi = sdk.api.OrderV202309Api as OrderV202309Api;

    const { body } = await orderApi.OrdersSearchPost(
      pageSize,
      accessToken,
      CONTENT_TYPE_JSON,
      'DESC',
      pageToken,
      'CREATE_TIME',
      shopCipher,
      {} as any,
    );

    if (body.code !== 0) {
      throw new Error(`TikTok order search error ${body.code}: ${body.message}`);
    }

    const d: any = body.data ?? {};
    const orders: TikTokOrderSummary[] = (d.orders ?? []).map((o: any) => ({
      id: o.id ?? '',
      status: o.status ?? '',
      buyerName: o.buyerNickname ?? undefined,
      totalAmount: Number(o.payment?.totalAmount ?? 0),
      currency: o.payment?.currency ?? 'IDR',
      itemCount: (o.lineItems ?? []).length,
      paidTime: o.paidTime,
      createTime: o.createTime,
      updateTime: o.updateTime,
      raw: o,
    }));

    return {
      orders,
      nextPageToken: d.nextPageToken ?? '',
      hasMore: !!d.nextPageToken,
    };
  },

  async getOrderDetail(shop: ShopConnection, orderIds: string[]): Promise<unknown[]> {
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const orderApi = sdk.api.OrderV202309Api as OrderV202309Api;

    const { body } = await orderApi.OrdersGet(orderIds, accessToken, CONTENT_TYPE_JSON, shopCipher);

    if (body.code !== 0) {
      throw new Error(`TikTok order detail error ${body.code}: ${body.message}`);
    }

    return (body.data as any)?.orders ?? [];
  },
};
