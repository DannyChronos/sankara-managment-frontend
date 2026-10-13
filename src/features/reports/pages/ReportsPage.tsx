import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Flex,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
  VariantPicker,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { usePermission } from '../../../shared/auth/usePermission';
import { formatDateTime } from '../../../shared/utils/format';
import { useUsers } from '../../users/hooks';
import { useExport, useReport } from '../hooks';
import { CASHIER_REPORTS, PERIODIC_REPORTS, REPORTS } from '../labels';
import { ReportTable } from '../components/ReportTable';
import type {
  ReportType,
  VariantSearchResult,
} from '../../../shared/api/types';

export function ReportsPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const [type, setType] = useState<ReportType>('sales');
  // Par défaut, le mois en cours — c'est aussi ce que le backend prend
  // quand aucune période n'est envoyée.
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [siteId, setSiteId] = useState<string | undefined>();
  const [cashierId, setCashierId] = useState<string | undefined>();
  const [variant, setVariant] = useState<VariantSearchResult | null>(null);

  const periodic = PERIODIC_REPORTS.includes(type);
  const byCashier = CASHIER_REPORTS.includes(type);
  // La liste des caissiers demande `users:read`, que le comptable n'a pas :
  // le filtre n'apparaît que pour qui peut la charger.
  const canFilterByCashier = byCashier && can('users:read');

  const cashiers = useUsers(
    { roleCode: 'CASHIER', limit: 100 },
    canFilterByCashier,
  );

  const filters = useMemo(
    () => ({
      ...(periodic && range
        ? {
            from: range[0].format('YYYY-MM-DD'),
            to: range[1].format('YYYY-MM-DD'),
          }
        : {}),
      ...(siteId ? { siteId } : {}),
      ...(canFilterByCashier && cashierId ? { cashierId } : {}),
      ...(type === 'movements' && variant ? { variantId: variant.id } : {}),
    }),
    [periodic, range, siteId, canFilterByCashier, cashierId, type, variant],
  );

  const report = useReport(type, filters);
  const exporter = useExport(type);
  const current = REPORTS.find((entry) => entry.type === type);

  return (
    <>
      <PageHeader
        title="Rapports"
        subtitle={current?.hint}
        actions={
          <PermissionGate perm="reports:export">
            <Space.Compact>
              <Button
                icon={<FileExcelOutlined />}
                loading={exporter.runningFormat === 'xlsx'}
                disabled={exporter.pending}
                onClick={() => exporter.run('xlsx', filters)}
              >
                Excel
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                loading={exporter.runningFormat === 'pdf'}
                disabled={exporter.pending}
                onClick={() => exporter.run('pdf', filters)}
              >
                PDF
              </Button>
            </Space.Compact>
          </PermissionGate>
        }
      />

      <Tabs
        activeKey={type}
        onChange={(key) => {
          setType(key as ReportType);
          setVariant(null);
        }}
        items={REPORTS.map((entry) => ({
          key: entry.type,
          label: entry.label,
        }))}
      />

      <Card>
        <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
          {periodic ? (
            <DatePicker.RangePicker
              value={range}
              onChange={(value) => setRange(value as [Dayjs, Dayjs] | null)}
              allowClear={false}
            />
          ) : (
            <Tag color="processing">état à l’instant présent</Tag>
          )}

          <Select
            allowClear
            placeholder="Tous mes sites"
            style={{ minWidth: 240 }}
            value={siteId}
            onChange={setSiteId}
            options={(user?.sites ?? []).map((site) => ({
              value: site.id,
              label: `${site.name} (${site.code})`,
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
              onChange={setCashierId}
              options={(cashiers.data?.data ?? []).map((cashier) => ({
                value: cashier.id,
                label: cashier.fullName,
              }))}
            />
          )}

          {type === 'movements' &&
            (variant ? (
              <Tag closable onClose={() => setVariant(null)} color="geekblue">
                {variant.sku}
              </Tag>
            ) : (
              <div style={{ minWidth: 280, flex: 1 }}>
                <VariantPicker
                  placeholder="Limiter à un article (facultatif)"
                  onPick={setVariant}
                />
              </div>
            ))}
        </Flex>

        {report.isPending ? (
          <PageSkeleton />
        ) : report.isError ? (
          <ErrorState
            error={report.error}
            onRetry={() => void report.refetch()}
          />
        ) : (
          <>
            <Flex
              justify="space-between"
              wrap
              gap={12}
              style={{ marginBottom: 12 }}
            >
              <Typography.Title level={5} style={{ margin: 0 }}>
                {report.data.title}
              </Typography.Title>
              <Typography.Text type="secondary">
                {report.data.rows.length} ligne(s) · arrêté au{' '}
                {formatDateTime(report.data.generatedAt)}
              </Typography.Text>
            </Flex>
            <ReportTable report={report.data} />
          </>
        )}
      </Card>
    </>
  );
}

export default ReportsPage;
