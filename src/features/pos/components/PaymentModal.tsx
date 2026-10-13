import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Divider,
  Flex,
  Input,
  Modal,
  Row,
  Select,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Money, MoneyInput } from '../../../shared/components';
import { paymentMethodLabel } from '../../../shared/constants/labels';
import { formatXof } from '../../../shared/utils/format';
import type { PaymentMethod, SalePayment } from '../../../shared/api/types';

interface Props {
  open: boolean;
  total: number;
  pending: boolean;
  /** Message d'échec réseau : la relance réutilise la même clé. */
  failure: string | null;
  onCancel: () => void;
  onSubmit: (payments: SalePayment[]) => void;
}

interface DraftPayment {
  method: PaymentMethod;
  amount: number | null;
  amountTendered: number | null;
  reference: string;
}

const METHODS: PaymentMethod[] = [
  'CASH',
  'MTN_MOMO',
  'MOOV_MONEY',
  'CARD',
  'BANK_TRANSFER',
];

/**
 * Encaissement (FRONTEND.md §9.2). « Valider » ne s'active que si la somme des
 * paiements égale exactement le total : le backend refuserait de toute façon
 * (RG-06), autant le dire tout de suite.
 */
export function PaymentModal({
  open,
  total,
  pending,
  failure,
  onCancel,
  onSubmit,
}: Props) {
  // Le parent remonte la fenêtre à chaque ouverture (prop `key`) : l'état
  // part donc toujours d'un paiement en espèces du montant exact.
  const [payments, setPayments] = useState<DraftPayment[]>(() => [
    { method: 'CASH', amount: total, amountTendered: null, reference: '' },
  ]);

  const paid = payments.reduce(
    (sum, payment) => sum + (payment.amount ?? 0),
    0,
  );
  const remaining = total - paid;

  const change = useMemo(() => {
    const cash = payments.find((payment) => payment.method === 'CASH');
    if (!cash?.amountTendered || !cash.amount) return 0;
    return Math.max(0, cash.amountTendered - cash.amount);
  }, [payments]);

  const missingReference = payments.some(
    (payment) => payment.method !== 'CASH' && !payment.reference.trim(),
  );
  const canSubmit = remaining === 0 && !missingReference && paid > 0;

  const update = (index: number, patch: Partial<DraftPayment>) =>
    setPayments((current) =>
      current.map((payment, i) =>
        i === index ? { ...payment, ...patch } : payment,
      ),
    );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={`Encaisser ${formatXof(total)}`}
      width={620}
      destroyOnHidden
      footer={
        <Flex justify="space-between" align="center">
          <Typography.Text type={remaining === 0 ? 'success' : 'warning'}>
            {remaining === 0
              ? 'Montant exact'
              : remaining > 0
                ? `Reste ${formatXof(remaining)}`
                : `Trop perçu de ${formatXof(-remaining)}`}
          </Typography.Text>
          <Flex gap={8}>
            <Button onClick={onCancel}>Annuler</Button>
            <Button
              type="primary"
              size="large"
              disabled={!canSubmit}
              loading={pending}
              onClick={() =>
                onSubmit(
                  payments.map((payment) => ({
                    method: payment.method,
                    amount: payment.amount ?? 0,
                    ...(payment.method === 'CASH' && payment.amountTendered
                      ? { amountTendered: payment.amountTendered }
                      : {}),
                    ...(payment.method !== 'CASH'
                      ? { reference: payment.reference.trim() }
                      : {}),
                  })),
                )
              }
            >
              {failure ? 'Réessayer' : 'Valider'}
            </Button>
          </Flex>
        </Flex>
      }
    >
      {failure && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Connexion perdue, la vente n’est pas confirmée"
          description={`${failure} Réessayez : la vente ne sera pas enregistrée deux fois.`}
        />
      )}

      {payments.map((payment, index) => (
        <Row gutter={8} key={index} align="middle" style={{ marginBottom: 10 }}>
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              value={payment.method}
              onChange={(method: PaymentMethod) => update(index, { method })}
              options={METHODS.map((method) => ({
                value: method,
                label: paymentMethodLabel[method],
              }))}
            />
          </Col>
          <Col xs={16} sm={8}>
            <MoneyInput
              value={payment.amount}
              onChange={(amount) => update(index, { amount })}
            />
          </Col>
          <Col xs={8} sm={6}>
            {payment.method === 'CASH' ? (
              <MoneyInput
                value={payment.amountTendered}
                onChange={(amountTendered) => update(index, { amountTendered })}
                placeholder="Remis"
              />
            ) : (
              <Input
                value={payment.reference}
                onChange={(event) =>
                  update(index, { reference: event.target.value })
                }
                placeholder="Référence"
                status={payment.reference.trim() ? undefined : 'warning'}
              />
            )}
          </Col>
          <Col sm={2}>
            {payments.length > 1 && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  setPayments((current) =>
                    current.filter((_, i) => i !== index),
                  )
                }
              />
            )}
          </Col>
        </Row>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() =>
          setPayments((current) => [
            ...current,
            {
              method: 'MTN_MOMO',
              amount: remaining > 0 ? remaining : null,
              amountTendered: null,
              reference: '',
            },
          ])
        }
      >
        Ajouter un mode de paiement
      </Button>

      {change > 0 && (
        <>
          <Divider />
          <Flex justify="space-between" align="center">
            <Typography.Title level={4} style={{ margin: 0 }}>
              Rendu monnaie
            </Typography.Title>
            <Typography.Title
              level={2}
              style={{ margin: 0, color: 'var(--sankara-success)' }}
            >
              <Money value={change} />
            </Typography.Title>
          </Flex>
        </>
      )}
    </Modal>
  );
}
