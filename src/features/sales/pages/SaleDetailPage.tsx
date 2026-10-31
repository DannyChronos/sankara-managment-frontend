import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  EinvoiceStatusTag,
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
  PdfButton,
  PermissionGate,
} from '../../../shared/components';
import { usePermission } from '../../../shared/auth/usePermission';
import { paymentMethodLabel } from '../../../shared/constants/labels';
import { formatDateTime } from '../../../shared/utils/format';
import { cashSessionsApi } from '../../cash-sessions/api';
import { receiptPath } from '../api';
import {
  useCancelSale,
  useCreateReturn,
  useNormalizeLate,
  useSale,
  useSaleEinvoice,
} from '../hooks';
import { useRetryEinvoice } from '../../einvoices/hooks';
import { usePosFiscalContext } from '../../fiscal/hooks';
import { OrderStatusTag } from '../components/OrderStatusTag';
import { ReturnModal } from '../components/ReturnModal';
import { SaleEinvoiceCard } from '../components/SaleEinvoiceCard';
import { NormalizeLateModal } from '../components/NormalizeLateModal';
import { formatXof } from '../../../shared/utils/format';
import type { OrderLine, OrderPayment } from '../../../shared/api/types';

export function SaleDetailPage() {
  const { id = '' } = useParams();
  const { can } = usePermission();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);
  const [normalizeOpen, setNormalizeOpen] = useState(false);

  const sale = useSale(id);
  const cancel = useCancelSale();
  const createReturn = useCreateReturn();
  const normalizeLate = useNormalizeLate();
  const retry = useRetryEinvoice();

  const fiscal = usePosFiscalContext();
  // Le bloc facture s'affiche dès qu'une facture existe, même si la
  // facturation a été désactivée depuis : une vente ancienne garde la sienne.
  const einvoice = useSaleEinvoice(id, false);

  const sessionId = sale.data?.cashSessionId ?? null;
  // RG-14 : une vente ne s'annule que tant que sa session est ouverte. On lit
  // donc la session pour ne pas proposer une action qui sera refusée.
  const session = useQuery({
    queryKey: ['cash-sessions', 'detail', sessionId],
    queryFn: () => cashSessionsApi.get(sessionId as string),
    enabled: Boolean(sessionId) && can('cash-sessions:open'),
  });

  if (sale.isPending) return <PageSkeleton />;
  if (sale.isError) {
    return (
      <ErrorState error={sale.error} onRetry={() => void sale.refetch()} />
    );
  }

  const data = sale.data;
  const cancelled = data.status === 'CANCELLED';
  // Sans droit de lecture sur les sessions, on laisse le bouton : le backend
  // tranchera. Mieux vaut un refus clair qu'une action invisible.
  const sessionOpen = session.data
    ? session.data.status === 'OPEN'
    : !can('cash-sessions:open');
  const returnable = data.lines.some(
    (line) => line.quantity - line.returnedQty > 0,
  );

  const einvoiceStatus = einvoice.data?.status ?? data.einvoiceStatus;
  // Annuler ou retourner pendant qu'une facture est en vol produirait un
  // avoir qui référencerait un code MECeF encore inexistant : le serveur le
  // refuse (EINVOICE_PENDING), autant le dire avant le clic.
  const invoiceInFlight = einvoiceStatus === 'PENDING';
  const showEinvoice =
    einvoiceStatus !== 'NOT_REQUESTED' ||
    (fiscal.data?.invoiceMode ?? 'DISABLED') !== 'DISABLED';
  const sameDay =
    new Date(data.createdAt).toDateString() === new Date().toDateString();
  // Ce que l'avoir portera : le total encore encaissé sur la vente.
  const creditNoteAmount = data.total - data.refundedTotal;
  const creditNoteWarning =
    einvoiceStatus === 'CONFIRMED'
      ? `Une facture d’avoir normalisée de ${formatXof(creditNoteAmount)} sera émise.`
      : undefined;

  /** Le bouton existe mais l'action est impossible : dire pourquoi. */
  const guarded = (node: ReactNode) =>
    invoiceInFlight ? (
      <Tooltip title="Facture en cours de traitement, réessayez dans quelques minutes.">
        <span>{node}</span>
      </Tooltip>
    ) : (
      node
    );

  return (
    <>
      <PageHeader
        title={data.number}
        subtitle={`${data.site.name} · ${formatDateTime(data.createdAt)}`}
        breadcrumb={[
          { title: 'Ventes', href: '/sales' },
          { title: data.number },
        ]}
        actions={
          <>
            <PdfButton
              path={receiptPath(data.id)}
              fileName={`${data.number}.pdf`}
              print
            >
              Réimprimer le ticket
            </PdfButton>
            {einvoiceStatus === 'CONFIRMED' && (
              <PdfButton
                path={`${receiptPath(data.id)}?format=a4`}
                fileName={`${data.number}-A4.pdf`}
              >
                Facture A4
              </PdfButton>
            )}
            {!cancelled && returnable && (
              <PermissionGate perm="sales:return">
                {guarded(
                  <Button
                    disabled={invoiceInFlight}
                    onClick={() => setReturnOpen(true)}
                  >
                    Retour
                  </Button>,
                )}
              </PermissionGate>
            )}
            {!cancelled && sessionOpen && (
              <PermissionGate perm="sales:cancel">
                {guarded(
                  <Button
                    danger
                    disabled={invoiceInFlight}
                    onClick={() => setCancelOpen(true)}
                  >
                    Annuler la vente
                  </Button>,
                )}
              </PermissionGate>
            )}
          </>
        }
      />

      {cancelled && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Vente annulée le ${formatDateTime(data.cancelledAt ?? data.createdAt)}`}
          description={data.cancelReason ?? undefined}
        />
      )}
      {!cancelled && !sessionOpen && session.data && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="La session de caisse est clôturée"
          description="Cette vente ne s’annule plus (RG-14) ; elle se corrige par un retour."
        />
      )}

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 3 }}
          items={[
            {
              key: 'status',
              label: 'Statut',
              children: <OrderStatusTag status={data.status} />,
            },
            {
              key: 'cashier',
              label: 'Caissier',
              children: data.cashier?.fullName ?? '—',
            },
            ...(showEinvoice
              ? [
                  {
                    key: 'einvoice',
                    label: 'Facture',
                    children: <EinvoiceStatusTag status={einvoiceStatus} />,
                  },
                ]
              : []),
            {
              key: 'customer',
              label: 'Client',
              children: data.customer ? (
                <Link to={`/customers/${data.customer.id}`}>
                  {data.customer.fullName}
                </Link>
              ) : (
                'Comptoir'
              ),
            },
            {
              key: 'subtotal',
              label: 'Sous-total',
              children: <Money value={data.subtotal} />,
            },
            {
              key: 'discount',
              label: 'Remise',
              children:
                data.discountTotal > 0 ? (
                  <Money value={-data.discountTotal} signed />
                ) : (
                  '—'
                ),
            },
            {
              key: 'total',
              label: 'Total',
              children: <Money value={data.total} strong />,
            },
            {
              key: 'refunded',
              label: 'Remboursé',
              children:
                data.refundedTotal > 0 ? (
                  <Money value={-data.refundedTotal} signed />
                ) : (
                  '—'
                ),
            },
            { key: 'note', label: 'Note', children: data.note ?? '—', span: 2 },
          ]}
        />
      </Card>

      <Card
        title="Articles"
        style={{ marginTop: 16 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<OrderLine>
          rowKey="id"
          pagination={false}
          dataSource={data.lines}
          columns={[
            { title: 'SKU', dataIndex: 'skuSnapshot', width: 210 },
            { title: 'Article', dataIndex: 'nameSnapshot' },
            {
              title: 'PU',
              dataIndex: 'unitPrice',
              align: 'right',
              width: 130,
              render: (value: number) => <Money value={value} />,
            },
            { title: 'Qté', dataIndex: 'quantity', align: 'right', width: 70 },
            {
              title: 'Remise',
              dataIndex: 'discount',
              align: 'right',
              width: 120,
              render: (value: number) =>
                value > 0 ? <Money value={-value} signed /> : '—',
            },
            {
              title: 'Retourné',
              dataIndex: 'returnedQty',
              align: 'right',
              width: 100,
              render: (value: number) =>
                value > 0 ? <Tag color="orange">{value}</Tag> : '—',
            },
            {
              title: 'Total',
              dataIndex: 'lineTotal',
              align: 'right',
              width: 140,
              render: (value: number) => <Money value={value} />,
            },
          ]}
        />
      </Card>

      <Card
        title="Paiements"
        style={{ marginTop: 16 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<OrderPayment>
          rowKey="id"
          pagination={false}
          dataSource={data.payments}
          columns={[
            {
              title: 'Sens',
              dataIndex: 'direction',
              width: 130,
              render: (value: 'IN' | 'OUT') => (
                <Tag color={value === 'IN' ? 'green' : 'volcano'}>
                  {value === 'IN' ? 'encaissement' : 'remboursement'}
                </Tag>
              ),
            },
            {
              title: 'Mode',
              dataIndex: 'method',
              width: 160,
              render: (value: OrderPayment['method']) =>
                paymentMethodLabel[value] ?? value,
            },
            {
              title: 'Montant',
              dataIndex: 'amount',
              align: 'right',
              width: 140,
              render: (value: number, row) => (
                <Money value={row.direction === 'IN' ? value : -value} signed />
              ),
            },
            {
              title: 'Remis',
              dataIndex: 'amountTendered',
              align: 'right',
              width: 140,
              render: (value: number | null) =>
                value === null ? '—' : <Money value={value} />,
            },
            {
              title: 'Rendu',
              dataIndex: 'changeGiven',
              align: 'right',
              width: 140,
              render: (value: number | null) =>
                value ? <Money value={value} /> : '—',
            },
            {
              title: 'Référence',
              dataIndex: 'reference',
              render: (value: string | null) => value ?? '—',
            },
            {
              title: 'Le',
              dataIndex: 'createdAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
          ]}
        />
      </Card>

      {showEinvoice && (
        <SaleEinvoiceCard
          sale={data}
          einvoice={einvoice.data}
          loading={einvoice.isPending}
          sameDay={sameDay}
          retrying={retry.isPending}
          onNormalizeLate={() => setNormalizeOpen(true)}
          onRetry={(invoiceId) => retry.mutate(invoiceId)}
        />
      )}

      <NormalizeLateModal
        open={normalizeOpen}
        saleNumber={data.number}
        pending={normalizeLate.isPending}
        defaultBuyer={
          data.buyer
            ? {
                ...(data.buyer.name ? { name: data.buyer.name } : {}),
                ...(data.buyer.ifu ? { ifu: data.buyer.ifu } : {}),
              }
            : undefined
        }
        onCancel={() => setNormalizeOpen(false)}
        onSubmit={(buyer) =>
          normalizeLate.mutate(
            { id: data.id, buyer },
            { onSuccess: () => setNormalizeOpen(false) },
          )
        }
      />

      {returnOpen && (
        <ReturnModal
          key={data.id + data.refundedTotal}
          order={data}
          normalized={einvoiceStatus === 'CONFIRMED'}
          open
          pending={createReturn.isPending}
          onCancel={() => setReturnOpen(false)}
          onSubmit={(payload) =>
            createReturn.mutate(
              { id: data.id, payload },
              { onSuccess: () => setReturnOpen(false) },
            )
          }
        />
      )}

      <Modal
        open={cancelOpen}
        title={`Annuler la vente ${data.number}`}
        okText="Annuler la vente"
        cancelText="Revenir"
        okButtonProps={{
          danger: true,
          loading: cancel.isPending,
          disabled: cancelReason.trim().length === 0,
        }}
        onCancel={() => setCancelOpen(false)}
        onOk={() =>
          cancel.mutate(
            { id: data.id, payload: { reason: cancelReason.trim() } },
            { onSuccess: () => setCancelOpen(false) },
          )
        }
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Le stock revient et l’argent ressort de la caisse"
          description={
            <>
              L’annulation est tracée : elle ne supprime rien, elle écrit les
              contre-écritures.
              {creditNoteWarning && <> {creditNoteWarning}</>}
            </>
          }
        />
        <Input.TextArea
          rows={3}
          maxLength={255}
          placeholder="Motif de l’annulation (obligatoire)"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
        />
      </Modal>
    </>
  );
}

export default SaleDetailPage;
