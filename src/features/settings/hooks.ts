import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { settingsApi, type SettingsMap } from './api';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.all(),
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (values: SettingsMap) => settingsApi.update(values),
    onSuccess: (values) => {
      queryClient.setQueryData(['settings'], values);
      // Un seuil ou une tolérance change ce que le serveur accepte : les
      // écrans qui s'y réfèrent doivent se relire.
      void queryClient.invalidateQueries({ queryKey: ['inventories'] });
      void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
      message.success('Paramètres enregistrés.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
