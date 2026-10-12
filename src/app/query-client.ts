import { QueryClient } from '@tanstack/react-query';

/**
 * Politique de cache de FRONTEND.md §5.4 et §14 : deux tentatives en lecture,
 * **aucune** en écriture — une vente se relance explicitement, avec la même
 * clé d'idempotence.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
