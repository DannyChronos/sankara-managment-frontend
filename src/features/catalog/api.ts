import { api } from '../../shared/api/http';
import type {
  CategoryNode,
  Firmness,
  Paginated,
  ProductDetail,
  ProductImage,
  ProductListItem,
  ProductVariantView,
  StockLevelView,
} from '../../shared/api/types';

export interface ProductImagePayload {
  file: File;
  variantId?: string;
  alt?: string;
  position?: number;
}

export interface CategoryPayload {
  name: string;
  parentId?: string | null;
  position?: number;
  isActive?: boolean;
}

export interface ProductPayload {
  name: string;
  categoryId: string;
  description?: string;
  brand?: string;
  warrantyMonths?: number;
  isPublishedOnline?: boolean;
  isActive?: boolean;
}

export interface VariantPayload {
  sku?: string;
  barcode?: string;
  name?: string;
  widthCm?: number;
  lengthCm?: number;
  thicknessCm?: number;
  densityKgM3?: number;
  firmness?: Firmness;
  costPrice?: number;
  price?: number;
}

export interface GenerateVariantsResult {
  created: ProductVariantView[];
  skipped: number;
}

export interface GenerateVariantsPayload {
  dimensions: { widthCm: number; lengthCm: number }[];
  thicknesses: number[];
  densityKgM3?: number;
  firmness?: Firmness;
  price?: number;
}

export const catalogApi = {
  categories: (params: Record<string, unknown> = {}) =>
    api.get<CategoryNode[]>('/catalog/categories', { params }),

  createCategory: (payload: CategoryPayload) =>
    api.post<CategoryNode>('/catalog/categories', payload),

  updateCategory: (id: string, payload: CategoryPayload) =>
    api.patch<CategoryNode>(`/catalog/categories/${id}`, payload),

  products: (params: Record<string, unknown>) =>
    api.getPaged<ProductListItem>('/catalog/products', { params }),

  product: (id: string) => api.get<ProductDetail>(`/catalog/products/${id}`),

  createProduct: (payload: ProductPayload) =>
    api.post<ProductDetail>('/catalog/products', payload),

  updateProduct: (id: string, payload: Partial<ProductPayload>) =>
    api.patch<ProductDetail>(`/catalog/products/${id}`, payload),

  createVariant: (productId: string, payload: VariantPayload) =>
    api.post<ProductVariantView>(
      `/catalog/products/${productId}/variants`,
      payload,
    ),

  // Le serveur renvoie les variantes créées et le nombre de combinaisons
  // déjà existantes qu'il a ignorées.
  generateVariants: (productId: string, payload: GenerateVariantsPayload) =>
    api.post<GenerateVariantsResult>(
      `/catalog/products/${productId}/variants/generate`,
      payload,
    ),

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

  // Multipart : axios pose lui-même le Content-Type et sa frontière.
  addProductImage: (productId: string, payload: ProductImagePayload) => {
    const body = new FormData();
    body.append('file', payload.file);
    if (payload.variantId) body.append('variantId', payload.variantId);
    if (payload.alt) body.append('alt', payload.alt);
    if (payload.position !== undefined)
      body.append('position', String(payload.position));

    return api.post<ProductImage>(
      `/catalog/products/${productId}/images`,
      body,
    );
  },

  removeProductImage: (productId: string, imageId: string) =>
    api.delete<void>(`/catalog/products/${productId}/images/${imageId}`),
};

export type { Paginated };
