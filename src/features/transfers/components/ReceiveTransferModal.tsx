import { useState } from 'react';
import { Alert, Input, InputNumber, Modal, Table, Typography } from 'antd';
import type { ReceiveLinePayload } from '../api';
import type { Transfer } from '../../../shared/api/types';

interface Props {
  transfer: Transfer;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (lines: ReceiveLinePayload[]) => void;
}

interface Draft {
  lineId: string;
  sku: string;
  label: string;
  quantitySent: number;
  quantityReceived: number;
  gapReason: string;
}

/**
 * Réception ligne par ligne (F-15). Ce qui manque n'est pas réintégré au site
 * source : la marchandise en est sortie et n'est jamais arrivée. L'écart doit
 * donc être justifié, et il reste inscrit sur la ligne.
 */
export function ReceiveTransferModal({
  transfer,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    transfer.lines.map((line) => ({
      lineId: line.id,
      sku: line.sku ?? '',
      label: `${line.productName ?? ''} — ${line.variantName ?? ''}`,
      quantitySent: line.quantitySent,
      // Le cas courant est « tout est arrivé » : on pré-remplit l'attendu.
      quantityReceived: line.quantitySent,
      gapReason: '',
    })),
  );

  const patch = (lineId: string, next: Partial<Draft>) =>
    setDrafts((previous) =>
      previous.map((draft) =>
        draft.lineId === lineId ? { ...draft, ...next } : draft,
      ),
    );

  const gaps = drafts.filter(
    (draft) => draft.quantityReceived !== draft.quantitySent,
  );
  const missingReason = gaps.filter((draft) => draft.gapReason.trim() === '');
  const totalReceived = drafts.reduce(
    (sum, draft) => sum + draft.quantityReceived,
    0,
  );

  return (
    <Modal
      open={open}
      width={820}
      title={`Réceptionner ${transfer.number}`}
      okText="Confirmer la réception"
      cancelText="Revenir"
      okButtonProps={{ loading: pending, disabled: missingReason.length > 0 }}
      onCancel={onCancel}
      onOk={() =>
        onSubmit(
          drafts.map((draft) => ({
            lineId: draft.lineId,
            quantityReceived: draft.quantityReceived,
            ...(draft.quantityReceived !== draft.quantitySent
              ? { gapReason: draft.gapReason.trim() }
              : {}),
          })),
        )
      }
    >
      {gaps.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${gaps.length} ligne(s) en écart`}
          description="Le manquant n’est pas remis au site source : il est constaté ici et signalé à l’administrateur."
        />
      )}

      <Table<Draft>
        rowKey="lineId"
        pagination={false}
        size="small"
        dataSource={drafts}
        columns={[
          {
            title: 'Article',
            key: 'article',
            render: (_, row) => (
              <>
                <div>{row.label}</div>
                <small style={{ color: '#8a98a8' }}>{row.sku}</small>
              </>
            ),
          },
          {
            title: 'Expédié',
            dataIndex: 'quantitySent',
            align: 'right',
            width: 90,
          },
          {
            title: 'Reçu',
            dataIndex: 'quantityReceived',
            align: 'right',
            width: 110,
            render: (value: number, row) => (
              <InputNumber
                min={0}
                max={row.quantitySent}
                precision={0}
                style={{ width: 90 }}
                status={value !== row.quantitySent ? 'warning' : undefined}
                value={value}
                onChange={(next) =>
                  patch(row.lineId, { quantityReceived: next ?? 0 })
                }
              />
            ),
          },
          {
            title: 'Motif de l’écart',
            key: 'gapReason',
            width: 260,
            render: (_, row) =>
              row.quantityReceived === row.quantitySent ? (
                <Typography.Text type="secondary">conforme</Typography.Text>
              ) : (
                <Input
                  placeholder="Carton manquant à l’arrivée"
                  status={row.gapReason.trim() === '' ? 'error' : undefined}
                  value={row.gapReason}
                  onChange={(event) =>
                    patch(row.lineId, { gapReason: event.target.value })
                  }
                />
              ),
          },
        ]}
      />

      <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
        <strong>{totalReceived}</strong> article(s) reçus sur{' '}
        <strong>{transfer.totalSent}</strong> expédié(s).
      </Typography.Paragraph>
    </Modal>
  );
}
