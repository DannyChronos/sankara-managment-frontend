import { Empty, Table, Tag } from 'antd';

type Snapshot = Record<string, unknown> | null;

/** Champs sans intérêt pour un lecteur humain, ou trop verbeux. */
const IGNORED = new Set(['updatedAt', 'createdAt', 'passwordHash', 'version']);

function asRecord(value: unknown): Snapshot {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function display(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value) ?? '—';
}

/**
 * Montre ce qui a changé, pas l'objet entier : un journal lisible est un
 * journal qu'on relit.
 */
export function AuditDiff({
  before,
  after,
}: {
  before: unknown;
  after: unknown;
}) {
  const previous = asRecord(before);
  const next = asRecord(after);

  if (!previous && !next) {
    return (
      <Empty description="Aucun détail" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    );
  }

  const keys = [
    ...new Set([...Object.keys(previous ?? {}), ...Object.keys(next ?? {})]),
  ].filter((key) => !IGNORED.has(key));

  const rows = keys
    .map((key) => ({
      key,
      before: display(previous?.[key]),
      after: display(next?.[key]),
    }))
    .filter((row) => row.before !== row.after);

  if (rows.length === 0) {
    return (
      <Empty
        description="Aucun champ modifié (opération sans changement d’état)"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      size="small"
      pagination={false}
      rowKey="key"
      dataSource={rows}
      columns={[
        { title: 'Champ', dataIndex: 'key', width: 220 },
        {
          title: 'Avant',
          dataIndex: 'before',
          render: (value: string) => (
            <span style={{ color: '#8a98a8' }}>{value}</span>
          ),
        },
        {
          title: 'Après',
          dataIndex: 'after',
          render: (value: string) => <Tag color="blue">{value}</Tag>,
        },
      ]}
    />
  );
}
