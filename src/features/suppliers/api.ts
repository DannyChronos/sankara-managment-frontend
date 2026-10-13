import { api } from '../../shared/api/http';
import type {
  Paginated,
  StockOperation,
  Supplier,
} from '../../shared/api/types';

export interface SupplierPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export const suppliersApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<Supplier>('/suppliers', { params }),

  get: (id: string) => api.get<Supplier>(`/suppliers/${id}`),

  /** Les réceptions passées : c'est tout l'intérêt d'ouvrir une fiche. */
  receipts: (id: string) =>
    api.getPaged<StockOperation>('/stock/operations', {
      params: { supplierId: id, limit: 50 },
    }),

  create: (payload: SupplierPayload) =>
    api.post<Supplier>('/suppliers', payload),

  update: (id: string, payload: SupplierPayload) =>
    api.patch<Supplier>(`/suppliers/${id}`, payload),
};

export type { Paginated };
