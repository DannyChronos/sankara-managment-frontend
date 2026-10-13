import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { notificationsApi } from './api';

export function useNotifications(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationsApi.list(filters),
    staleTime: 15_000,
  });
}

/**
 * Compteur de la cloche. Il se rafraîchit tout seul : une alerte naît d'un
 * événement serveur, pas d'une action de l'utilisateur, et rien ne la
 * pousserait sinon jusqu'au prochain changement de page.
 */
export function useUnreadCount() {
  const query = useQuery({
    queryKey: ['notifications', { bell: true }],
    queryFn: () => notificationsApi.list({ limit: 5 }),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return {
    unread: query.data?.meta.unread ?? 0,
    recent: query.data?.data ?? [],
    isPending: query.isPending,
  };
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => invalidate(queryClient),
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: ({ marked }) => {
      invalidate(queryClient);
      message.success(
        marked === 0
          ? 'Aucune notification non lue.'
          : `${marked} notification(s) marquée(s) comme lue(s).`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
