import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Flex, Radio, Select, Table, Tag } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import { useTransfers } from '../hooks';
import { TRANSFER_STATUS_OPTIONS } from '../labels';
import { TransferStatusTag } from '../components/TransferStatusTag';
import type { Transfer } from '../../../shared/api/types';

type Direction = 'all' | 'out' | 'in';

/**
 * Un transfert concerne deux sites. Le filtre « sens » répond à la seule
 * question qui compte au quotidien : qu'est-ce que j'envoie, qu'est-ce que
 * j'attends ?
 */
export function TransfersPage() {
  const { siteId, currentSite } = useAuth();
  const [direction, setDirection] = useState<Direction>('all');
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const transfers = useTransfers({
    page,
    limit: 20,
    ...(status ? { status } : {}),
    ...(siteId && direction === 'out' ? { fromSiteId: siteId } : {}),
    ...(siteId && direction === 'in' ? { toSiteId: siteId } : {}),
  });

  if (transfers.isPending) return <PageSkeleton />;
  if (transfers.isError) {
    return (
      <ErrorState
        error={transfers.error}
        onRetry={() => void transfers.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Transferts entre sites"
        subtitle={currentSite?.name}
        actions={
          <PermissionGate perm="transfers:ship">
            <Link to="/transfers/new">
              <Button type="primary">Nouveau transfert</Button>
            </Link>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Radio.Group
            value={direction}
            onChange={(event) => {
              setDirection(event.target.value as Direction);
              setPage(1);
            }}
            optionType="button"
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'out', label: 'Que j’envoie' },
              { value: 'in', label: 'Que j’attends' },
            ]}
          />
          <Select
            allowClear
            placeholder="Tous les statuts"
            style={{ minWidth: 200 }}
            value={status}
            onChange={(value?: string) => {
              setStatus(value);
              setPage(1);
            }}
            options={TRANSFER_STATUS_OPTIONS}
          />
        </Flex>

        <Table<Transfer>
          rowKey="id"
          dataSource={transfers.data.data}
          loading={transfers.isFetching}
          pagination={{
            current: transfers.data.meta.page,
            pageSize: transfers.data.meta.limit,
            total: transfers.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Numéro',
              dataIndex: 'number',
              width: 170,
              render: (value: string, row) => (
                <Link to={`/transfers/${row.id}`}>{value}</Link>
              ),
            },
            {
              title: 'Trajet',
              key: 'route',
              render: (_, row) => (
                <>
                  {row.fromSite.code} → {row.toSite.code}
                  {siteId === row.toSite.id && row.status === 'SHIPPED' && (
                    <Tag color="processing" style={{ marginLeft: 8 }}>
                      à réceptionner
                    </Tag>
                  )}
                </>
              ),
            },
            {
              title: 'Expédié',
              dataIndex: 'totalSent',
              align: 'right',
              width: 100,
            },
            {
              title: 'Reçu',
              key: 'received',
              align: 'right',
              width: 110,
              render: (_, row) =>
                row.receivedAt === null ? (
                  '—'
                ) : row.totalReceived === row.totalSent ? (
                  row.totalReceived
                ) : (
                  <Tag color="warning">
                    {row.totalReceived} ({row.totalReceived - row.totalSent})
                  </Tag>
                ),
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              width: 160,
              render: (value: Transfer['status']) => (
                <TransferStatusTag status={value} />
              ),
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

export default TransfersPage;
