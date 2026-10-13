import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { transfersApi, type ReceiveLinePayload } from './api';

export function useTransfers(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transfers', filters],
    queryFn: () => transfersApi.list(filters),
    staleTime: 30_000,
  });
}

export function useTransfer(id: string) {
  return useQuery({
    queryKey: ['transfers', 'detail', id],
    queryFn: () => transfersApi.get(id),
    enabled: Boolean(id),
  });
}

/** Tout changement d'état d'un transfert déplace du stock : on vide les deux caches. */
function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['transfers'] });
  void queryClient.invalidateQueries({ queryKey: ['stock'] });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: transfersApi.create,
    onSuccess: (transfer) => {
      invalidate(queryClient);
      message.success(`Transfert ${transfer.number} préparé.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useShipTransfer() {
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => transfersApi.ship(id),
    onSuccess: (transfer) => {
      invalidate(queryClient);
      // Expédier engage deux sites : la notification reste à l'écran le temps
      // que le magasinier note le numéro pour le bon de route.
      notification.success({
        message: `Transfert ${transfer.number} expédié`,
        description: `${transfer.totalSent} article(s) en transit vers ${transfer.toSite.name}.`,
        duration: 6,
      });
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useReceiveTransfer() {
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();

  return useMutation({
    mutationFn: ({ id, lines }: { id: string; lines: ReceiveLinePayload[] }) =>
      transfersApi.receive(id, lines),
    onSuccess: (transfer) => {
      invalidate(queryClient);
      if (transfer.status === 'RECEIVED_WITH_GAP') {
        notification.warning({
          message: `Transfert ${transfer.number} reçu avec écart`,
          description: `${transfer.totalReceived} reçu(s) sur ${transfer.totalSent} expédié(s). L'administrateur est prévenu.`,
          duration: 8,
        });
      } else {
        message.success(
          `Transfert ${transfer.number} réceptionné : ${transfer.totalReceived} article(s).`,
        );
      }
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      transfersApi.cancel(id, reason),
    onSuccess: () => {
      invalidate(queryClient);
      message.success('Transfert annulé.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
