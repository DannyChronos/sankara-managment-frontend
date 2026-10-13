import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Flex, Input, Select, Switch, Table, Tag } from 'antd';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useCategories, useCreateProduct, useProducts } from '../hooks';
import { ProductForm } from '../components/ProductForm';
import type { ProductListItem } from '../../../shared/api/types';

export function ProductsPage() {
  const navigate = useNavigate();
  // Une catégorie peut pointer ici avec son filtre déjà posé.
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(
    searchParams.get('categoryId') ?? undefined,
  );
  const [formOpen, setFormOpen] = useState(false);
  const create = useCreateProduct();
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);

  const categories = useCategories();
  const products = useProducts({
    page,
    limit: 20,
    ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(activeOnly ? { isActive: true } : {}),
  });

  if (products.isPending) return <PageSkeleton />;
  if (products.isError) {
    return (
      <ErrorState
        error={products.error}
        onRetry={() => void products.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Produits"
        subtitle={`${products.data.meta.total} référence(s)`}
        actions={
          <PermissionGate perm="catalog:manage">
            <Button type="primary" onClick={() => setFormOpen(true)}>
              Nouveau produit
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Nom, marque ou SKU"
            style={{ maxWidth: 320 }}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Toutes les catégories"
            style={{ minWidth: 220 }}
            value={categoryId}
            onChange={(value?: string) => {
              setCategoryId(value);
              setPage(1);
            }}
            options={(categories.data ?? []).map((category) => ({
              value: category.id,
              label: `${category.name} (${category.productCount})`,
            }))}
          />
          <Flex align="center" gap={8}>
            <Switch
              checked={activeOnly}
              onChange={setActiveOnly}
              size="small"
            />
            <span>Actifs seulement</span>
          </Flex>
        </Flex>

        <Table<ProductListItem>
          rowKey="id"
          dataSource={products.data.data}
          loading={products.isFetching}
          pagination={{
            current: products.data.meta.page,
            pageSize: products.data.meta.limit,
            total: products.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Produit',
              dataIndex: 'name',
              render: (_, row) => (
                <>
                  <Link to={`/catalog/products/${row.id}`}>{row.name}</Link>
                  {row.brand && (
                    <div style={{ fontSize: 12, color: '#8a98a8' }}>
                      {row.brand}
                    </div>
                  )}
                </>
              ),
            },
            {
              title: 'Catégorie',
              dataIndex: ['category', 'name'],
              width: 200,
            },
            {
              title: 'Variantes',
              dataIndex: 'variantCount',
              align: 'right',
              width: 110,
            },
            {
              title: 'Prix boutique',
              dataIndex: 'priceRange',
              align: 'right',
              width: 200,
              render: (range: ProductListItem['priceRange']) =>
                range === null ? (
                  <Tag color="warning">sans prix</Tag>
                ) : range.min === range.max ? (
                  <Money value={range.min} />
                ) : (
                  <>
                    <Money value={range.min} /> – <Money value={range.max} />
                  </>
                ),
            },
            {
              title: 'Garantie',
              dataIndex: 'warrantyMonths',
              align: 'right',
              width: 110,
              render: (months: number | null) =>
                months ? `${months} mois` : '—',
            },
            {
              title: 'État',
              key: 'state',
              width: 170,
              render: (_, row) => (
                <>
                  {!row.isActive && <Tag>inactif</Tag>}
                  {row.isPublishedOnline && <Tag color="blue">en ligne</Tag>}
                  {row.isActive && !row.isPublishedOnline && (
                    <Tag color="default">boutique</Tag>
                  )}
                </>
              ),
            },
          ]}
        />
      </Card>

      {formOpen && (
        <ProductForm
          open
          pending={create.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(payload) =>
            create.mutate(payload, {
              onSuccess: (product) => {
                setFormOpen(false);
                // On enchaîne sur la fiche : un produit sans variante ne se
                // vend pas, et c'est là qu'on les ajoute.
                void navigate(`/catalog/products/${product.id}`);
              },
            })
          }
        />
      )}
    </>
  );
}

export default ProductsPage;
