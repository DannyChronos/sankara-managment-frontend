import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import {
  catalogApi,
  type CategoryPayload,
  type GenerateVariantsPayload,
  type ProductImagePayload,
  type ProductPayload,
  type UpdateVariantPayload,
  type VariantPayload,
} from './api';

export function useCategories(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['catalog', 'categories', params],
    queryFn: () => catalogApi.categories(params),
    staleTime: 5 * 60_000,
  });
}

/** Une modification du catalogue change ce que la caisse propose. */
function invalidateCatalog(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['catalog'] });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: CategoryPayload) =>
      catalogApi.createCategory(payload),
    onSuccess: (category) => {
      invalidateCatalog(queryClient);
      message.success(`Catégorie ${category.name} créée.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
      catalogApi.updateCategory(id, payload),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      message.success('Catégorie mise à jour.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: ProductPayload) => catalogApi.createProduct(payload),
    onSuccess: (product) => {
      invalidateCatalog(queryClient);
      message.success(
        `${product.name} créé. Ajoutez-lui des variantes pour le vendre.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProductPayload>;
    }) => catalogApi.updateProduct(id, payload),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      message.success('Produit mis à jour.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useCreateVariant(productId: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: VariantPayload) =>
      catalogApi.createVariant(productId, payload),
    onSuccess: (variant) => {
      invalidateCatalog(queryClient);
      message.success(`Variante ${variant.sku} ajoutée.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

/** Dimensions × épaisseurs : la façon dont un matelas se décline vraiment. */
export function useGenerateVariants(productId: string) {
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();

  return useMutation({
    mutationFn: (payload: GenerateVariantsPayload) =>
      catalogApi.generateVariants(productId, payload),
    onSuccess: ({ created, skipped }) => {
      invalidateCatalog(queryClient);
      notification.success({
        message: `${created.length} variante(s) créée(s)`,
        description: skipped
          ? `${skipped} combinaison(s) existaient déjà et ont été ignorées.`
          : 'Toutes les combinaisons demandées ont été créées.',
        duration: 6,
      });
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useProducts(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['catalog', 'products', filters],
    queryFn: () => catalogApi.products(filters),
    staleTime: 5 * 60_000,
  });
}

export function useAddProductImage(productId: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: ProductImagePayload) =>
      catalogApi.addProductImage(productId, payload),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      message.success('Photo ajoutée.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useRemoveProductImage(productId: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (imageId: string) =>
      catalogApi.removeProductImage(productId, imageId),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      message.success('Photo supprimée.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateVariantPayload;
    }) => catalogApi.updateVariant(id, payload),
    onSuccess: (variant) => {
      invalidateCatalog(queryClient);
      message.success(`Variante ${variant.sku} mise à jour.`);
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'product', id],
    queryFn: () => catalogApi.product(id!),
    enabled: Boolean(id),
  });
}

export function useVariantStock(variantId: string | undefined) {
  return useQuery({
    queryKey: ['stock', 'variant', variantId],
    queryFn: () => catalogApi.variantStock(variantId!),
    enabled: Boolean(variantId),
  });
}

export function usePriceHistory(variantId: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'prices', variantId],
    queryFn: () => catalogApi.priceHistory(variantId!),
    enabled: Boolean(variantId),
  });
}

/** Fixer un prix clôture le précédent côté API : l'historique reste entier. */
export function useSetPrice(productId: string) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      variantId,
      channel,
      amount,
    }: {
      variantId: string;
      channel: 'POS' | 'WEB';
      amount: number;
    }) => catalogApi.setPrice(variantId, channel, amount),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['catalog', 'product', productId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['catalog', 'prices', variables.variantId],
      });
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
      message.success('Prix mis à jour. L’ancien reste dans l’historique.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
