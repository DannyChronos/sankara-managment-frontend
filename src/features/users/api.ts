import { api } from '../../shared/api/http';
import type {
  CreatedUser,
  UserStatus,
  UserSummary,
} from '../../shared/api/types';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  phone: string;
  roleId: string;
  email?: string;
  siteIds?: string[];
  defaultSiteId?: string;
  discountCapPercent?: number;
}

export type UpdateUserPayload = Partial<
  Omit<CreateUserPayload, 'siteIds' | 'defaultSiteId'>
>;

export const usersApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<UserSummary>('/users', { params }),

  get: (id: string) => api.get<UserSummary>(`/users/${id}`),

  create: (payload: CreateUserPayload) =>
    api.post<CreatedUser>('/users', payload),

  update: (id: string, payload: UpdateUserPayload) =>
    api.patch<UserSummary>(`/users/${id}`, payload),

  setStatus: (id: string, status: UserStatus) =>
    api.patch<UserSummary>(`/users/${id}/status`, { status }),

  setSites: (id: string, siteIds: string[], defaultSiteId?: string) =>
    api.put<UserSummary>(`/users/${id}/sites`, { siteIds, defaultSiteId }),
};
