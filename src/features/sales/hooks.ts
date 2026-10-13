import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { salesApi } from './api';
import type {
  CancelSalePayload,
  CreateReturnPayload,
} from '../../shared/api/types';

export function useSales(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: () => salesApi.list(filters),
    staleTime: 30_000,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', 'detail', id],
    queryFn: () => salesApi.get(id),
    enabled: Boolean(id),
  });
}

/**
 * Annuler ou retourner touche le stock et la caisse du jour : on relâche les
 * trois caches, pas seulement celui des ventes.
 */
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['sales'] });
  void queryClient.invalidateQueries({ queryKey: ['stock'] });
  void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelSalePayload }) =>
      salesApi.cancel(id, payload),
    onSuccess: (order) => {
      invalidate(queryClient);
      message.success(`Vente ${order.number} annulée.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateReturnPayload;
    }) => salesApi.createReturn(id, payload),
    onSuccess: (order) => {
      invalidate(queryClient);
      notification.success({
        message: `Retour enregistré sur ${order.number}`,
        description:
          'Le remboursement est porté par votre session de caisse ouverte, pas par celle de la vente d’origine.',
        duration: 7,
      });
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
