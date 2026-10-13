import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { suppliersApi, type SupplierPayload } from './api';

export function useSuppliers(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => suppliersApi.list(filters),
    staleTime: 60_000,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['suppliers', 'detail', id],
    queryFn: () => suppliersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useSupplierReceipts(id: string) {
  return useQuery({
    queryKey: ['suppliers', 'receipts', id],
    queryFn: () => suppliersApi.receipts(id),
    enabled: Boolean(id),
  });
}

/** La liste des fournisseurs alimente aussi le bon de réception. */
function invalidateSuppliers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: SupplierPayload) => suppliersApi.create(payload),
    onSuccess: (supplier) => {
      invalidateSuppliers(queryClient);
      message.success(`${supplier.name} ajouté aux fournisseurs.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SupplierPayload }) =>
      suppliersApi.update(id, payload),
    onSuccess: (supplier) => {
      invalidateSuppliers(queryClient);
      message.success(
        supplier.isActive
          ? 'Fiche fournisseur mise à jour.'
          : `${supplier.name} désactivé : il ne sera plus proposé en réception.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
