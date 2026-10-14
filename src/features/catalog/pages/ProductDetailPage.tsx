import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Card, Descriptions, Table, Tabs, Tag } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import {
  useCreateVariant,
  useGenerateVariants,
  useProduct,
  useUpdateVariant,
  useUpdateProduct,
  useVariantStock,
} from '../hooks';
import { FIRMNESS_LABEL } from '../labels';
import { ProductForm } from '../components/ProductForm';
import { VariantForm } from '../components/VariantForm';
import { VariantModal } from '../components/VariantModal';
import { ProductPhotos } from '../components/ProductPhotos';
import { PriceEditor } from '../components/PriceEditor';
import type { ProductVariantView } from '../../../shared/api/types';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const { data: product, isPending, isError, error, refetch } = useProduct(id);
  const [stockVariantId, setStockVariantId] = useState<string | undefined>();
  const stock = useVariantStock(stockVariantId);
  const [editOpen, setEditOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [editedVariant, setEditedVariant] = useState<ProductVariantView | null>(
    null,
  );
  const update = useUpdateProduct();
  const createVariant = useCreateVariant(id);
  const generateVariants = useGenerateVariants(id);
  const updateVariant = useUpdateVariant();

  if (isPending) return <PageSkeleton />;
  if (isError)
    return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.category.name}
        breadcrumb={[
          { title: 'Catalogue' },
          { title: 'Produits', href: '/catalog/products' },
          { title: product.name },
        ]}
        actions={
          <>
            {!product.isActive && <Tag>inactif</Tag>}
            {product.isPublishedOnline && (
              <Tag color="blue">publié en ligne</Tag>
            )}
            <PermissionGate perm="catalog:manage">
              <Button onClick={() => setEditOpen(true)}>Modifier</Button>
              <Button type="primary" onClick={() => setVariantOpen(true)}>
                Ajouter des variantes
              </Button>
            </PermissionGate>
          </>
        }
      />

      {product.variants.length === 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Ce produit n’a aucune variante"
          description="Il n’apparaîtra pas en caisse : ce sont les variantes qui portent le SKU, le prix et le stock."
        />
      )}

      <Tabs
        items={[
          {
            key: 'info',
            label: 'Informations',
            children: (
              <Card>
                <Descriptions
                  column={{ xs: 1, sm: 2 }}
                  items={[
                    {
                      key: 'brand',
                      label: 'Marque',
                      children: product.brand ?? '—',
                    },
                    {
                      key: 'warranty',
                      label: 'Garantie',
                      children: product.warrantyMonths
                        ? `${product.warrantyMonths} mois`
                        : '—',
                    },
                    {
                      key: 'slug',
                      label: 'Identifiant web',
                      children: product.slug,
                    },
                    {
                      key: 'variants',
                      label: 'Variantes',
                      children: product.variants.length,
                    },
                    {
                      key: 'description',
                      label: 'Description',
                      span: 2,
                      children: product.description ?? '—',
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'variants',
            label: `Variantes (${product.variants.length})`,
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table<ProductVariantView>
                  rowKey="id"
                  dataSource={product.variants}
                  pagination={false}
                  expandable={{
                    onExpand: (expanded, row) =>
                      setStockVariantId(expanded ? row.id : undefined),
                    expandedRowRender: (row) =>
                      stockVariantId !== row.id ? null : (
                        <Table
                          size="small"
                          rowKey="id"
                          pagination={false}
                          loading={stock.isFetching}
                          dataSource={stock.data ?? []}
                          locale={{ emptyText: 'Aucun stock sur ce site' }}
                          columns={[
                            { title: 'Site', dataIndex: 'siteCode', width: 90 },
                            {
                              title: 'Physique',
                              dataIndex: 'onHand',
                              align: 'right',
                            },
                            {
                              title: 'Réservé',
                              dataIndex: 'reserved',
                              align: 'right',
                            },
                            {
                              title: 'Disponible',
                              dataIndex: 'available',
                              align: 'right',
                              render: (value: number, level) => (
                                <Tag color={level.isLow ? 'error' : 'success'}>
                                  {value}
                                </Tag>
                              ),
                            },
                            {
                              title: 'En transit',
                              dataIndex: 'inTransitIn',
                              align: 'right',
                            },
                            {
                              title: 'Seuil',
                              dataIndex: 'minThreshold',
                              align: 'right',
                            },
                          ]}
                        />
                      ),
                  }}
                  columns={[
                    { title: 'SKU', dataIndex: 'sku', width: 210 },
                    {
                      // C'est lui que lit la douchette : sans colonne, on ne
                      // pouvait ni le vérifier ni le corriger.
                      title: 'Code-barres',
                      dataIndex: 'barcode',
                      width: 160,
                      render: (value: string | null) =>
                        value ?? <span style={{ color: '#8a98a8' }}>—</span>,
                    },
                    { title: 'Variante', dataIndex: 'name' },
                    {
                      title: 'Dimensions',
                      key: 'dimensions',
                      width: 150,
                      render: (_, row) =>
                        row.widthCm && row.lengthCm
                          ? `${row.widthCm}×${row.lengthCm}${row.thicknessCm ? ` · ${row.thicknessCm} cm` : ''}`
                          : '—',
                    },
                    {
                      title: 'Densité',
                      dataIndex: 'densityKgM3',
                      width: 100,
                      align: 'right',
                      render: (value: number | null) =>
                        value ? `${value} kg/m³` : '—',
                    },
                    {
                      title: 'Fermeté',
                      dataIndex: 'firmness',
                      width: 110,
                      render: (value: string | null) =>
                        value ? (FIRMNESS_LABEL[value] ?? value) : '—',
                    },
                    {
                      title: 'Prix boutique',
                      key: 'pos',
                      align: 'right',
                      width: 230,
                      render: (_, row) => (
                        <PriceEditor
                          productId={product.id}
                          variantId={row.id}
                          channel="POS"
                          amount={row.prices.POS}
                        />
                      ),
                    },
                    {
                      title: 'Prix web',
                      key: 'web',
                      align: 'right',
                      width: 230,
                      render: (_, row) => (
                        <PriceEditor
                          productId={product.id}
                          variantId={row.id}
                          channel="WEB"
                          amount={row.prices.WEB}
                        />
                      ),
                    },
                    {
                      title: '',
                      key: 'actions',
                      width: 110,
                      render: (_, row) => (
                        <PermissionGate perm="catalog:manage">
                          <Button
                            size="small"
                            onClick={() => setEditedVariant(row)}
                          >
                            Modifier
                          </Button>
                        </PermissionGate>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'images',
            label: `Photos (${product.images.length})`,
            children: <ProductPhotos product={product} />,
          },
        ]}
      />

      {editOpen && (
        <ProductForm
          product={product}
          open
          pending={update.isPending}
          onCancel={() => setEditOpen(false)}
          onSubmit={(payload) =>
            update.mutate(
              { id, payload },
              { onSuccess: () => setEditOpen(false) },
            )
          }
        />
      )}

      {editedVariant && (
        <VariantForm
          variant={editedVariant}
          open
          pending={updateVariant.isPending}
          onCancel={() => setEditedVariant(null)}
          onSubmit={(payload) =>
            updateVariant.mutate(
              { id: editedVariant.id, payload },
              { onSuccess: () => setEditedVariant(null) },
            )
          }
        />
      )}

      {variantOpen && (
        <VariantModal
          open
          pending={createVariant.isPending || generateVariants.isPending}
          onCancel={() => setVariantOpen(false)}
          onCreateOne={(payload) =>
            createVariant.mutate(payload, {
              onSuccess: () => setVariantOpen(false),
            })
          }
          onGenerate={(payload) =>
            generateVariants.mutate(payload, {
              onSuccess: () => setVariantOpen(false),
            })
          }
        />
      )}
    </>
  );
}

export default ProductDetailPage;
