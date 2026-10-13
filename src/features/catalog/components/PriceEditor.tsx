import { useState } from 'react';
import { Button, Flex, Popover, Table, Tag } from 'antd';
import { Money, MoneyInput } from '../../../shared/components';
import { PermissionGate } from '../../../shared/components';
import { formatDate } from '../../../shared/utils/format';
import { usePriceHistory, useSetPrice } from '../hooks';

interface Props {
  productId: string;
  variantId: string;
  channel: 'POS' | 'WEB';
  amount: number | null;
}

/**
 * Un prix ne se modifie pas : l'API clôture celui en vigueur et en crée un
 * nouveau. L'historique est consultable d'un survol — c'est ce qui explique
 * qu'une vente passée garde son prix.
 */
export function PriceEditor({ productId, variantId, channel, amount }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | null>(amount);
  const setPrice = useSetPrice(productId);
  const history = usePriceHistory(editing ? variantId : undefined);

  if (!editing) {
    return (
      <Flex align="center" gap={8} justify="end">
        {amount === null ? (
          <Tag color="warning">—</Tag>
        ) : (
          <Money value={amount} />
        )}
        <PermissionGate perm="prices:manage">
          <Button
            size="small"
            type="link"
            onClick={() => {
              setValue(amount);
              setEditing(true);
            }}
          >
            modifier
          </Button>
        </PermissionGate>
      </Flex>
    );
  }

  return (
    <Flex gap={6} align="center" justify="end">
      <Popover
        open
        placement="left"
        title="Historique des prix"
        content={
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            style={{ minWidth: 280 }}
            dataSource={(history.data ?? []).filter(
              (price) => price.channel === channel,
            )}
            columns={[
              {
                title: 'Montant',
                dataIndex: 'amount',
                render: (value: number) => <Money value={value} />,
              },
              {
                title: 'Depuis',
                dataIndex: 'validFrom',
                render: (value: string) => formatDate(value),
              },
              {
                title: '',
                dataIndex: 'validTo',
                render: (validTo: string | null) =>
                  validTo === null ? (
                    <Tag color="success">en vigueur</Tag>
                  ) : null,
              },
            ]}
          />
        }
      >
        <div style={{ width: 150 }}>
          <MoneyInput value={value} onChange={setValue} autoFocus />
        </div>
      </Popover>

      <Button
        size="small"
        type="primary"
        loading={setPrice.isPending}
        disabled={value === null || value === amount}
        onClick={() =>
          setPrice.mutate(
            { variantId, channel, amount: value ?? 0 },
            { onSuccess: () => setEditing(false) },
          )
        }
      >
        OK
      </Button>
      <Button size="small" onClick={() => setEditing(false)}>
        Annuler
      </Button>
    </Flex>
  );
}
