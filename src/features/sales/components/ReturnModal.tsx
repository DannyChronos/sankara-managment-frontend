import { useState } from 'react';
import {
  Alert,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  Typography,
} from 'antd';
import { Money } from '../../../shared/components';
import { paymentMethodLabel } from '../../../shared/constants/labels';
import type {
  CreateReturnPayload,
  Order,
  PaymentMethod,
} from '../../../shared/api/types';

interface Props {
  order: Order;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateReturnPayload) => void;
}

interface Draft {
  orderLineId: string;
  sku: string;
  name: string;
  unitPrice: number;
  /** Ce qui peut encore revenir : vendu moins déjà retourné. */
  returnable: number;
  quantity: number;
}

/**
 * Retour sur une vente (F-13). On ne retourne que ce qui n'est pas déjà
 * revenu, le motif est obligatoire, et le remboursement sort de la session
 * ouverte du caissier qui l'enregistre — pas de celle de la vente d'origine.
 */
export function ReturnModal({
  order,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    order.lines
      .filter((line) => line.quantity - line.returnedQty > 0)
      .map((line) => ({
        orderLineId: line.id,
        sku: line.skuSnapshot,
        name: line.nameSnapshot,
        // Prix réellement payé à la ligne, remise comprise.
        unitPrice: Math.round(line.lineTotal / line.quantity),
        returnable: line.quantity - line.returnedQty,
        quantity: 0,
      })),
  );
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(true);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('CASH');

  const picked = drafts.filter((draft) => draft.quantity > 0);
  const refund = picked.reduce(
    (total, draft) => total + draft.quantity * draft.unitPrice,
    0,
  );
  const canSubmit = picked.length > 0 && reason.trim().length > 0;

  return (
    <Modal
      open={open}
      width={760}
      title={`Retour sur ${order.number}`}
      okText="Enregistrer le retour"
      cancelText="Revenir"
      okButtonProps={{ loading: pending, disabled: !canSubmit }}
      onCancel={onCancel}
      onOk={() =>
        onSubmit({
          lines: picked.map((draft) => ({
            orderLineId: draft.orderLineId,
            quantity: draft.quantity,
          })),
          reason: reason.trim(),
          restock,
          refundMethod,
        })
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Le remboursement sort de votre caisse"
        description="Il est porté par votre session ouverte, pas par celle de la vente d’origine. Vous devez donc avoir une caisse ouverte."
      />

      <Table<Draft>
        rowKey="orderLineId"
        size="small"
        pagination={false}
        locale={{ emptyText: 'Tout a déjà été retourné sur cette vente.' }}
        dataSource={drafts}
        columns={[
          {
            title: 'Article',
            key: 'article',
            render: (_, row) => (
              <>
                <div>{row.name}</div>
                <small style={{ color: '#8a98a8' }}>{row.sku}</small>
              </>
            ),
          },
          {
            title: 'Prix payé',
            dataIndex: 'unitPrice',
            align: 'right',
            width: 130,
            render: (value: number) => <Money value={value} />,
          },
          {
            title: 'Retournable',
            dataIndex: 'returnable',
            align: 'right',
            width: 110,
          },
          {
            title: 'À retourner',
            dataIndex: 'quantity',
            align: 'right',
            width: 130,
            render: (value: number, row) => (
              <InputNumber
                min={0}
                max={row.returnable}
                precision={0}
                style={{ width: 90 }}
                value={value}
                onChange={(next) =>
                  setDrafts((previous) =>
                    previous.map((draft) =>
                      draft.orderLineId === row.orderLineId
                        ? { ...draft, quantity: next ?? 0 }
                        : draft,
                    ),
                  )
                }
              />
            ),
          },
        ]}
      />

      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Motif du retour" required>
          <Input
            maxLength={255}
            placeholder="Matelas trop ferme"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Form.Item>

        <Form.Item label="Mode de remboursement" required>
          <Select
            style={{ maxWidth: 280 }}
            value={refundMethod}
            onChange={setRefundMethod}
            options={Object.entries(paymentMethodLabel).map(
              ([value, label]) => ({
                value,
                label,
              }),
            )}
          />
        </Form.Item>

        <Form.Item
          label="Remettre en stock vendable"
          extra="Décochez si l’article revient abîmé : il sortira par un bon de casse."
        >
          <Switch
            checked={restock}
            onChange={setRestock}
            aria-label="Remettre en stock vendable"
          />
        </Form.Item>
      </Form>

      <Typography.Paragraph style={{ marginBottom: 0 }}>
        Montant remboursé : <Money value={refund} strong />
      </Typography.Paragraph>
    </Modal>
  );
}
