import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { rbacApi } from './api';

export function useRoles() {
  return useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: () => rbacApi.roles(),
    staleTime: 5 * 60_000,
  });
}

export function usePermissionModules() {
  return useQuery({
    queryKey: ['rbac', 'modules'],
    queryFn: () => rbacApi.modules(),
    // Le catalogue des permissions ne bouge qu'avec une version du logiciel.
    staleTime: Infinity,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['rbac'] });
  // Les permissions d'un rôle changent ce que voient ses utilisateurs.
  void queryClient.invalidateQueries({ queryKey: ['users'] });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: rbacApi.create,
    onSuccess: (role) => {
      invalidate(queryClient);
      message.success(`Rôle ${role.name} créé.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useRenameRole() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      rbacApi.rename(id, name),
    onSuccess: () => {
      invalidate(queryClient);
      message.success('Rôle renommé.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();

  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      rbacApi.setPermissions(id, permissions),
    onSuccess: (role) => {
      invalidate(queryClient);
      notification.success({
        message: `Permissions de ${role.name} enregistrées`,
        description: `${role.permissions.length} permission(s). Les utilisateurs concernés les reçoivent à leur prochaine requête.`,
        duration: 6,
      });
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => rbacApi.remove(id),
    onSuccess: () => {
      invalidate(queryClient);
      message.success('Rôle supprimé.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
