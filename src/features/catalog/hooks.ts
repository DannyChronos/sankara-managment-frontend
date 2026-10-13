import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { catalogApi } from './api';

export function useCategories(tree = false) {
  return useQuery({
    queryKey: ['catalog', 'categories', tree],
    queryFn: () => catalogApi.categories(tree),
    staleTime: 5 * 60_000,
  });
}

export function useProducts(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['catalog', 'products', filters],
    queryFn: () => catalogApi.products(filters),
    staleTime: 5 * 60_000,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'product', id],
    queryFn: () => catalogApi.product(id!),
    enabled: Boolean(id),
  });
}

export function useVariantStock(variantId: string | undefined) {
  return useQuery({
    queryKey: ['stock', 'variant', variantId],
    queryFn: () => catalogApi.variantStock(variantId!),
    enabled: Boolean(variantId),
  });
}

export function usePriceHistory(variantId: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'prices', variantId],
    queryFn: () => catalogApi.priceHistory(variantId!),
    enabled: Boolean(variantId),
  });
}

/** Fixer un prix clôture le précédent côté API : l'historique reste entier. */
export function useSetPrice(productId: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      variantId,
      channel,
      amount,
    }: {
      variantId: string;
      channel: 'POS' | 'WEB';
      amount: number;
    }) => catalogApi.setPrice(variantId, channel, amount),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['catalog', 'product', productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['catalog', 'prices', variables.variantId],
      });
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
      message.success('Prix mis à jour. L’ancien reste dans l’historique.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
