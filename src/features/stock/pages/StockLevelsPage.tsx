import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  Flex,
  Input,
  InputNumber,
  Switch,
  Table,
  Tag,
} from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import { useSetThreshold, useStockLevels } from '../hooks';
import type { StockLevelView } from '../../../shared/api/types';

/** État du stock du site courant : physique, réservé, disponible (F-17). */
export function StockLevelsPage() {
  const { siteId, currentSite } = useAuth();
  // L'écran s'ouvre déjà filtré quand on y arrive depuis ailleurs : une
  // alerte « stock bas » passe la variante concernée, le tableau de bord
  // passe `lowOnly`. On ne retombe pas sur tout le stock du site.
  const [searchParams, setSearchParams] = useSearchParams();
  const variantId = searchParams.get('variantId');
  const [q, setQ] = useState('');
  const [lowOnly, setLowOnly] = useState(
    searchParams.get('lowOnly') === 'true',
  );
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);

  const setThresholdMutation = useSetThreshold();
  const levels = useStockLevels({
    page,
    limit: 20,
    ...(siteId ? { siteId } : {}),
    ...(variantId ? { variantId } : {}),
    ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
    ...(lowOnly ? { lowOnly: true } : {}),
  });

  if (levels.isPending) return <PageSkeleton />;
  if (levels.isError) {
    return (
      <ErrorState error={levels.error} onRetry={() => void levels.refetch()} />
    );
  }

  return (
    <>
      <PageHeader
        title="État du stock"
        subtitle={currentSite?.name}
        actions={
          <PermissionGate perm="stock:entry">
            <Link to="/stock/operations/new?type=PRODUCTION_ENTRY">
              <Button type="primary">Nouveau bon d’entrée</Button>
            </Link>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
          {variantId && (
            <Tag
              color="geekblue"
              closable
              onClose={() => setSearchParams({}, { replace: true })}
            >
              un seul article
            </Tag>
          )}
          <Input.Search
            allowClear
            placeholder="SKU, variante ou produit"
            style={{ maxWidth: 320 }}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
          <Flex align="center" gap={8}>
            <Switch
              size="small"
              checked={lowOnly}
              onChange={(value) => {
                setLowOnly(value);
                setPage(1);
              }}
            />
            <span>Sous le seuil seulement</span>
          </Flex>
        </Flex>

        <Table<StockLevelView>
          rowKey="id"
          dataSource={levels.data.data}
          loading={levels.isFetching}
          pagination={{
            current: levels.data.meta.page,
            pageSize: levels.data.meta.limit,
            total: levels.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            { title: 'Site', dataIndex: 'siteCode', width: 80 },
            { title: 'SKU', dataIndex: 'sku', width: 210 },
            {
              title: 'Article',
              key: 'article',
              render: (_, row) => (
                <>
                  <div>{row.productName}</div>
                  <small style={{ color: '#8a98a8' }}>{row.variantName}</small>
                </>
              ),
            },
            {
              title: 'Physique',
              dataIndex: 'onHand',
              align: 'right',
              width: 100,
            },
            {
              title: 'Réservé',
              dataIndex: 'reserved',
              align: 'right',
              width: 100,
              render: (value: number) =>
                value > 0 ? <Tag color="processing">{value}</Tag> : value,
            },
            {
              title: 'Disponible',
              dataIndex: 'available',
              align: 'right',
              width: 120,
              render: (value: number, row) => (
                <Tag
                  color={
                    row.isLow ? (value <= 0 ? 'error' : 'warning') : 'success'
                  }
                >
                  {value}
                </Tag>
              ),
            },
            {
              title: 'En transit',
              dataIndex: 'inTransitIn',
              align: 'right',
              width: 110,
              render: (value: number) =>
                value > 0 ? <Tag color="geekblue">+{value}</Tag> : '—',
            },
            {
              title: 'Seuil d’alerte',
              dataIndex: 'minThreshold',
              align: 'right',
              width: 190,
              render: (value: number, row) =>
                editing === row.id ? (
                  <Flex gap={6} justify="end">
                    <InputNumber
                      size="small"
                      min={0}
                      precision={0}
                      autoFocus
                      style={{ width: 80 }}
                      value={threshold}
                      onChange={setThreshold}
                    />
                    <Button
                      size="small"
                      type="primary"
                      loading={setThresholdMutation.isPending}
                      onClick={() =>
                        setThresholdMutation.mutate(
                          { levelId: row.id, minThreshold: threshold ?? 0 },
                          { onSuccess: () => setEditing(null) },
                        )
                      }
                    >
                      OK
                    </Button>
                    <Button size="small" onClick={() => setEditing(null)}>
                      ✕
                    </Button>
                  </Flex>
                ) : (
                  <Flex gap={8} justify="end" align="center">
                    {value}
                    <PermissionGate perm="stock:entry">
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          setThreshold(value);
                          setEditing(row.id);
                        }}
                      >
                        régler
                      </Button>
                    </PermissionGate>
                  </Flex>
                ),
            },
            {
              title: 'Mis à jour',
              dataIndex: 'updatedAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
          ]}
        />
      </Card>
    </>
  );
}

export default StockLevelsPage;
