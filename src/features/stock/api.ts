import { api } from '../../shared/api/http';
import type {
  Paginated,
  StockLevelView,
  StockMovementView,
  StockOperation,
  Supplier,
} from '../../shared/api/types';

export const stockApi = {
  levels: (params: Record<string, unknown>) =>
    api.getPaged<StockLevelView>('/stock/levels', { params }),

  setThreshold: (levelId: string, minThreshold: number) =>
    api.patch<StockLevelView>(`/stock/levels/${levelId}/threshold`, {
      minThreshold,
    }),

  movements: (params: Record<string, unknown>) =>
    api.getPaged<StockMovementView>('/stock/movements', { params }),

  operations: (params: Record<string, unknown>) =>
    api.getPaged<StockOperation>('/stock/operations', { params }),

  operation: (id: string) => api.get<StockOperation>(`/stock/operations/${id}`),

  createOperation: (payload: {
    type: string;
    reason?: string;
    note?: string;
    supplierId?: string;
    lines: { variantId: string; quantity: number; unitCost?: number }[];
  }) => api.post<StockOperation>('/stock/operations', payload),

  validateOperation: (id: string) =>
    api.post<StockOperation>(`/stock/operations/${id}/validate`),

  cancelOperation: (id: string, reason?: string) =>
    api.post<StockOperation>(`/stock/operations/${id}/cancel`, { reason }),

  suppliers: () =>
    api.getPaged<Supplier>('/suppliers', { params: { limit: 100 } }),
};

export type { Paginated };
