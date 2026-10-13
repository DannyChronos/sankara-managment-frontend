import { api } from '../../shared/api/http';
import type { Paginated, Transfer } from '../../shared/api/types';

export interface ReceiveLinePayload {
  lineId: string;
  quantityReceived: number;
  gapReason?: string;
}

export const transfersApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<Transfer>('/transfers', { params }),

  get: (id: string) => api.get<Transfer>(`/transfers/${id}`),

  create: (payload: {
    toSiteId: string;
    note?: string;
    lines: { variantId: string; quantity: number }[];
  }) => api.post<Transfer>('/transfers', payload),

  ship: (id: string) => api.post<Transfer>(`/transfers/${id}/ship`),

  receive: (id: string, lines: ReceiveLinePayload[]) =>
    api.post<Transfer>(`/transfers/${id}/receive`, { lines }),

  cancel: (id: string, reason?: string) =>
    api.post<Transfer>(`/transfers/${id}/cancel`, { reason }),
};

export type { Paginated };
