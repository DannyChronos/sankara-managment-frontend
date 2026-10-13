import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { sitesApi, type SitePayload } from './api';

/** Liste des sites : change rarement, on la garde en cache cinq minutes. */
export function useSites(activeOnly = true) {
  return useQuery({
    queryKey: ['sites', { activeOnly }],
    queryFn: () => sitesApi.list(activeOnly ? { isActive: true } : {}),
    staleTime: 5 * 60_000,
  });
}

/** Vue d'administration : tous les sites, actifs ou non, avec leur effectif. */
export function useAllSites() {
  return useQuery({
    queryKey: ['sites', 'all'],
    queryFn: () => sitesApi.detailed(),
    staleTime: 60_000,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['sites'] });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: SitePayload) => sitesApi.create(payload),
    onSuccess: (site) => {
      invalidate(queryClient);
      message.success(`Site ${site.code} créé.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Omit<SitePayload, 'code'>;
    }) => sitesApi.update(id, payload),
    onSuccess: () => {
      invalidate(queryClient);
      message.success('Site mis à jour.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSetSiteStatus() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      sitesApi.setStatus(id, isActive),
    onSuccess: (site) => {
      invalidate(queryClient);
      message.success(
        site.isActive ? `${site.code} réactivé.` : `${site.code} désactivé.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
