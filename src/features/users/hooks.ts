import { useQuery } from '@tanstack/react-query';
import { usersApi } from './api';

/**
 * `enabled` est explicite : la liste des utilisateurs demande `users:read`,
 * que tous les lecteurs de rapports n'ont pas. Mieux vaut ne pas appeler que
 * de récolter un 403.
 */
export function useUsers(filters: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.list(filters),
    enabled,
    staleTime: 5 * 60_000,
  });
}
