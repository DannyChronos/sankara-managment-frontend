import { api } from '../../shared/api/http';
import type { Inventory, Paginated } from '../../shared/api/types';

export const inventoriesApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<Inventory>('/inventories', { params }),

  get: (id: string) => api.get<Inventory>(`/inventories/${id}`),

  start: (payload: { variantIds?: string[]; note?: string }) =>
    api.post<Inventory>('/inventories', payload),

  setCounts: (id: string, lines: { variantId: string; countedQty: number }[]) =>
    api.put<Inventory>(`/inventories/${id}/lines`, { lines }),

  submit: (id: string) => api.post<Inventory>(`/inventories/${id}/submit`),

  validate: (id: string, note?: string) =>
    api.post<Inventory>(`/inventories/${id}/validate`, { note }),

  cancel: (id: string, reason?: string) =>
    api.post<Inventory>(`/inventories/${id}/cancel`, { reason }),
};

export type { Paginated };
