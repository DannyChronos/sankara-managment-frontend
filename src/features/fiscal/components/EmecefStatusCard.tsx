import { Badge, Card, Descriptions, Flex, Skeleton, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import { invoiceModeLabel } from '../../../shared/constants/labels';
import { useEmecefStatus } from '../hooks';
import { severityOf, type Severity } from '../status-severity';

const badgeStatus: Record<
  Severity,
  'success' | 'warning' | 'error' | 'default'
> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  default: 'default',
};

/**
 * État du service e-MCF, relu toutes les 30 secondes (§4.5). En version
 * compacte, il coiffe le journal des factures.
 */
export function EmecefStatusCard({ compact }: { compact?: boolean }) {
  const status = useEmecefStatus();

  if (status.isPending) {
    return (
      <Card title="État du service e-MCF">
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }
  if (status.isError || !status.data) {
    return (
      <Card title="État du service e-MCF">
        <Typography.Text type="secondary">
          État indisponible pour le moment.
        </Typography.Text>
      </Card>
    );
  }

  const data = status.data;
  const { severity, label } = severityOf(data);

  if (compact) {
    return (
      <Card size="small">
        <Flex gap={24} wrap align="center">
          <Badge status={badgeStatus[severity]} text={label} />
          <Typography.Text type="secondary">
            Environnement : {data.env === 'PROD' ? 'Production' : 'TEST'}
          </Typography.Text>
          <Typography.Text type="secondary">
            File locale : {data.localPending} en cours · {data.localRetrying} en
            relance
          </Typography.Text>
          {data.dgiPendingCount !== null && (
            <Typography.Text type="secondary">
              En attente chez la DGI : {data.dgiPendingCount}
            </Typography.Text>
          )}
        </Flex>
      </Card>
    );
  }

  return (
    <Card
      title="État du service e-MCF"
      extra={<Badge status={badgeStatus[severity]} text={label} />}
    >
      <Descriptions
        size="small"
        column={1}
        items={[
          {
            key: 'env',
            label: 'Environnement',
            children: data.env === 'PROD' ? 'Production' : 'TEST',
          },
          {
            key: 'mode',
            label: 'Mode',
            children: data.invoiceMode
              ? invoiceModeLabel[data.invoiceMode]
              : '—',
          },
          {
            key: 'token',
            label: 'Jeton',
            children: data.tokenValidUntil
              ? `valide jusqu’au ${formatDate(data.tokenValidUntil)}`
              : data.tokenLast4
                ? 'enregistré, échéance inconnue'
                : 'absent',
          },
          { key: 'nim', label: 'NIM', children: data.nim ?? '—' },
          {
            key: 'dgiPending',
            label: 'En attente chez la DGI',
            children:
              data.dgiPendingCount === null ? '—' : data.dgiPendingCount,
          },
          {
            key: 'local',
            label: 'File locale',
            children: (
              <>
                {data.localPending} en cours · {data.localRetrying} en relance ·{' '}
                {data.rejected > 0 ? (
                  <Link to="/einvoices?status=REJECTED">
                    {data.rejected} rejetée(s)
                  </Link>
                ) : (
                  '0 rejetée'
                )}
              </>
            ),
          },
          {
            key: 'checkedAt',
            label: 'Actualisé',
            children: formatDateTime(data.checkedAt),
          },
        ]}
      />

      {data.error && (
        <Typography.Text type="danger" style={{ fontSize: 12 }}>
          {data.error}
        </Typography.Text>
      )}
    </Card>
  );
}
