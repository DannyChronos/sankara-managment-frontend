import { useState } from 'react';
import { Button, Card, Empty, Flex, Image, Tag, Typography } from 'antd';
import { ConfirmAction, PermissionGate } from '../../../shared/components';
import { fileUrl } from '../../../shared/api/assets';
import { useAddProductImage, useRemoveProductImage } from '../hooks';
import { PhotoUploadModal } from './PhotoUploadModal';
import type { ProductDetail } from '../../../shared/api/types';

interface Props {
  product: ProductDetail;
}

/**
 * Les photos ne servent qu'à la boutique en ligne : la caisse travaille au
 * SKU. On les rattache donc au produit, et à une variante seulement quand la
 * déclinaison se voit (une couleur, une hauteur).
 */
export function ProductPhotos({ product }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const add = useAddProductImage(product.id);
  const remove = useRemoveProductImage(product.id);

  const variantName = (variantId: string | null) =>
    product.variants.find((variant) => variant.id === variantId)?.sku;

  return (
    <Card
      title={`${product.images.length} photo(s)`}
      extra={
        <PermissionGate perm="catalog:manage">
          <Button type="primary" onClick={() => setAddOpen(true)}>
            Ajouter une photo
          </Button>
        </PermissionGate>
      }
    >
      {product.images.length === 0 ? (
        <Empty
          description="Aucune photo"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Image.PreviewGroup>
          <Flex gap={16} wrap>
            {product.images.map((image) => (
              <Flex key={image.id} vertical gap={8} style={{ width: 180 }}>
                <Image
                  src={fileUrl(image.url)}
                  alt={image.alt ?? product.name}
                  width={180}
                  height={180}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />

                {image.variantId ? (
                  <Tag color="blue" style={{ alignSelf: 'flex-start' }}>
                    {variantName(image.variantId) ?? 'variante'}
                  </Tag>
                ) : (
                  <Tag style={{ alignSelf: 'flex-start' }}>tout le produit</Tag>
                )}

                <Typography.Text type="secondary" ellipsis>
                  {image.alt ?? 'Sans texte alternatif'}
                </Typography.Text>

                <PermissionGate perm="catalog:manage">
                  <ConfirmAction
                    danger
                    title="Supprimer cette photo ?"
                    description="Le fichier est effacé du serveur."
                    okText="Supprimer"
                    loading={remove.isPending}
                    onConfirm={() => remove.mutate(image.id)}
                  >
                    Supprimer
                  </ConfirmAction>
                </PermissionGate>
              </Flex>
            ))}
          </Flex>
        </Image.PreviewGroup>
      )}

      {addOpen && (
        <PhotoUploadModal
          open
          pending={add.isPending}
          variants={product.variants}
          onCancel={() => setAddOpen(false)}
          onSubmit={(payload) =>
            add.mutate(payload, { onSuccess: () => setAddOpen(false) })
          }
        />
      )}
    </Card>
  );
}
