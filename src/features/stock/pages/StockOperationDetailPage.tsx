import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Input, Modal, Table } from 'antd';
import {
  ConfirmAction,
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
  PdfButton,
  PermissionGate,
} from '../../../shared/components';
import { formatDateTime } from '../../../shared/utils/format';
import { stockApi } from '../api';
import { useCancelOperation, useValidateOperation } from '../hooks';
import { OperationStatusTag } from '../components/OperationStatusTag';
import { OPERATION_TYPE } from '../labels';

export function StockOperationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  const operation = useQuery({
    queryKey: ['stock', 'operation', id],
    queryFn: () => stockApi.operation(id),
    enabled: Boolean(id),
  });
  const validate = useValidateOperation();
  const cancel = useCancelOperation();

  if (operation.isPending) return <PageSkeleton />;
  if (operation.isError) {
    return (
      <ErrorState
        error={operation.error}
        onRetry={() => void operation.refetch()}
      />
    );
  }

  const data = operation.data;
  const isDraft = data.status === 'DRAFT';

  return (
    <>
      <PageHeader
        title={data.number}
        subtitle={`${OPERATION_TYPE[data.type] ?? data.type} · ${data.site.name}`}
        breadcrumb={[
          { title: 'Stock' },
          { title: 'Bons', href: '/stock/operations' },
          { title: data.number },
        ]}
        actions={
          <>
            <PdfButton
              path={`/stock/operations/${data.id}/pdf`}
              fileName={`${data.number}.pdf`}
            >
              Imprimer
            </PdfButton>
            {isDraft && (
              <PermissionGate perm="stock:entry">
                <Button onClick={() => setCancelOpen(true)}>
                  Annuler le bon
                </Button>
                <ConfirmAction
                  title="Valider ce bon ?"
                  description="Les mouvements de stock seront écrits. Un bon validé ne s’annule plus."
                  okText="Valider"
                  loading={validate.isPending}
                  onConfirm={() => validate.mutate(data.id)}
                >
                  Valider
                </ConfirmAction>
              </PermissionGate>
            )}
          </>
        }
      />

      {isDraft && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Brouillon : rien n’a encore bougé en stock"
          description="Les mouvements ne sont écrits qu’à la validation."
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
              children: <OperationStatusTag status={data.status} />,
            },
            {
              key: 'supplier',
              label: 'Fournisseur',
              children: data.supplier?.name ?? '—',
            },
            {
              key: 'validated',
              label: 'Validé le',
              children: data.validatedAt
                ? formatDateTime(data.validatedAt)
                : '—',
            },
            { key: 'reason', label: 'Motif', children: data.reason ?? '—' },
            { key: 'note', label: 'Note', children: data.note ?? '—', span: 2 },
          ]}
        />
      </Card>

      <Card
        title={`Articles (${data.totalQuantity})`}
        style={{ marginTop: 16 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="id"
          pagination={false}
          dataSource={data.lines}
          columns={[
            { title: 'SKU', dataIndex: 'sku', width: 220 },
            {
              title: 'Article',
              key: 'article',
              render: (_, row) =>
                `${row.productName ?? ''} — ${row.variantName ?? ''}`,
            },
            {
              title: 'Quantité',
              dataIndex: 'quantity',
              align: 'right',
              width: 110,
            },
            {
              title: 'Prix de revient',
              dataIndex: 'unitCost',
              align: 'right',
              width: 160,
              render: (value: number | null) =>
                value === null ? '—' : <Money value={value} />,
            },
          ]}
        />
      </Card>

      <Modal
        open={cancelOpen}
        title="Annuler ce bon"
        okText="Annuler le bon"
        cancelText="Revenir"
        okButtonProps={{ danger: true, loading: cancel.isPending }}
        onCancel={() => setCancelOpen(false)}
        onOk={() =>
          cancel.mutate(
            { id: data.id, reason: cancelReason || undefined },
            {
              onSuccess: () => {
                setCancelOpen(false);
                void navigate('/stock/operations');
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

export default StockOperationDetailPage;
