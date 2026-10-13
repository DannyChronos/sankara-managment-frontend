import { Table } from 'antd';
import { Money, MoneyInput } from '../../../shared/components';
import { paymentMethodLabel } from '../../../shared/constants/labels';
import type {
  PaymentMethod,
  SessionMethodTotal,
} from '../../../shared/api/types';
import { GapCell } from './GapCell';

interface Props {
  totals: SessionMethodTotal[];
  /** Colonne de saisie : montant compté (clôture) ou reçu (vérification). */
  editable?: {
    label: string;
    values: Record<string, number>;
    onChange: (method: PaymentMethod, amount: number) => void;
  };
  /** Écart calculé en direct pendant la saisie. */
  liveGap?: boolean;
}

export function TotalsByMethodTable({ totals, editable, liveGap }: Props) {
  const rows = totals.map((total) => {
    const entered = editable?.values[total.method] ?? null;
    return {
      ...total,
      entered,
      computedGap:
        liveGap && entered !== null
          ? entered - total.expectedAmount
          : total.gap,
    };
  });

  const sum = (key: 'expectedAmount' | 'declaredAmount' | 'receivedAmount') =>
    rows.reduce((total, row) => total + (row[key] ?? 0), 0);

  return (
    <Table
      size="small"
      rowKey="method"
      pagination={false}
      dataSource={rows}
      summary={() => (
        <Table.Summary.Row style={{ fontWeight: 600 }}>
          <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
          <Table.Summary.Cell index={1} align="right">
            <Money value={sum('expectedAmount')} />
          </Table.Summary.Cell>
          {editable && (
            <Table.Summary.Cell index={2} align="right">
              <Money
                value={rows.reduce(
                  (total, row) => total + (row.entered ?? 0),
                  0,
                )}
              />
            </Table.Summary.Cell>
          )}
          <Table.Summary.Cell index={3} align="right">
            <GapCell
              value={rows.reduce(
                (total, row) => total + (row.computedGap ?? 0),
                0,
              )}
            />
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
      columns={[
        {
          title: 'Mode de paiement',
          dataIndex: 'method',
          render: (method: PaymentMethod) => paymentMethodLabel[method],
        },
        {
          title: 'Attendu',
          dataIndex: 'expectedAmount',
          align: 'right',
          width: 150,
          render: (value: number) => <Money value={value} />,
        },
        ...(editable
          ? [
              {
                title: editable.label,
                dataIndex: 'entered',
                align: 'right' as const,
                width: 190,
                render: (_: unknown, row: (typeof rows)[number]) => (
                  <MoneyInput
                    value={row.entered}
                    onChange={(value) =>
                      editable.onChange(row.method, value ?? 0)
                    }
                  />
                ),
              },
            ]
          : []),
        {
          title: 'Écart',
          dataIndex: 'computedGap',
          align: 'right',
          width: 150,
          render: (value: number | null) => <GapCell value={value} />,
        },
      ]}
    />
  );
}
