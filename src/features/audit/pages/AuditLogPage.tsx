import { useState } from 'react';
import {
  Card,
  DatePicker,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { formatDateTime } from '../../../shared/utils/format';
import { useAuditLogs } from '../hooks';
import { AuditDiff } from '../components/AuditDiff';
import type { AuditLogEntry } from '../../../shared/api/types';

/** Les entités réellement journalisées aujourd'hui. */
const ENTITIES = [
  'User',
  'Role',
  'Site',
  'ProductVariant',
  'Order',
  'CashSession',
  'Inventory',
  'StockOperation',
  'Setting',
];

const ACTION_LABEL: Record<string, string> = {
  'price.updated': 'Prix modifié',
  'user.updated': 'Utilisateur modifié',
  'user.status-changed': 'Statut de compte changé',
  'role.permissions-changed': 'Permissions de rôle modifiées',
  'settings.updated': 'Paramètres modifiés',
  'site.status-changed': 'Site activé ou désactivé',
  'sale.cancelled': 'Vente annulée',
  'cash-session.verified': 'Caisse vérifiée',
  'cash-session.regularized': 'Caisse régularisée',
  'inventory.validated': 'Inventaire validé',
  'stock-operation.validated': 'Bon de stock validé',
};

const ACTOR_COLOR: Record<string, string> = {
  USER: 'blue',
  SYSTEM: 'default',
  INTEGRATION: 'purple',
};

export function AuditLogPage() {
  const [entity, setEntity] = useState<string | undefined>();
  const [action, setAction] = useState('');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);

  const logs = useAuditLogs({
    page,
    limit: 20,
    ...(entity ? { entity } : {}),
    ...(action.trim() ? { action: action.trim() } : {}),
    ...(range?.[0] ? { from: range[0].format('YYYY-MM-DD') } : {}),
    ...(range?.[1] ? { to: range[1].format('YYYY-MM-DD') } : {}),
  });

  if (logs.isPending) return <PageSkeleton />;
  if (logs.isError)
    return (
      <ErrorState error={logs.error} onRetry={() => void logs.refetch()} />
    );

  return (
    <>
      <PageHeader
        title="Journal d’audit"
        subtitle={`${logs.data.meta.total} opération(s) enregistrée(s)`}
      />

      <Card>
        <Typography.Paragraph type="secondary">
          Toute opération sensible y est inscrite : qui, quand, quoi, l’état
          avant et après, et l’adresse IP. Le journal est en insertion seule —
          il ne se modifie ni ne s’efface.
        </Typography.Paragraph>

        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Toutes les entités"
            style={{ minWidth: 200 }}
            value={entity}
            onChange={(value?: string) => {
              setEntity(value);
              setPage(1);
            }}
            options={ENTITIES.map((name) => ({ value: name, label: name }))}
          />
          <Input
            allowClear
            placeholder="Action (ex. price.updated)"
            style={{ maxWidth: 260 }}
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
          />
          <DatePicker.RangePicker
            value={range}
            onChange={(values) => {
              setRange(values);
              setPage(1);
            }}
            format="DD/MM/YYYY"
          />
        </Flex>

        <Table<AuditLogEntry>
          rowKey="id"
          dataSource={logs.data.data}
          loading={logs.isFetching}
          expandable={{
            expandedRowRender: (row) => (
              <AuditDiff before={row.before} after={row.after} />
            ),
          }}
          pagination={{
            current: logs.data.meta.page,
            pageSize: logs.data.meta.limit,
            total: logs.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Quand',
              dataIndex: 'createdAt',
              width: 160,
              render: (value: string) => formatDateTime(value),
            },
            {
              title: 'Opération',
              dataIndex: 'action',
              render: (value: string) => (
                <>
                  <div>{ACTION_LABEL[value] ?? value}</div>
                  <small style={{ color: '#8a98a8' }}>{value}</small>
                </>
              ),
            },
            { title: 'Entité', dataIndex: 'entity', width: 150 },
            {
              title: 'Auteur',
              dataIndex: 'actorName',
              width: 200,
              render: (name: string | null, row) => (
                <>
                  {name ?? <span style={{ color: '#8a98a8' }}>système</span>}
                  <Tag
                    color={ACTOR_COLOR[row.actorType]}
                    style={{ marginLeft: 6 }}
                  >
                    {row.actorType}
                  </Tag>
                </>
              ),
            },
            {
              title: 'Adresse IP',
              dataIndex: 'ip',
              width: 160,
              render: (value: string | null) => value ?? '—',
            },
          ]}
        />
      </Card>
    </>
  );
}

export default AuditLogPage;
