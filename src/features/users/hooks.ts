import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import {
  usersApi,
  type CreateUserPayload,
  type UpdateUserPayload,
} from './api';
import type { UserStatus } from '../../shared/api/types';

/**
 * `enabled` est explicite : la liste des utilisateurs demande `users:read`,
 * que tous les lecteurs de rapports n'ont pas. Mieux vaut ne pas appeler que
 * de récolter un 403.
 */
export function useUsers(filters: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.list(filters),
    enabled,
    staleTime: 5 * 60_000,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['users'] });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => invalidate(queryClient),
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: (user) => {
      invalidate(queryClient);
      message.success(`${user.fullName} mis à jour.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

/** Désactiver coupe le compte et révoque ses sessions ouvertes, tout de suite. */
export function useSetUserStatus() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      usersApi.setStatus(id, status),
    onSuccess: (user) => {
      invalidate(queryClient);
      message.success(
        user.status === 'ACTIVE'
          ? `${user.fullName} peut se connecter.`
          : `${user.fullName} est désactivé : ses sessions sont révoquées.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSetUserSites() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      id,
      siteIds,
      defaultSiteId,
    }: {
      id: string;
      siteIds: string[];
      defaultSiteId?: string;
    }) => usersApi.setSites(id, siteIds, defaultSiteId),
    onSuccess: () => {
      invalidate(queryClient);
      message.success('Sites mis à jour.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
