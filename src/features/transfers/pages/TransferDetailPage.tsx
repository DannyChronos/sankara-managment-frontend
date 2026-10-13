import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Table,
  Tag,
} from 'antd';
import {
  ConfirmAction,
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import {
  useCancelTransfer,
  useReceiveTransfer,
  useShipTransfer,
  useTransfer,
} from '../hooks';
import { TransferStatusTag } from '../components/TransferStatusTag';
import { ReceiveTransferModal } from '../components/ReceiveTransferModal';
import type { TransferLine } from '../../../shared/api/types';

export function TransferDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { siteId } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [receiveOpen, setReceiveOpen] = useState(false);

  const transfer = useTransfer(id);
  const ship = useShipTransfer();
  const receive = useReceiveTransfer();
  const cancel = useCancelTransfer();

  if (transfer.isPending) return <PageSkeleton />;
  if (transfer.isError) {
    return (
      <ErrorState
        error={transfer.error}
        onRetry={() => void transfer.refetch()}
      />
    );
  }

  const data = transfer.data;
  const isDraft = data.status === 'DRAFT';
  const isShipped = data.status === 'SHIPPED';
  // On n'expédie que depuis le site source, on ne réceptionne qu'à destination.
  const atSource = siteId === data.fromSite.id;
  const atDestination = siteId === data.toSite.id;

  return (
    <>
      <PageHeader
        title={data.number}
        subtitle={`${data.fromSite.name} → ${data.toSite.name}`}
        breadcrumb={[
          { title: 'Stock' },
          { title: 'Transferts', href: '/transfers' },
          { title: data.number },
        ]}
        actions={
          <>
            {isDraft && (
              <PermissionGate perm="transfers:cancel">
                <Button onClick={() => setCancelOpen(true)}>Annuler</Button>
              </PermissionGate>
            )}
            {isDraft && (
              <PermissionGate perm="transfers:ship">
                <ConfirmAction
                  title="Expédier ce transfert ?"
                  description={`${data.totalSent} article(s) vont sortir du stock de ${data.fromSite.name} et rester en transit jusqu’à la réception.`}
                  okText="Expédier"
                  disabled={!atSource}
                  loading={ship.isPending}
                  onConfirm={() => ship.mutate(data.id)}
                >
                  Expédier
                </ConfirmAction>
              </PermissionGate>
            )}
            {isShipped && (
              <PermissionGate perm="transfers:receive">
                <Button
                  type="primary"
                  disabled={!atDestination}
                  onClick={() => setReceiveOpen(true)}
                >
                  Réceptionner
                </Button>
              </PermissionGate>
            )}
          </>
        }
      />

      {isDraft && !atSource && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Expédition depuis le site source"
          description={`Basculez sur ${data.fromSite.name} pour expédier ce transfert.`}
        />
      )}
      {isShipped && (
        <Alert
          type={atDestination ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
          message="Marchandise en transit"
          description={
            atDestination
              ? 'Elle est attendue ici : elle n’entrera en stock qu’à la réception.'
              : `Elle est attendue à ${data.toSite.name}, qui doit la réceptionner.`
          }
        />
      )}
      {data.status === 'RECEIVED_WITH_GAP' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Reçu avec écart : ${data.totalReceived} sur ${data.totalSent}`}
          description="Le manquant n’a pas été réintégré au site source. Les motifs sont inscrits sur les lignes."
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
              children: <TransferStatusTag status={data.status} />,
            },
            {
              key: 'shipped',
              label: 'Expédié le',
              children: data.shippedAt ? formatDateTime(data.shippedAt) : '—',
            },
            {
              key: 'received',
              label: 'Réceptionné le',
              children: data.receivedAt ? formatDateTime(data.receivedAt) : '—',
            },
            {
              key: 'note',
              label: 'Note',
              children: data.note ?? '—',
              span: 3,
            },
          ]}
        />
      </Card>

      <Card
        title={`Articles (${data.totalSent} expédié(s))`}
        style={{ marginTop: 16 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<TransferLine>
          rowKey="id"
          pagination={false}
          dataSource={data.lines}
          columns={[
            { title: 'SKU', dataIndex: 'sku', width: 210 },
            {
              title: 'Article',
              key: 'article',
              render: (_, row) =>
                `${row.productName ?? ''} — ${row.variantName ?? ''}`,
            },
            {
              title: 'Expédié',
              dataIndex: 'quantitySent',
              align: 'right',
              width: 100,
            },
            {
              title: 'Reçu',
              dataIndex: 'quantityReceived',
              align: 'right',
              width: 100,
              render: (value: number | null) => value ?? '—',
            },
            {
              title: 'Écart',
              dataIndex: 'gap',
              align: 'right',
              width: 100,
              render: (value: number | null) =>
                value === null ? (
                  '—'
                ) : value === 0 ? (
                  <Tag color="success">conforme</Tag>
                ) : (
                  <Tag color="warning">{value}</Tag>
                ),
            },
            {
              title: 'Motif de l’écart',
              dataIndex: 'gapReason',
              render: (value: string | null) => value ?? '—',
            },
          ]}
        />
      </Card>

      {receiveOpen && (
        <ReceiveTransferModal
          // Remonter le composant à chaque ouverture : la saisie repart de
          // l'attendu, jamais d'un brouillon laissé derrière.
          key={data.id + (data.receivedAt ?? '')}
          transfer={data}
          open
          pending={receive.isPending}
          onCancel={() => setReceiveOpen(false)}
          onSubmit={(lines) =>
            receive.mutate(
              { id: data.id, lines },
              { onSuccess: () => setReceiveOpen(false) },
            )
          }
        />
      )}

      <Modal
        open={cancelOpen}
        title="Annuler ce transfert"
        okText="Annuler le transfert"
        cancelText="Revenir"
        okButtonProps={{ danger: true, loading: cancel.isPending }}
        onCancel={() => setCancelOpen(false)}
        onOk={() =>
          cancel.mutate(
            { id: data.id, reason: cancelReason || undefined },
            {
              onSuccess: () => {
                setCancelOpen(false);
                void navigate('/transfers');
              },
            },
          )
        }
      >
        <Input.TextArea
          rows={3}
          placeholder="Motif de l’annulation"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
        />
      </Modal>
    </>
  );
}

export default TransferDetailPage;
