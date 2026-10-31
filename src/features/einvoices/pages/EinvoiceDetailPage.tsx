import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Card,
  Collapse,
  Descriptions,
  Flex,
  Table,
  Typography,
} from 'antd';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { EinvoiceSecurityBlock } from '../../../shared/components/EinvoiceSecurityBlock';
import { NormalizedInvoiceStatusTag } from '../../../shared/components/EinvoiceStatusTag';
import { usePermission } from '../../../shared/auth/usePermission';
import { formatDateTime } from '../../../shared/utils/format';
import { invoiceKindLabel } from '../../../shared/constants/labels';
import { useEinvoice, useEinvoiceAttempts, useRetryEinvoice } from '../hooks';
import { AttemptsTimeline } from '../components/AttemptsTimeline';
import { RejectionAlert } from '../components/RejectionAlert';
import type { NormalizedInvoice } from '../../../shared/api/types';

/** Récapitulatif par groupe renvoyé par la DGI, affiché tel quel. */
function DgiTotals({ totals }: { totals: Record<string, unknown> }) {
  const rows = Object.entries(totals)
    .filter(
      ([, value]) => typeof value === 'number' || typeof value === 'string',
    )
    .map(([key, value]) => ({ key, value: String(value) }));

  if (rows.length === 0) return null;

  return (
    <Table
      size="small"
      rowKey="key"
      pagination={false}
      dataSource={rows}
      columns={[
        { title: 'Champ', dataIndex: 'key', width: 160 },
        { title: 'Valeur renvoyée par la DGI', dataIndex: 'value' },
      ]}
    />
  );
}

export function EinvoiceDetailPage() {
  const { id = '' } = useParams();
  const { can } = usePermission();

  const invoice = useEinvoice(id);
  // La chronologie demande `einvoice:retry` côté serveur : sans ce droit, on
  // ne la réclame pas plutôt que de récolter un 403.
  const attempts = useEinvoiceAttempts(id, can('einvoice:retry'));
  const retry = useRetryEinvoice();

  if (invoice.isPending) return <PageSkeleton />;
  if (invoice.isError) {
    return (
      <ErrorState
        error={invoice.error}
        onRetry={() => void invoice.refetch()}
      />
    );
  }

  const data = invoice.data;
  const mismatch =
    data.dgiTotal !== null && data.dgiTotal !== data.expectedTotal;

  return (
    <>
      <PageHeader
        title={`${invoiceKindLabel[data.kind]} · ${data.order.number}`}
        subtitle={formatDateTime(data.createdAt)}
        breadcrumb={[
          { title: 'Factures normalisées', href: '/einvoices' },
          { title: data.order.number },
        ]}
      />

      {data.status === 'REJECTED' && (
        <div style={{ marginBottom: 16 }}>
          <RejectionAlert
            invoice={data}
            retrying={retry.isPending}
            onRetry={() => retry.mutate(data.id)}
          />
        </div>
      )}

      {data.status === 'EXPIRED' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Facture abandonnée : délai de confirmation dépassé"
          description="Une nouvelle facture a pris sa place avec le même contenu. Celle-ci reste au journal comme trace de la tentative."
        />
      )}

      {mismatch && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Écart entre le montant de la vente et celui calculé par la DGI"
          description={`Vente : ${data.expectedTotal} FCFA · DGI : ${data.dgiTotal} FCFA. La facture n’a pas été confirmée : contactez le support.`}
        />
      )}

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            {
              key: 'status',
              label: 'Statut',
              children: <NormalizedInvoiceStatusTag status={data.status} />,
            },
            {
              key: 'kind',
              label: 'Type',
              children: invoiceKindLabel[data.kind],
            },
            {
              key: 'env',
              label: 'Environnement',
              children: data.env === 'PROD' ? 'Production' : 'TEST',
            },
            {
              key: 'order',
              label: 'Vente',
              children: (
                <Link to={`/sales/${data.order.id}`}>{data.order.number}</Link>
              ),
            },
            {
              key: 'sellerIfu',
              label: 'IFU vendeur',
              children: data.sellerIfu,
            },
            {
              key: 'operator',
              label: 'Opérateur',
              children: `${data.operator.code} · ${data.operator.name}`,
            },
            {
              key: 'buyer',
              label: 'Acheteur',
              children: data.buyerName ?? 'Comptoir',
            },
            {
              key: 'buyerIfu',
              label: 'IFU acheteur',
              children: data.buyerIfu ?? '—',
            },
            {
              key: 'expectedTotal',
              label: 'Montant de la vente',
              children: <Money value={data.expectedTotal} strong />,
            },
            {
              key: 'dgiTotal',
              label: 'Montant calculé par la DGI',
              children:
                data.dgiTotal === null ? '—' : <Money value={data.dgiTotal} />,
            },
            {
              key: 'submittedAt',
              label: 'Soumise le',
              children: data.submittedAt
                ? formatDateTime(data.submittedAt)
                : '—',
            },
            {
              key: 'attemptCount',
              label: 'Tentatives',
              children: data.attemptCount,
            },
            ...(data.requestedAfterSale
              ? [
                  {
                    key: 'afterSale',
                    label: 'Émission',
                    children: 'Demandée après la vente, le jour même',
                  },
                ]
              : []),
            ...(data.nextAttemptAt
              ? [
                  {
                    key: 'nextAttemptAt',
                    label: 'Prochaine tentative',
                    children: formatDateTime(data.nextAttemptAt),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      {data.status === 'CONFIRMED' && (
        <Card title="Éléments de sécurité" style={{ marginTop: 16 }}>
          <EinvoiceSecurityBlock invoice={data} />
        </Card>
      )}

      {data.originalInvoice && (
        <Card title="Facture d’origine" style={{ marginTop: 16 }}>
          <Flex gap={24} wrap>
            <Link to={`/einvoices/${data.originalInvoice.id}`}>
              Voir la facture annulée par cet avoir
            </Link>
            {data.originalInvoice.mecefCode && (
              <Typography.Text type="secondary">
                Code MECeF : {data.originalInvoice.mecefCode}
              </Typography.Text>
            )}
            {data.orderReturn && (
              <Typography.Text type="secondary">
                Retour {data.orderReturn.number} ·{' '}
                <Money value={data.orderReturn.refundAmount} />
              </Typography.Text>
            )}
          </Flex>
        </Card>
      )}

      {data.creditNotes.length > 0 && (
        <Card
          title="Avoirs liés"
          style={{ marginTop: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table<NormalizedInvoice>
            rowKey="id"
            pagination={false}
            dataSource={data.creditNotes}
            columns={[
              {
                title: 'Émis le',
                dataIndex: 'createdAt',
                width: 160,
                render: (value: string) => formatDateTime(value),
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
                render: (value: NormalizedInvoice['status']) => (
                  <NormalizedInvoiceStatusTag status={value} />
                ),
              },
              {
                title: 'Code MECeF/DGI',
                dataIndex: 'mecefCode',
                render: (value: string | null) => value ?? '—',
              },
              {
                title: '',
                key: 'link',
                width: 90,
                render: (_, row) => (
                  <Link to={`/einvoices/${row.id}`}>Détail</Link>
                ),
              },
            ]}
          />
        </Card>
      )}

      {data.dgiTotals && (
        <Card
          title="Récapitulatif renvoyé par la DGI"
          style={{ marginTop: 16 }}
        >
          <DgiTotals totals={data.dgiTotals} />
        </Card>
      )}

      <PermissionGate perm="einvoice:retry">
        <Card title="Chronologie des appels à la DGI" style={{ marginTop: 16 }}>
          {attempts.isPending ? (
            <Typography.Text type="secondary">Chargement…</Typography.Text>
          ) : attempts.isError ? (
            <Typography.Text type="secondary">
              Chronologie indisponible.
            </Typography.Text>
          ) : (
            <AttemptsTimeline attempts={attempts.data} />
          )}

          <Collapse
            ghost
            size="small"
            style={{ marginTop: 12 }}
            items={[
              {
                key: 'payload',
                label: 'Corps envoyé à la DGI (figé à la création)',
                children: (
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 12,
                      maxHeight: 320,
                      overflow: 'auto',
                      background: '#f6f8fa',
                      padding: 8,
                      borderRadius: 4,
                    }}
                  >
                    {JSON.stringify(data.requestPayload, null, 2)}
                  </pre>
                ),
              },
            ]}
          />
        </Card>
      </PermissionGate>
    </>
  );
}

export default EinvoiceDetailPage;
