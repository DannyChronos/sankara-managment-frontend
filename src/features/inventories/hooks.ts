import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { inventoriesApi } from './api';

export function useInventories(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['inventories', filters],
    queryFn: () => inventoriesApi.list(filters),
    staleTime: 30_000,
  });
}

export function useInventory(id: string) {
  return useQuery({
    queryKey: ['inventories', 'detail', id],
    queryFn: () => inventoriesApi.get(id),
    enabled: Boolean(id),
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['inventories'] });
  void queryClient.invalidateQueries({ queryKey: ['stock'] });
}

export function useStartInventory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: inventoriesApi.start,
    onSuccess: (inventory) => {
      invalidate(queryClient);
      message.success(
        `Inventaire ${inventory.number} ouvert : ${inventory.lineCount} article(s) à compter.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

/** Enregistrement du comptage : silencieux, il arrive à chaque rayon terminé. */
export function useSetCounts() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      id,
      lines,
    }: {
      id: string;
      lines: { variantId: string; countedQty: number }[];
    }) => inventoriesApi.setCounts(id, lines),
    onSuccess: (inventory) => {
      queryClient.setQueryData(
        ['inventories', 'detail', inventory.id],
        inventory,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSubmitInventory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => inventoriesApi.submit(id),
    onSuccess: (inventory) => {
      invalidate(queryClient);
      message.success(
        `Comptage clôturé : ${inventory.gapCount} écart(s) à valider.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

/** Validation : c'est ici, et seulement ici, que le stock est ajusté. */
export function useValidateInventory() {
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      inventoriesApi.validate(id, note),
    onSuccess: (inventory) => {
      invalidate(queryClient);
      notification.success({
        message: `Inventaire ${inventory.number} validé`,
        description: `${inventory.gapCount} ajustement(s) écrit(s) au registre de stock.`,
        duration: 6,
      });
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useCancelInventory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      inventoriesApi.cancel(id, reason),
    onSuccess: () => {
      invalidate(queryClient);
      message.success('Inventaire annulé.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
