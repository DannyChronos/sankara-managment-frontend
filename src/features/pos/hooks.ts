import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../shared/api/query-keys';
import { useAuthStore } from '../../shared/auth/auth.store';
import { useDebounce } from '../../shared/hooks/useDebounce';
import type { CreatePosSale } from '../../shared/api/types';
import { posApi } from './api';

/** Recherche de caisse : 250 ms de debounce, résultats courts (§9.1). */
export function useVariantSearch(term: string) {
  const siteId = useAuthStore((state) => state.siteId);
  const debounced = useDebounce(term, 250);

  return useQuery({
    queryKey: qk.variantSearch(siteId ?? 'none', debounced),
    queryFn: () => posApi.search(debounced),
    enabled: debounced.trim().length >= 2,
    staleTime: 15_000,
  });
}

export function useCustomerSearch(term: string) {
  const debounced = useDebounce(term, 250);

  return useQuery({
    queryKey: ['customers', 'search', debounced],
    queryFn: () => posApi.searchCustomers(debounced),
    enabled: debounced.trim().length >= 2,
  });
}

/**
 * Enregistrement d'une vente. Aucun retry automatique : une écriture se
 * relance par un geste explicite du caissier, avec la même clé d'idempotence.
 */
export function useCreateSale() {
  const queryClient = useQueryClient();
  const siteId = useAuthStore((state) => state.siteId);

  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CreatePosSale;
      idempotencyKey: string;
    }) => posApi.createSale(payload, idempotencyKey),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: qk.currentSession(siteId ?? 'none'),
      });
      void queryClient.invalidateQueries({ queryKey: ['stock'] });
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'search'] });
    },
  });
}
