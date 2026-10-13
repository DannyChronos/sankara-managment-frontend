import { api } from '../../shared/api/http';
import type { Site, SiteDetail, SiteType } from '../../shared/api/types';

export interface SitePayload {
  code?: string;
  name: string;
  type: SiteType;
  address?: string;
  phone?: string;
  canSell?: boolean;
  isEcommerceSource?: boolean;
}

export const sitesApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.getPaged<Site>('/sites', { params: { limit: 100, ...params } }),

  detailed: (params: Record<string, unknown> = {}) =>
    api.getPaged<SiteDetail>('/sites', { params: { limit: 100, ...params } }),

  create: (payload: SitePayload) => api.post<SiteDetail>('/sites', payload),

  update: (id: string, payload: Omit<SitePayload, 'code'>) =>
    api.patch<SiteDetail>(`/sites/${id}`, payload),

  setStatus: (id: string, isActive: boolean) =>
    api.patch<SiteDetail>(`/sites/${id}/status`, { isActive }),
};
