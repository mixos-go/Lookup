// src/utils/productStatus.ts
// Normalise platform-native product status values to a display-friendly form.
//
// Shopee native statuses: NORMAL (active), UNLIST (hidden by seller),
//   BANNED (platform removed), DELETED
// TikTok native statuses: ACTIVE, INACTIVE, SELLER_DEACTIVATED,
//   PLATFORM_DEACTIVATED
//
// "SOLD_OUT" is a *derived* state (totalStock === 0) — it is never returned
// by the API as a status field. Always derive it from totalStock.

export type NormalisedStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

/** Map any platform status string to a normalised value. */
export function normaliseProductStatus(status: string): NormalisedStatus {
  switch (status) {
    case 'NORMAL':
    case 'ACTIVE':
      return 'ACTIVE';

    case 'UNLIST':
    case 'INACTIVE':
    case 'SELLER_DEACTIVATED':
    case 'PLATFORM_DEACTIVATED':
    case 'DELETED':
      return 'INACTIVE';

    case 'BANNED':
      return 'BANNED';

    default:
      return 'INACTIVE';
  }
}

export interface StatusDisplay {
  label: string;
  variant: 'success' | 'danger' | 'neutral';
}

/**
 * Returns a localised display label and badge variant for any product status.
 * Pass `totalStock` so sold-out state can be derived correctly.
 */
export function getProductStatusDisplay(
  status: string,
  totalStock: number,
): StatusDisplay {
  if (totalStock === 0) {
    return { label: 'Habis', variant: 'danger' };
  }

  switch (status) {
    case 'NORMAL':
    case 'ACTIVE':
      return { label: 'Aktif', variant: 'success' };

    case 'UNLIST':
    case 'INACTIVE':
    case 'SELLER_DEACTIVATED':
    case 'PLATFORM_DEACTIVATED':
      return { label: 'Inaktif', variant: 'neutral' };

    case 'BANNED':
    case 'DELETED':
      return { label: 'Diblokir', variant: 'danger' };

    default:
      return { label: status, variant: 'neutral' };
  }
}

/**
 * Client-side status filter predicate.
 * The mobile list screen sends no status param to the backend — it fetches
 * all products and filters locally so that switching tabs is instant.
 */
export function matchesStatusFilter(
  product: { status: string; totalStock: number },
  filter: string,
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'SOLD_OUT') return product.totalStock === 0;
  if (filter === 'ACTIVE') {
    return normaliseProductStatus(product.status) === 'ACTIVE' && product.totalStock > 0;
  }
  if (filter === 'INACTIVE') {
    return normaliseProductStatus(product.status) === 'INACTIVE';
  }
  return true;
}
