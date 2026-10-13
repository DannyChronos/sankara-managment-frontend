import { api } from '../../shared/api/http';
import type {
  CreatePosSale,
  Customer,
  Order,
  Paginated,
  VariantSearchResult,
} from '../../shared/api/types';

export const posApi = {
  search: (q: string, inStockOnly = false) =>
    api.get<VariantSearchResult[]>('/catalog/variants/search', {
      params: { q, limit: 24, ...(inStockOnly ? { inStockOnly: true } : {}) },
    }),

  createSale: (payload: CreatePosSale, idempotencyKey: string) =>
    api.post<Order>('/sales', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  searchCustomers: (q: string) =>
    api.getPaged<Customer>('/customers', { params: { q, limit: 10 } }),

  createCustomer: (payload: { fullName: string; phone?: string }) =>
    api.post<Customer>('/customers', payload),
};

export type { Paginated };
