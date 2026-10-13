import { api } from '../../shared/api/http';
import type { Site } from '../../shared/api/types';

export const sitesApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.getPaged<Site>('/sites', { params: { limit: 100, ...params } }),
};
