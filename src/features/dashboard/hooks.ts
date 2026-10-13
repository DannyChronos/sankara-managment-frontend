import { useQuery } from '@tanstack/react-query';
import { qk } from '../../shared/api/query-keys';
import { useAuthStore } from '../../shared/auth/auth.store';
import { dashboardApi } from './api';

export function useDashboard(period: 'day' | 'week' | 'month') {
  const siteId = useAuthStore((state) => state.siteId);

  return useQuery({
    queryKey: qk.dashboard(siteId ?? 'all', period),
    queryFn: () => dashboardApi.overview(siteId, period),
    staleTime: 60_000,
  });
}
