import { useQuery } from '@tanstack/react-query';
import { sitesApi } from './api';

/** Liste des sites : change rarement, on la garde en cache cinq minutes. */
export function useSites(activeOnly = true) {
  return useQuery({
    queryKey: ['sites', { activeOnly }],
    queryFn: () => sitesApi.list(activeOnly ? { isActive: true } : {}),
    staleTime: 5 * 60_000,
  });
}
