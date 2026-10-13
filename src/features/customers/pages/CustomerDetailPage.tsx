import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, Empty, Table, Tag } from 'antd';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import { useCustomer, useCustomerHistory, useUpdateCustomer } from '../hooks';
import { CustomerForm } from '../components/CustomerForm';
import { OrderStatusTag } from '../../sales/components/OrderStatusTag';
import type {
  CustomerPurchase,
  CustomerPurchaseLine,
} from '../../../shared/api/types';

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const [formOpen, setFormOpen] = useState(false);

  const customer = useCustomer(id);
  const history = useCustomerHistory(id);
  const update = useUpdateCustomer();

  if (customer.isPending) return <PageSkeleton />;
  if (customer.isError) {
    return (
      <ErrorState
        error={customer.error}
        onRetry={() => void customer.refetch()}
      />
    );
  }

  const data = customer.data;
  const purchases = history.data ?? [];
  const spent = purchases.reduce(
    (total, order) => total + order.total - order.refundedTotal,
    0,
  );
  const underWarranty = purchases
    .flatMap((order) => order.lines)
    .filter((line) => line.underWarranty).length;

  return (
    <>
      <PageHeader
        title={data.fullName}
        subtitle={data.phone ?? data.email ?? undefined}
        breadcrumb={[
          { title: 'Clients', href: '/customers' },
          { title: data.fullName },
        ]}
        actions={
          <PermissionGate perm="customers:manage">
            <Button onClick={() => setFormOpen(true)}>Modifier</Button>
          </PermissionGate>
        }
      />

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 3 }}
          items={[
            { key: 'phone', label: 'Téléphone', children: data.phone ?? '—' },
            { key: 'email', label: 'Email', children: data.email ?? '—' },
            { key: 'city', label: 'Ville', children: data.city ?? '—' },
            {
              key: 'address',
              label: 'Adresse',
              children: data.address ?? '—',
              span: 2,
            },
            {
              key: 'since',
              label: 'Client depuis',
              children: formatDate(data.createdAt),
            },
            {
              key: 'spent',
              label: 'Total dépensé',
              children: <Money value={spent} strong />,
            },
            {
              key: 'warranty',
              label: 'Articles sous garantie',
              children:
                underWarranty > 0 ? (
                  <Tag color="success">{underWarranty}</Tag>
                ) : (
                  '—'
                ),
            },
            { key: 'notes', label: 'Notes', children: data.notes ?? '—' },
          ]}
        />
      </Card>

      <Card
        title={`Achats (${purchases.length})`}
        style={{ marginTop: 16 }}
        loading={history.isPending}
      >
        {history.isError ? (
          <ErrorState
            error={history.error}
            onRetry={() => void history.refetch()}
          />
        ) : purchases.length === 0 ? (
          <Empty description="Aucun achat enregistré pour ce client." />
        ) : (
          <Table<CustomerPurchase>
            rowKey="id"
            pagination={false}
            dataSource={purchases}
            expandable={{
              // La garantie se lit ligne par ligne : elle dépend du produit
              // acheté, pas de la commande.
              expandedRowRender: (order) => (
                <Table<CustomerPurchaseLine>
                  rowKey="sku"
                  size="small"
                  pagination={false}
                  dataSource={order.lines}
                  columns={[
                    { title: 'SKU', dataIndex: 'sku', width: 200 },
                    { title: 'Article', dataIndex: 'name' },
                    {
                      title: 'Qté',
                      dataIndex: 'quantity',
                      align: 'right',
                      width: 70,
                    },
                    {
                      title: 'Retourné',
                      dataIndex: 'returnedQty',
                      align: 'right',
                      width: 100,
                      render: (value: number) =>
                        value > 0 ? <Tag color="orange">{value}</Tag> : '—',
                    },
                    {
                      title: 'Total',
                      dataIndex: 'lineTotal',
                      align: 'right',
                      width: 130,
                      render: (value: number) => <Money value={value} />,
                    },
                    {
                      title: 'Garantie',
                      key: 'warranty',
                      width: 200,
                      render: (_, line) =>
                        line.warrantyUntil === null ? (
                          <span style={{ color: '#8a98a8' }}>
                            sans garantie
                          </span>
                        ) : line.underWarranty ? (
                          <Tag color="success">
                            jusqu’au {formatDate(line.warrantyUntil)}
                          </Tag>
                        ) : (
                          <Tag>expirée le {formatDate(line.warrantyUntil)}</Tag>
                        ),
                    },
                  ]}
                />
              ),
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
              { title: 'Site', dataIndex: ['site', 'code'], width: 80 },
              {
                title: 'Canal',
                dataIndex: 'channel',
                width: 100,
                render: (value: string) => (
                  <Tag>{value === 'POS' ? 'boutique' : 'web'}</Tag>
                ),
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
        )}
      </Card>

      {formOpen && (
        <CustomerForm
          customer={data}
          open
          pending={update.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(payload) =>
            update.mutate(
              { id: data.id, payload },
              { onSuccess: () => setFormOpen(false) },
            )
          }
        />
      )}
    </>
  );
}

export default CustomerDetailPage;
