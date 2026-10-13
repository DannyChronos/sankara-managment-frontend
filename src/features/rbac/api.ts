import { api } from '../../shared/api/http';
import type { PermissionModule, Role } from '../../shared/api/types';

export const rbacApi = {
  modules: () => api.get<PermissionModule[]>('/rbac/permissions'),

  roles: () => api.get<Role[]>('/rbac/roles'),

  create: (payload: { code: string; name: string; permissions: string[] }) =>
    api.post<Role>('/rbac/roles', payload),

  rename: (id: string, name: string) =>
    api.patch<Role>(`/rbac/roles/${id}`, { name }),

  setPermissions: (id: string, permissions: string[]) =>
    api.put<Role>(`/rbac/roles/${id}/permissions`, { permissions }),

  remove: (id: string) => api.delete<void>(`/rbac/roles/${id}`),
};
