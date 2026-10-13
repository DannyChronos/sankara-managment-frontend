import { api } from '../../shared/api/http';
import type {
  Category,
  Paginated,
  ProductDetail,
  ProductListItem,
  StockLevelView,
} from '../../shared/api/types';

export const catalogApi = {
  categories: (tree = false) =>
    api.get<Category[]>('/catalog/categories', { params: { tree } }),

  products: (params: Record<string, unknown>) =>
    api.getPaged<ProductListItem>('/catalog/products', { params }),

  product: (id: string) => api.get<ProductDetail>(`/catalog/products/${id}`),

  setPrice: (variantId: string, channel: 'POS' | 'WEB', amount: number) =>
    api.put<unknown>(`/catalog/variants/${variantId}/prices`, {
      channel,
      amount,
    }),

  priceHistory: (variantId: string) =>
    api.get<
      {
        id: string;
        channel: 'POS' | 'WEB';
        amount: number;
        validFrom: string;
        validTo: string | null;
      }[]
    >(`/catalog/variants/${variantId}/prices`),

  variantStock: (variantId: string) =>
    api.get<StockLevelView[]>(`/stock/levels/variant/${variantId}`),
};

export type { Paginated };
