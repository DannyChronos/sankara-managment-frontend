import { api } from '../../shared/api/http';
import type { UserSummary } from '../../shared/api/types';

export const usersApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<UserSummary>('/users', { params }),
};
