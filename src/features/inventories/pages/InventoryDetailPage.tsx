import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Statistic,
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
import { formatDateTime } from '../../../shared/utils/format';
import {
  useCancelInventory,
  useInventory,
  useSetCounts,
  useSubmitInventory,
  useValidateInventory,
} from '../hooks';
import { InventoryStatusTag } from '../components/InventoryStatusTag';
import { CountSheet } from '../components/CountSheet';
import type { InventoryLine } from '../../../shared/api/types';

export function InventoryDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [validationNote, setValidationNote] = useState('');

  const inventory = useInventory(id);
  const setCounts = useSetCounts();
  const submit = useSubmitInventory();
  const validate = useValidateInventory();
  const cancel = useCancelInventory();

  if (inventory.isPending) return <PageSkeleton />;
  if (inventory.isError) {
    return (
      <ErrorState
        error={inventory.error}
        onRetry={() => void inventory.refetch()}
      />
    );
  }

  const data = inventory.data;
  const counting = data.status === 'IN_PROGRESS';
  const toValidate = data.status === 'SUBMITTED';
  const allCounted = data.countedCount === data.lineCount;
  const gaps = data.lines.filter((line) => (line.difference ?? 0) !== 0);

  return (
    <>
      <PageHeader
        title={data.number}
        subtitle={data.site.name}
        breadcrumb={[
          { title: 'Stock' },
          { title: 'Inventaires', href: '/inventories' },
          { title: data.number },
        ]}
        actions={
          <>
            {(counting || toValidate) && (
              <PermissionGate perm="inventories:count">
                <Button onClick={() => setCancelOpen(true)}>Annuler</Button>
              </PermissionGate>
            )}
            {counting && (
              <PermissionGate perm="inventories:count">
                <ConfirmAction
                  title="Clôturer le comptage ?"
                  description="Les quantités ne seront plus modifiables. Le stock ne bougera qu’à la validation."
                  okText="Clôturer"
                  disabled={!allCounted}
                  loading={submit.isPending}
                  onConfirm={() => submit.mutate(data.id)}
                >
                  Clôturer le comptage
                </ConfirmAction>
              </PermissionGate>
            )}
            {toValidate && (
              <PermissionGate perm="inventories:count">
                <ConfirmAction
                  title="Valider cet inventaire ?"
                  description={`${gaps.length} ajustement(s) seront écrits au registre de stock. L’opération est définitive.`}
                  okText="Valider"
                  loading={validate.isPending}
                  onConfirm={() =>
                    validate.mutate({
                      id: data.id,
                      note: validationNote.trim() || undefined,
                    })
                  }
                >
                  Valider les écarts
                </ConfirmAction>
              </PermissionGate>
            )}
          </>
        }
      />

      {counting && !allCounted && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${data.lineCount - data.countedCount} article(s) restent à compter`}
          description="Un article non trouvé se compte 0 : la clôture exige une quantité sur chaque ligne."
        />
      )}
      {toValidate && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Comptage clôturé, en attente de validation"
          description="Un écart au-delà du seuil paramétré demande la validation d’un administrateur (RG-04). Rien n’est écrit en stock avant."
        />
      )}

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 4 }}
          items={[
            {
              key: 'status',
              label: 'Statut',
              children: <InventoryStatusTag status={data.status} />,
            },
            {
              key: 'submitted',
              label: 'Clôturé le',
              children: data.submittedAt
                ? formatDateTime(data.submittedAt)
                : '—',
            },
            {
              key: 'validated',
              label: 'Validé le',
              children: data.validatedAt
                ? formatDateTime(data.validatedAt)
                : '—',
            },
            { key: 'note', label: 'Note', children: data.note ?? '—' },
          ]}
        />
      </Card>

      {counting ? (
        <Card title="Feuille de comptage" style={{ marginTop: 16 }}>
          <CountSheet
            lines={data.lines}
            saving={setCounts.isPending}
            onSave={(lines) => setCounts.mutate({ id: data.id, lines })}
          />
        </Card>
      ) : (
        <Card
          title={`Écarts (${gaps.length} sur ${data.lineCount} article(s))`}
          style={{ marginTop: 16 }}
          extra={
            <Statistic
              value={gaps.reduce(
                (sum, line) => sum + (line.difference ?? 0),
                0,
              )}
              title="Solde des écarts"
              valueStyle={{ fontSize: 18 }}
            />
          }
        >
          <Table<InventoryLine>
            rowKey="id"
            size="small"
            pagination={false}
            // L'API renvoie déjà les plus gros écarts en tête : c'est ce que
            // le valideur regarde en premier.
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
                title: 'Théorique',
                dataIndex: 'expectedQty',
                align: 'right',
                width: 110,
              },
              {
                title: 'Compté',
                dataIndex: 'countedQty',
                align: 'right',
                width: 100,
                render: (value: number | null) => value ?? '—',
              },
              {
                title: 'Écart',
                dataIndex: 'difference',
                align: 'right',
                width: 100,
                render: (value: number | null) =>
                  value === null ? (
                    '—'
                  ) : value === 0 ? (
                    <Tag color="success">conforme</Tag>
                  ) : (
                    <Tag color={value > 0 ? 'lime' : 'volcano'}>
                      {value > 0 ? `+${value}` : value}
                    </Tag>
                  ),
              },
            ]}
          />

          {toValidate && (
            <Input.TextArea
              rows={2}
              maxLength={1000}
              style={{ marginTop: 16 }}
              placeholder="Commentaire porté au bon d’inventaire (facultatif)"
              value={validationNote}
              onChange={(event) => setValidationNote(event.target.value)}
            />
          )}
        </Card>
      )}

      <Modal
        open={cancelOpen}
        title="Annuler cet inventaire"
        okText="Annuler l’inventaire"
        cancelText="Revenir"
        okButtonProps={{ danger: true, loading: cancel.isPending }}
        onCancel={() => setCancelOpen(false)}
        onOk={() =>
          cancel.mutate(
            { id: data.id, reason: cancelReason || undefined },
            {
              onSuccess: () => {
                setCancelOpen(false);
                void navigate('/inventories');
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

export default InventoryDetailPage;
