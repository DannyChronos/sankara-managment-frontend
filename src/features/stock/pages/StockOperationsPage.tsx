import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Flex, Select, Table, Tag } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import { useStockOperations } from '../hooks';
import { OperationStatusTag } from '../components/OperationStatusTag';
import { OPERATION_TYPE } from '../labels';
import type { StockOperation } from '../../../shared/api/types';

export function StockOperationsPage() {
  const { siteId, currentSite } = useAuth();
  const [status, setStatus] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const operations = useStockOperations({
    page,
    limit: 20,
    ...(siteId ? { siteId } : {}),
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
  });

  if (operations.isPending) return <PageSkeleton />;
  if (operations.isError) {
    return (
      <ErrorState
        error={operations.error}
        onRetry={() => void operations.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Bons d’entrée et de sortie"
        subtitle={currentSite?.name}
        actions={
          <PermissionGate perm="stock:entry">
            <Link to="/stock/operations/new">
              <Button type="primary">Nouveau bon</Button>
            </Link>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Tous les statuts"
            style={{ minWidth: 180 }}
            value={status}
            onChange={(value?: string) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: 'DRAFT', label: 'Brouillon' },
              { value: 'VALIDATED', label: 'Validé' },
              { value: 'CANCELLED', label: 'Annulé' },
            ]}
          />
          <Select
            allowClear
            placeholder="Tous les types"
            style={{ minWidth: 230 }}
            value={type}
            onChange={(value?: string) => {
              setType(value);
              setPage(1);
            }}
            options={Object.entries(OPERATION_TYPE).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Flex>

        <Table<StockOperation>
          rowKey="id"
          dataSource={operations.data.data}
          loading={operations.isFetching}
          pagination={{
            current: operations.data.meta.page,
            pageSize: operations.data.meta.limit,
            total: operations.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
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
              render: (value: string, row) => (
                <>
                  {OPERATION_TYPE[value] ?? value}{' '}
                  <Tag color={row.direction === 'IN' ? 'green' : 'orange'}>
                    {row.direction === 'IN' ? 'entrée' : 'sortie'}
                  </Tag>
                </>
              ),
            },
            { title: 'Site', dataIndex: ['site', 'code'], width: 80 },
            {
              title: 'Fournisseur',
              dataIndex: ['supplier', 'name'],
              render: (value: string | undefined) => value ?? '—',
            },
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
    </>
  );
}

export default StockOperationsPage;
