import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { qk } from '../../shared/api/query-keys';
import { einvoicesApi, type EinvoiceFilters } from './api';

export function useEinvoices(filters: EinvoiceFilters) {
  return useQuery({
    queryKey: qk.einvoices(filters),
    queryFn: () => einvoicesApi.list(filters),
    staleTime: 30_000,
  });
}

export function useEinvoice(id: string) {
  return useQuery({
    queryKey: qk.einvoice(id),
    queryFn: () => einvoicesApi.get(id),
    enabled: Boolean(id),
    staleTime: 10_000,
    // Une facture encore en vol bouge toute seule : on la suit sans que
    // l'utilisateur ait à recharger.
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' ||
      query.state.data?.status === 'SUBMITTED'
        ? 5_000
        : false,
  });
}

export function useEinvoiceAttempts(id: string, enabled = true) {
  return useQuery({
    queryKey: qk.einvoiceAttempts(id),
    queryFn: () => einvoicesApi.attempts(id),
    enabled: enabled && Boolean(id),
    staleTime: 10_000,
  });
}

/**
 * Carte « Factures du jour » du tableau de bord (§10).
 *
 * `enabled` est laissé à l'appelant : un caissier n'a pas `einvoice:read` et
 * la requête partirait pour revenir en 403.
 */
export function useEinvoiceDailySummary(enabled = true) {
  return useQuery({
    queryKey: qk.einvoiceDailySummary(),
    queryFn: () => einvoicesApi.dailySummary(),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Relance d'une facture rejetée. Le serveur crée une **nouvelle** facture
 * avec le corps figé : la rejetée reste au journal, et l'identifiant change.
 */
export function useRetryEinvoice() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => einvoicesApi.retry(id),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: ['einvoices'] });
      // Le statut de la vente repasse en « en cours » : sa fiche et la liste
      // des ventes doivent le refléter.
      void queryClient.invalidateQueries({ queryKey: ['sales'] });
      void queryClient.invalidateQueries({ queryKey: ['fiscal'] });
      message.success(
        `Facture relancée. Elle repart à la DGI sous le numéro interne ${invoice.id.slice(0, 8)}.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
