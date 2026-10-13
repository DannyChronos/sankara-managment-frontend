import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Descriptions, Table, Tag } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import { OperationStatusTag } from '../../stock/components/OperationStatusTag';
import { OPERATION_TYPE } from '../../stock/labels';
import { useSupplier, useSupplierReceipts, useUpdateSupplier } from '../hooks';
import { SupplierForm } from '../components/SupplierForm';
import type { StockOperation } from '../../../shared/api/types';

export function SupplierDetailPage() {
  const { id = '' } = useParams();
  const [formOpen, setFormOpen] = useState(false);

  const supplier = useSupplier(id);
  const receipts = useSupplierReceipts(id);
  const update = useUpdateSupplier();

  if (supplier.isPending) return <PageSkeleton />;
  if (supplier.isError) {
    return (
      <ErrorState
        error={supplier.error}
        onRetry={() => void supplier.refetch()}
      />
    );
  }

  const data = supplier.data;
  const rows = receipts.data?.data ?? [];
  const received = rows
    .filter((row) => row.status === 'VALIDATED')
    .reduce((total, row) => total + row.totalQuantity, 0);

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={data.phone ?? data.email ?? undefined}
        breadcrumb={[
          { title: 'Stock' },
          { title: 'Fournisseurs', href: '/suppliers' },
          { title: data.name },
        ]}
        actions={
          <>
            {!data.isActive && <Tag>inactif</Tag>}
            <PermissionGate perm="stock:entry">
              <Button onClick={() => setFormOpen(true)}>Modifier</Button>
            </PermissionGate>
          </>
        }
      />

      {!data.isActive && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Ce fournisseur est inactif"
          description="Il n’apparaît plus dans les bons de réception. Ses réceptions passées restent consultables ici."
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            { key: 'phone', label: 'Téléphone', children: data.phone ?? '—' },
            { key: 'email', label: 'Email', children: data.email ?? '—' },
            {
              key: 'address',
              label: 'Adresse',
              children: data.address ?? '—',
            },
            {
              key: 'since',
              label: 'Référencé depuis',
              children: formatDate(data.createdAt),
            },
            {
              key: 'count',
              label: 'Bons de réception',
              children: data.operationCount,
            },
            {
              key: 'received',
              label: 'Articles reçus',
              children: receipts.isPending ? '…' : received,
            },
          ]}
        />
      </Card>

      <Card title="Réceptions">
        <Table<StockOperation>
          rowKey="id"
          dataSource={rows}
          loading={receipts.isPending}
          pagination={false}
          locale={{ emptyText: 'Aucune réception enregistrée.' }}
          columns={[
            {
              title: 'Numéro',
              dataIndex: 'number',
              width: 190,
              render: (value: string, row) => (
                <Link to={`/stock/operations/${row.id}`}>{value}</Link>
              ),
            },
            {
              title: 'Type',
              dataIndex: 'type',
              width: 210,
              render: (value: string) => OPERATION_TYPE[value] ?? value,
            },
            { title: 'Site', dataIndex: ['site', 'code'], width: 80 },
            {
              title: 'Articles',
              dataIndex: 'totalQuantity',
              align: 'right',
              width: 100,
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              width: 130,
              render: (value: string) => <OperationStatusTag status={value} />,
            },
            {
              title: 'Créé le',
              dataIndex: 'createdAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
          ]}
        />
      </Card>

      {formOpen && (
        <SupplierForm
          supplier={data}
          open
          pending={update.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(payload) =>
            update.mutate(
              { id, payload },
              { onSuccess: () => setFormOpen(false) },
            )
          }
        />
      )}
    </>
  );
}

export default SupplierDetailPage;
