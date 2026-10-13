import { useState } from 'react';
import { Button, Col, InputNumber, Row, Typography } from 'antd';
import { Money } from '../../../shared/components';

/** Coupures et pièces en circulation au Bénin (franc CFA). */
const DENOMINATIONS = [10000, 5000, 2000, 1000, 500, 250, 100, 50, 25, 10, 5];

/**
 * Compter un tiroir-caisse de tête invite à l'erreur : on saisit le nombre de
 * coupures, le total se calcule (FRONTEND.md §10.2).
 */
export function CashCountHelper({
  onTotal,
}: {
  onTotal: (total: number) => void;
}) {
  const [counts, setCounts] = useState<Record<number, number>>({});

  const total = DENOMINATIONS.reduce(
    (sum, value) => sum + value * (counts[value] ?? 0),
    0,
  );

  return (
    <>
      <Row gutter={[12, 12]}>
        {DENOMINATIONS.map((value) => (
          <Col xs={12} sm={8} md={6} lg={4} key={value}>
            <Typography.Text type="secondary">{value} FCFA</Typography.Text>
            <InputNumber
              min={0}
              precision={0}
              style={{ width: '100%' }}
              value={counts[value] ?? 0}
              onChange={(count) =>
                setCounts((current) => ({ ...current, [value]: count ?? 0 }))
              }
            />
          </Col>
        ))}
      </Row>

      <Row align="middle" justify="space-between" style={{ marginTop: 16 }}>
        <Typography.Text strong>
          Total compté : <Money value={total} strong />
        </Typography.Text>
        <Button onClick={() => onTotal(total)} disabled={total === 0}>
          Reporter sur les espèces
        </Button>
      </Row>
    </>
  );
}
