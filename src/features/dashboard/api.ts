import { api } from '../../shared/api/http';
import type { Dashboard } from '../../shared/api/types';

export const dashboardApi = {
  overview: (siteId: string | null, period: string) =>
    api.get<Dashboard>('/dashboard', {
      params: { ...(siteId ? { siteId } : {}), period },
    }),
};
