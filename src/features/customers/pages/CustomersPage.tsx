import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Flex, Input, Table } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { formatDate } from '../../../shared/utils/format';
import { useCreateCustomer, useCustomers } from '../hooks';
import { CustomerForm } from '../components/CustomerForm';
import type { Customer } from '../../../shared/api/types';

export function CustomersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const create = useCreateCustomer();
  const customers = useCustomers({
    page,
    limit: 20,
    ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
  });

  if (customers.isPending) return <PageSkeleton />;
  if (customers.isError) {
    return (
      <ErrorState
        error={customers.error}
        onRetry={() => void customers.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${customers.data.meta.total} fiche(s)`}
        actions={
          <PermissionGate perm="customers:manage">
            <Button type="primary" onClick={() => setFormOpen(true)}>
              Nouveau client
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            // Le téléphone est ce qu'on a sous la main quand un client
            // rappelle : la recherche serveur couvre aussi nom et email.
            placeholder="Téléphone, nom ou email"
            style={{ maxWidth: 340 }}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </Flex>

        <Table<Customer>
          rowKey="id"
          dataSource={customers.data.data}
          loading={customers.isFetching}
          pagination={{
            current: customers.data.meta.page,
            pageSize: customers.data.meta.limit,
            total: customers.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Nom',
              dataIndex: 'fullName',
              render: (value: string, row) => (
                <Link to={`/customers/${row.id}`}>{value}</Link>
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
              title: 'Ville',
              dataIndex: 'city',
              width: 140,
              render: (value: string | null) => value ?? '—',
            },
            {
              title: 'Achats',
              dataIndex: 'orderCount',
              align: 'right',
              width: 90,
            },
            {
              title: 'Client depuis',
              dataIndex: 'createdAt',
              width: 140,
              render: (value: string) => formatDate(value),
            },
          ]}
        />
      </Card>

      {formOpen && (
        <CustomerForm
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

export default CustomersPage;
