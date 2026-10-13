import { useQuery } from '@tanstack/react-query';
import { api } from '../api/http';
import { useDebounce } from './useDebounce';
import type { VariantSearchResult } from '../api/types';

/**
 * Recherche d'articles du site courant (l'en-tête `X-Site-Id` est posé par
 * l'intercepteur). Partagée par les bons de stock, les transferts et
 * l'inventaire partiel : toutes ces saisies désignent la même chose.
 */
export function useVariantSearch(term: string, inStockOnly = false) {
  const debounced = useDebounce(term, 250);

  return useQuery({
    queryKey: ['catalog', 'picker', debounced, inStockOnly],
    queryFn: () =>
      api.get<VariantSearchResult[]>('/catalog/variants/search', {
        params: {
          q: debounced,
          limit: 15,
          ...(inStockOnly ? { inStockOnly } : {}),
        },
      }),
    enabled: debounced.trim().length >= 2,
  });
}
