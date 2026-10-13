import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, DatePicker, Flex, Statistic, Table, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { usePermission } from '../../../shared/auth/usePermission';
import { formatDateTime } from '../../../shared/utils/format';
import { useSales } from '../hooks';
import { OrderStatusTag } from '../components/OrderStatusTag';
import type { Order } from '../../../shared/api/types';

/**
 * Historique des ventes. Le backend filtre déjà sur le caissier quand
 * l'utilisateur n'a pas `cash-sessions:read-all` : « mes ventes » et « les
 * ventes » sont le même écran, vu depuis deux rôles.
 */
export function SalesPage() {
  const { siteId, currentSite } = useAuth();
  const { can } = usePermission();
  const seesAll = can('cash-sessions:read-all');
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);

  const sales = useSales({
    page,
    limit: 20,
    ...(siteId ? { siteId } : {}),
    ...(range
      ? {
          from: range[0].format('YYYY-MM-DD'),
          to: range[1].format('YYYY-MM-DD'),
        }
      : {}),
  });

  if (sales.isPending) return <PageSkeleton />;
  if (sales.isError) {
    return (
      <ErrorState error={sales.error} onRetry={() => void sales.refetch()} />
    );
  }

  // Totaux de la page affichée, pas de la période : l'API pagine, et une
  // somme partielle présentée comme un total serait un mensonge.
  const pageRevenue = sales.data.data
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((total, order) => total + order.total - order.refundedTotal, 0);

  return (
    <>
      <PageHeader
        title={seesAll ? 'Ventes' : 'Mes ventes'}
        subtitle={currentSite?.name}
      />

      <Card>
        <Flex gap={24} wrap align="center" style={{ marginBottom: 16 }}>
          <DatePicker.RangePicker
            value={range}
            onChange={(value) => {
              setRange(value as [Dayjs, Dayjs] | null);
              setPage(1);
            }}
            allowClear
          />
          <Statistic
            title={`Net encaissé sur cette page (${sales.data.data.length} vente(s))`}
            valueRender={() => <Money value={pageRevenue} strong />}
            value={pageRevenue}
          />
          <Typography.Text type="secondary">
            {sales.data.meta.total} vente(s) au total
          </Typography.Text>
        </Flex>

        <Table<Order>
          rowKey="id"
          dataSource={sales.data.data}
          loading={sales.isFetching}
          pagination={{
            current: sales.data.meta.page,
            pageSize: sales.data.meta.limit,
            total: sales.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Numéro',
              dataIndex: 'number',
              width: 190,
              render: (value: string, row) => (
                <Link to={`/sales/${row.id}`}>{value}</Link>
              ),
            },
            {
              title: 'Date',
              dataIndex: 'createdAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
            ...(seesAll
              ? [
                  {
                    title: 'Caissier',
                    dataIndex: ['cashier', 'fullName'],
                    render: (value: string | undefined) => value ?? '—',
                  },
                ]
              : []),
            {
              title: 'Client',
              dataIndex: ['customer', 'fullName'],
              render: (value: string | undefined) => value ?? 'Comptoir',
            },
            {
              title: 'Articles',
              key: 'items',
              align: 'right',
              width: 90,
              render: (_, row) =>
                row.lines.reduce((count, line) => count + line.quantity, 0),
            },
            {
              title: 'Total',
              dataIndex: 'total',
              align: 'right',
              width: 140,
              render: (value: number) => <Money value={value} />,
            },
            {
              title: 'Remboursé',
              dataIndex: 'refundedTotal',
              align: 'right',
              width: 140,
              render: (value: number) =>
                value > 0 ? <Money value={-value} signed /> : '—',
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              width: 160,
              render: (value: string) => <OrderStatusTag status={value} />,
            },
          ]}
        />
      </Card>
    </>
  );
}

export default SalesPage;
