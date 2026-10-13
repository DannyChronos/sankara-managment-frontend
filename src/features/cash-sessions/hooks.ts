import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { qk } from '../../shared/api/query-keys';
import { useAuthStore } from '../../shared/auth/auth.store';
import { errorMessage } from '../../shared/api/errors';
import type {
  CloseSessionPayload,
  OpenSessionPayload,
  RegularizeSessionPayload,
  VerifySessionPayload,
} from '../../shared/api/types';
import { cashSessionsApi } from './api';

/**
 * Caisse ouverte du caissier. L'absence de session est une réponse métier
 * (`NO_OPEN_SESSION`), pas une erreur à réessayer : le POS s'en sert pour
 * afficher « Ouvrir ma caisse ».
 */
export function useCurrentSession() {
  const siteId = useAuthStore((state) => state.siteId);

  return useQuery({
    queryKey: qk.currentSession(siteId ?? 'none'),
    queryFn: () => cashSessionsApi.current(),
    enabled: Boolean(siteId),
    retry: false,
    staleTime: 0,
  });
}

export function useOpenSession() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: OpenSessionPayload) => cashSessionsApi.open(payload),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
      message.success(`Caisse ${session.number} ouverte.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: qk.session(id ?? 'none'),
    queryFn: () => cashSessionsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useSessionEvents(id: string | undefined) {
  return useQuery({
    queryKey: [...qk.session(id ?? 'none'), 'events'],
    queryFn: () => cashSessionsApi.events(id!),
    enabled: Boolean(id),
  });
}

/** Historique des sessions. Sans `cash-sessions:read-all`, l'API ne renvoie
 *  que les siennes : « toutes les sessions » et « mes sessions » sont le même
 *  écran, vu depuis deux rôles. */
export function useSessions(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['cash-sessions', 'list', filters],
    queryFn: () => cashSessionsApi.list(filters),
    staleTime: 30_000,
  });
}

export function useSessionsToVerify() {
  return useQuery({
    queryKey: qk.sessionsToVerify(),
    queryFn: () => cashSessionsApi.toVerify(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useCloseSession(id: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: CloseSessionPayload) =>
      cashSessionsApi.close(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
      message.success('Caisse clôturée. Elle part en vérification.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useVerifySession(id: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: VerifySessionPayload) =>
      cashSessionsApi.verify(id, payload),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
      message.success(
        session.status === 'CONFORM'
          ? 'Session déclarée conforme.'
          : 'Session déclarée non conforme.',
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useRegularizeSession(id: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: RegularizeSessionPayload) =>
      cashSessionsApi.regularize(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
      message.success('Régularisation enregistrée.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
