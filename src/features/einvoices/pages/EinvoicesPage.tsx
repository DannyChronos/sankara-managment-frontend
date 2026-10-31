import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  DatePicker,
  Flex,
  Input,
  Select,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { NormalizedInvoiceStatusTag } from '../../../shared/components/EinvoiceStatusTag';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import {
  invoiceKindLabel,
  normalizedInvoiceStatusLabel,
} from '../../../shared/constants/labels';
import { EmecefStatusCard } from '../../fiscal/components/EmecefStatusCard';
import { useExport } from '../../reports/hooks';
import { useEinvoices } from '../hooks';
import type {
  NormalizedInvoiceRow,
  NormalizedInvoiceStatus,
} from '../../../shared/api/types';

/** `ME6FAM9V4H453ANJ` → `ME6F-AM9V…`, copiable en entier. */
function shortCode(code: string): string {
  const compact = code.replace(/[\s-]/g, '');
  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}…`;
}

/**
 * Journal des factures normalisées (§8) : ce que la DGI a reçu, ce qu'elle a
 * répondu, et quand. C'est la pièce qu'on présente quand un client ou un
 * contrôleur conteste une facture.
 */
export function EinvoicesPage() {
  const { siteId } = useAuth();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [search, setSearch] = useState('');

  // Le statut peut venir d'un lien — « 3 rejetées » depuis l'état du service.
  const status = params.get('status') ?? undefined;
  const kind = params.get('kind') ?? undefined;

  const filters = {
    page,
    limit: 20,
    ...(siteId ? { siteId } : {}),
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(range
      ? {
          from: range[0].format('YYYY-MM-DD'),
          to: range[1].format('YYYY-MM-DD'),
        }
      : {}),
  };

  const invoices = useEinvoices(filters);
  const exporter = useExport('einvoices');

  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  if (invoices.isPending) return <PageSkeleton />;
  if (invoices.isError) {
    return (
      <ErrorState
        error={invoices.error}
        onRetry={() => void invoices.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Factures normalisées"
        subtitle="Journal des envois à la DGI"
        actions={
          <PermissionGate perm="reports:export">
            <Button
              loading={exporter.pending}
              onClick={() =>
                exporter.run('xlsx', {
                  ...(siteId ? { siteId } : {}),
                  ...(range
                    ? {
                        from: range[0].format('YYYY-MM-DD'),
                        to: range[1].format('YYYY-MM-DD'),
                      }
                    : {}),
                })
              }
            >
              Exporter (Excel)
            </Button>
          </PermissionGate>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <EmecefStatusCard compact />
      </div>

      <Card>
        <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
          <DatePicker.RangePicker
            value={range}
            onChange={(value) => {
              setRange(value as [Dayjs, Dayjs] | null);
              setPage(1);
            }}
            allowClear
          />
          <Select
            allowClear
            style={{ width: 210 }}
            placeholder="Statut"
            value={status}
            onChange={(value?: string) => setFilter('status', value)}
            options={(
              Object.keys(
                normalizedInvoiceStatusLabel,
              ) as NormalizedInvoiceStatus[]
            ).map((value) => ({
              value,
              label: normalizedInvoiceStatusLabel[value],
            }))}
          />
          <Select
            allowClear
            style={{ width: 150 }}
            placeholder="Type"
            value={kind}
            onChange={(value?: string) => setFilter('kind', value)}
            options={[
              { value: 'SALE', label: 'Facture' },
              { value: 'CREDIT_NOTE', label: 'Avoir' },
            ]}
          />
          <Input.Search
            allowClear
            style={{ width: 280 }}
            placeholder="Vente, code MECeF, IFU ou acheteur"
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
          <Typography.Text type="secondary">
            {invoices.data.meta.total} facture(s)
          </Typography.Text>
        </Flex>

        <Table<NormalizedInvoiceRow>
          rowKey="id"
          dataSource={invoices.data.data}
          loading={invoices.isFetching}
          pagination={{
            current: invoices.data.meta.page,
            pageSize: invoices.data.meta.limit,
            total: invoices.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Date',
              dataIndex: 'createdAt',
              width: 130,
              render: (value: string, row) => (
                <Tooltip
                  title={
                    row.dgiDateTime
                      ? `Date DGI : ${row.dgiDateTime}`
                      : 'Pas encore enregistrée par la DGI'
                  }
                >
                  {formatDate(value)}
                </Tooltip>
              ),
            },
            {
              title: 'Type',
              dataIndex: 'kind',
              width: 100,
              render: (value: NormalizedInvoiceRow['kind']) =>
                invoiceKindLabel[value],
            },
            {
              title: 'Vente',
              key: 'order',
              width: 180,
              render: (_, row) => (
                <Link to={`/sales/${row.order.id}`}>{row.order.number}</Link>
              ),
            },
            {
              title: 'Acheteur',
              key: 'buyer',
              render: (_, row) =>
                row.buyerName || row.buyerIfu ? (
                  <>
                    {row.buyerName ?? '—'}
                    {row.buyerIfu && (
                      <div style={{ fontSize: 12, color: '#8a98a8' }}>
                        IFU {row.buyerIfu}
                      </div>
                    )}
                  </>
                ) : (
                  'Comptoir'
                ),
            },
            {
              title: 'Montant',
              dataIndex: 'expectedTotal',
              align: 'right',
              width: 140,
              render: (value: number) => <Money value={value} />,
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              width: 190,
              render: (value: NormalizedInvoiceStatus, row) => (
                <NormalizedInvoiceStatusTag
                  status={value}
                  hint={row.rejectionReason ?? row.lastError}
                />
              ),
            },
            {
              title: 'Code MECeF/DGI',
              dataIndex: 'mecefCode',
              width: 160,
              render: (value: string | null) =>
                value ? (
                  <Typography.Text copyable={{ text: value }}>
                    {shortCode(value)}
                  </Typography.Text>
                ) : (
                  '—'
                ),
            },
            {
              title: 'Tentatives',
              dataIndex: 'attempts',
              align: 'right',
              width: 110,
              render: (value: number, row) => (
                <Tooltip
                  title={
                    row.lastError ??
                    (row.nextAttemptAt
                      ? `Prochaine tentative : ${formatDateTime(row.nextAttemptAt)}`
                      : undefined)
                  }
                >
                  <Link to={`/einvoices/${row.id}`}>{value}</Link>
                </Tooltip>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}

export default EinvoicesPage;
