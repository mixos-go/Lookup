import { apiClient, getAccessToken } from './client';
import { API_URL } from '@/constants';

export interface UploadedImage {
  imageId: string;
  imageUrl: string;
  width: number;
  height: number;
}

export const imageApi = {
  async uploadImage(shopId: string, uri: string, mimeType: string): Promise<UploadedImage> {
    const token = getAccessToken();

    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'image.jpg';
    formData.append('file', { uri, name: filename, type: mimeType } as unknown as Blob);
    formData.append('shopId', shopId);

    const response = await fetch(`${API_URL}/api/images/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: formData,
    });

    if (!response.ok) {
      const err = (await response.json()) as { error?: { message: string } };
      throw new Error(err.error?.message ?? 'Upload failed');
    }

    const json = (await response.json()) as { data: UploadedImage };
    return json.data;
  },

  async updateProductImages(
    productId: string,
    input: { shopId: string; images: Array<{ imageId: string; order: number }> },
  ): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ success: boolean; data: { message: string } }>(
      `/api/products/${productId}/images`,
      input,
    );
    return data.data;
  },
};
