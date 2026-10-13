import { Link } from 'react-router-dom';
import { Button, Card, Table } from 'antd';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { formatDateTime } from '../../../shared/utils/format';
import { useSessionsToVerify } from '../hooks';
import { SessionStatusTag } from '../components/SessionStatusTag';
import type { CashSession } from '../../../shared/api/types';

export function SessionsToVerifyPage() {
  const { data, isPending, isError, error, refetch } = useSessionsToVerify();

  if (isPending) return <PageSkeleton />;
  if (isError)
    return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <>
      <PageHeader
        title="Sessions à vérifier"
        subtitle={`${data.meta.total} caisse(s) en attente`}
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table<CashSession>
          rowKey="id"
          dataSource={data.data}
          pagination={false}
          locale={{ emptyText: 'Aucune caisse en attente de vérification.' }}
          columns={[
            { title: 'Session', dataIndex: 'number', width: 190 },
            {
              title: 'Site',
              dataIndex: ['site', 'code'],
              width: 90,
            },
            { title: 'Caissier', dataIndex: ['cashier', 'fullName'] },
            {
              title: 'Clôturée le',
              dataIndex: 'closedAt',
              width: 160,
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
              title: 'Déclaré',
              dataIndex: 'declaredTotal',
              align: 'right',
              width: 140,
              render: (value: number | null) =>
                value === null ? '—' : <Money value={value} />,
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              width: 200,
              render: (_, row) => (
                <SessionStatusTag
                  status={row.status}
                  forceClosed={row.forceClosed}
                />
              ),
            },
            {
              title: '',
              key: 'action',
              width: 120,
              render: (_, row) => (
                <Link to={`/cash-sessions/${row.id}/verify`}>
                  <Button type="primary" size="small">
                    Vérifier
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

export default SessionsToVerifyPage;
