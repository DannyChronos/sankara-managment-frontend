import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { stockApi } from './api';

export function useStockLevels(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['stock', 'levels', filters],
    queryFn: () => stockApi.levels(filters),
    staleTime: 30_000,
  });
}

export function useStockMovements(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['stock', 'movements', filters],
    queryFn: () => stockApi.movements(filters),
    staleTime: 30_000,
  });
}

export function useStockOperations(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['stock', 'operations', filters],
    queryFn: () => stockApi.operations(filters),
    staleTime: 30_000,
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => stockApi.suppliers(),
    staleTime: 5 * 60_000,
  });
}

export function useVariantPicker(term: string) {
  const debounced = useDebounce(term, 250);

  return useQuery({
    queryKey: ['catalog', 'picker', debounced],
    queryFn: () => stockApi.searchVariants(debounced),
    enabled: debounced.trim().length >= 2,
  });
}

export function useSetThreshold() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      levelId,
      minThreshold,
    }: {
      levelId: string;
      minThreshold: number;
    }) => stockApi.setThreshold(levelId, minThreshold),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stock'] });
      message.success('Seuil d’alerte mis à jour.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useCreateOperation() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: stockApi.createOperation,
    onSuccess: (operation) => {
      void queryClient.invalidateQueries({ queryKey: ['stock'] });
      message.success(`Bon ${operation.number} créé en brouillon.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

/** La validation est le seul moment où le stock bouge réellement. */
export function useValidateOperation() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => stockApi.validateOperation(id),
    onSuccess: (operation) => {
      void queryClient.invalidateQueries({ queryKey: ['stock'] });
      message.success(
        `Bon ${operation.number} validé : ${operation.totalQuantity} article(s) ${
          operation.direction === 'IN' ? 'entrés' : 'sortis'
        }.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useCancelOperation() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      stockApi.cancelOperation(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stock'] });
      message.success('Bon annulé.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
