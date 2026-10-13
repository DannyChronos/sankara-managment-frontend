import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { customersApi, type CustomerPayload } from './api';

export function useCustomers(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customersApi.list(filters),
    staleTime: 60_000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () => customersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCustomerHistory(id: string) {
  return useQuery({
    queryKey: ['customers', 'history', id],
    queryFn: () => customersApi.history(id),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: CustomerPayload) => customersApi.create(payload),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      message.success(`${customer.fullName} ajouté·e au fichier clients.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerPayload }) =>
      customersApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      message.success('Fiche client mise à jour.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
