import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Empty, Image, Table, Tabs, Tag } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { useProduct, useVariantStock } from '../hooks';
import { PriceEditor } from '../components/PriceEditor';
import type { ProductVariantView } from '../../../shared/api/types';

const FIRMNESS_LABEL: Record<string, string> = {
  SOFT: 'Souple',
  MEDIUM: 'Moyen',
  FIRM: 'Ferme',
  EXTRA_FIRM: 'Très ferme',
};

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const { data: product, isPending, isError, error, refetch } = useProduct(id);
  const [stockVariantId, setStockVariantId] = useState<string | undefined>();
  const stock = useVariantStock(stockVariantId);

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
          </>
        }
      />

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
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'images',
            label: `Photos (${product.images.length})`,
            children: (
              <Card>
                {product.images.length === 0 ? (
                  <Empty
                    description="Aucune photo"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <Image.PreviewGroup>
                    {product.images.map((image) => (
                      <Image
                        key={image.id}
                        src={image.url}
                        alt={image.alt ?? product.name}
                        width={160}
                        style={{ marginRight: 12, borderRadius: 8 }}
                      />
                    ))}
                  </Image.PreviewGroup>
                )}
              </Card>
            ),
          },
        ]}
      />
    </>
  );
}

export default ProductDetailPage;
