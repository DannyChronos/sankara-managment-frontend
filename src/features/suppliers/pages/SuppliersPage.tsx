import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Flex, Input, Segmented, Table, Tag } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useCreateSupplier, useSuppliers } from '../hooks';
import { SupplierForm } from '../components/SupplierForm';
import type { Supplier } from '../../../shared/api/types';

type Filter = 'actifs' | 'inactifs' | 'tous';

const FILTER_PARAM: Record<Filter, Record<string, unknown>> = {
  actifs: { isActive: true },
  inactifs: { isActive: false },
  tous: {},
};

export function SuppliersPage() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('actifs');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const create = useCreateSupplier();
  const suppliers = useSuppliers({
    page,
    limit: 20,
    ...FILTER_PARAM[filter],
    ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
  });

  if (suppliers.isPending) return <PageSkeleton />;
  if (suppliers.isError) {
    return (
      <ErrorState
        error={suppliers.error}
        onRetry={() => void suppliers.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Fournisseurs"
        subtitle={`${suppliers.data.meta.total} fiche(s)`}
        actions={
          <PermissionGate perm="stock:entry">
            <Button type="primary" onClick={() => setFormOpen(true)}>
              Nouveau fournisseur
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Nom, téléphone ou email"
            style={{ maxWidth: 340 }}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
          <Segmented<Filter>
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
            options={[
              { value: 'actifs', label: 'Actifs' },
              { value: 'inactifs', label: 'Inactifs' },
              { value: 'tous', label: 'Tous' },
            ]}
          />
        </Flex>

        <Table<Supplier>
          rowKey="id"
          dataSource={suppliers.data.data}
          loading={suppliers.isFetching}
          pagination={{
            current: suppliers.data.meta.page,
            pageSize: suppliers.data.meta.limit,
            total: suppliers.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Raison sociale',
              dataIndex: 'name',
              render: (value: string, row) => (
                <Link to={`/suppliers/${row.id}`}>{value}</Link>
              ),
            },
            {
              title: 'Téléphone',
              dataIndex: 'phone',
              width: 180,
              render: (value: string | null) => value ?? '—',
            },
            {
              title: 'Email',
              dataIndex: 'email',
              render: (value: string | null) => value ?? '—',
            },
            {
              title: 'Réceptions',
              dataIndex: 'operationCount',
              align: 'right',
              width: 120,
            },
            {
              title: 'État',
              dataIndex: 'isActive',
              width: 110,
              render: (value: boolean) =>
                value ? <Tag color="green">actif</Tag> : <Tag>inactif</Tag>,
            },
          ]}
        />
      </Card>

      {formOpen && (
        <SupplierForm
          open
          pending={create.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(payload) =>
            create.mutate(payload, { onSuccess: () => setFormOpen(false) })
          }
        />
      )}
    </>
  );
}

export default SuppliersPage;
