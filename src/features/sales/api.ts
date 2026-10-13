import { api } from '../../shared/api/http';
import type {
  CancelSalePayload,
  CreateReturnPayload,
  Order,
  Paginated,
} from '../../shared/api/types';

export const salesApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<Order>('/sales', { params }),

  get: (id: string) => api.get<Order>(`/sales/${id}`),

  cancel: (id: string, payload: CancelSalePayload) =>
    api.post<Order>(`/sales/${id}/cancel`, payload),

  createReturn: (id: string, payload: CreateReturnPayload) =>
    api.post<Order>(`/sales/${id}/returns`, payload),
};

/** Le ticket est protégé par le jeton : il se récupère en blob (`PdfButton`). */
export function receiptPath(id: string): string {
  return `/sales/${id}/receipt`;
}

export type { Paginated };
