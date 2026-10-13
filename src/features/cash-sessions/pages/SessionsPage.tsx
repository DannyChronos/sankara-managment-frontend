import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Flex, Select, Table } from 'antd';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { usePermission } from '../../../shared/auth/usePermission';
import { cashSessionStatusLabel } from '../../../shared/constants/labels';
import { formatDateTime } from '../../../shared/utils/format';
import { useUsers } from '../../users/hooks';
import { useSessions } from '../hooks';
import { SessionStatusTag } from '../components/SessionStatusTag';
import { GapCell } from '../components/GapCell';
import type { CashSession } from '../../../shared/api/types';

const STATUS_OPTIONS = Object.entries(cashSessionStatusLabel).map(
  ([value, label]) => ({ value, label }),
);

export function SessionsPage() {
  const { user, siteId } = useAuth();
  const { can } = usePermission();
  const seesAll = can('cash-sessions:read-all');
  const [status, setStatus] = useState<string | undefined>();
  const [site, setSite] = useState<string | undefined>(siteId ?? undefined);
  const [cashierId, setCashierId] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  // La liste des caissiers demande `users:read` : le filtre n'apparaît
  // qu'à qui peut la charger.
  const canFilterByCashier = seesAll && can('users:read');
  const cashiers = useUsers(
    { roleCode: 'CASHIER', limit: 100 },
    canFilterByCashier,
  );

  const sessions = useSessions({
    page,
    limit: 20,
    ...(status ? { status } : {}),
    ...(site ? { siteId: site } : {}),
    ...(canFilterByCashier && cashierId ? { cashierId } : {}),
  });

  if (sessions.isPending) return <PageSkeleton />;
  if (sessions.isError) {
    return (
      <ErrorState
        error={sessions.error}
        onRetry={() => void sessions.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={seesAll ? 'Sessions de caisse' : 'Mes sessions de caisse'}
        subtitle={`${sessions.data.meta.total} session(s)`}
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Tous les statuts"
            style={{ minWidth: 220 }}
            value={status}
            onChange={(value?: string) => {
              setStatus(value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          <Select
            allowClear
            placeholder="Tous mes sites"
            style={{ minWidth: 240 }}
            value={site}
            onChange={(value?: string) => {
              setSite(value);
              setPage(1);
            }}
            options={(user?.sites ?? []).map((entry) => ({
              value: entry.id,
              label: `${entry.name} (${entry.code})`,
            }))}
          />
          {canFilterByCashier && (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Tous les caissiers"
              style={{ minWidth: 220 }}
              loading={cashiers.isPending}
              value={cashierId}
              onChange={(value?: string) => {
                setCashierId(value);
                setPage(1);
              }}
              options={(cashiers.data?.data ?? []).map((cashier) => ({
                value: cashier.id,
                label: cashier.fullName,
              }))}
            />
          )}
        </Flex>

        <Table<CashSession>
          rowKey="id"
          dataSource={sessions.data.data}
          loading={sessions.isFetching}
          pagination={{
            current: sessions.data.meta.page,
            pageSize: sessions.data.meta.limit,
            total: sessions.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Session',
              dataIndex: 'number',
              width: 200,
              render: (value: string, row) => (
                <Link to={`/cash-sessions/${row.id}`}>{value}</Link>
              ),
            },
            { title: 'Site', dataIndex: ['site', 'code'], width: 80 },
            ...(seesAll
              ? [
                  {
                    title: 'Caissier',
                    dataIndex: ['cashier', 'fullName'],
                  },
                ]
              : []),
            {
              title: 'Ouverte le',
              dataIndex: 'openedAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
            {
              title: 'Clôturée le',
              dataIndex: 'closedAt',
              width: 150,
              render: (value: string | null) =>
                value ? formatDateTime(value) : '—',
            },
            {
              title: 'Attendu',
              dataIndex: 'expectedTotal',
              align: 'right',
              width: 140,
              render: (value: number) => <Money value={value} />,
            },
            {
              title: 'Reçu',
              dataIndex: 'receivedTotal',
              align: 'right',
              width: 140,
              render: (value: number | null) =>
                value === null ? '—' : <Money value={value} />,
            },
            {
              title: 'Écart',
              dataIndex: 'gapTotal',
              align: 'right',
              width: 130,
              render: (value: number | null) => <GapCell value={value} />,
            },
            {
              title: 'Statut',
              key: 'status',
              width: 210,
              render: (_, row) => (
                <SessionStatusTag
                  status={row.status}
                  forceClosed={row.forceClosed}
                />
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

export default SessionsPage;
