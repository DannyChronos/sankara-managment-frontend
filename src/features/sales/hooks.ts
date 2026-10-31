import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { salesApi } from './api';
import { qk } from '../../shared/api/query-keys';
import type {
  CancelSalePayload,
  CreateReturnPayload,
  EinvoiceBuyer,
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
 * Facture normalisée d'une vente.
 *
 * `fast` est vrai en caisse pendant qu'un caissier attend devant son écran :
 * on interroge chaque seconde. Ailleurs — la fiche de vente — cinq secondes
 * suffisent. C'est l'appelant qui décide quand cesser d'attendre vite : le
 * compte des relevés ne le dirait pas, et « Attendre encore » doit pouvoir
 * relancer l'interrogation.
 */
export function useSaleEinvoice(orderId: string | undefined, fast: boolean) {
  return useQuery({
    queryKey: qk.saleEinvoice(orderId ?? 'none'),
    queryFn: () => salesApi.einvoice(orderId as string),
    enabled: Boolean(orderId),
    staleTime: fast ? 0 : 10_000,
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' ? (fast ? 1_000 : 5_000) : false,
  });
}

/** Le client revient le jour même réclamer sa facture (§7.3). */
export function useNormalizeLate() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, buyer }: { id: string; buyer?: EinvoiceBuyer }) =>
      salesApi.normalizeLate(id, buyer),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['sales'] });
      void queryClient.invalidateQueries({ queryKey: qk.saleEinvoice(id) });
      void queryClient.invalidateQueries({ queryKey: ['einvoices'] });
      message.success('Facture normalisée demandée : elle part à la DGI.');
    },
    onError: (error) => message.error(errorMessage(error)),
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
  // Une annulation ou un retour émet un avoir : le journal des factures et
  // l'état de la facture de la vente changent aussi.
  void queryClient.invalidateQueries({ queryKey: ['einvoices'] });
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
