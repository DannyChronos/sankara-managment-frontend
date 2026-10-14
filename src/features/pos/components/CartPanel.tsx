import { Button, Divider, Empty, Flex, InputNumber, Typography } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Money } from '../../../shared/components';
import { DiscountInput } from './DiscountInput';
import type { CartLine } from '../store/cart.store';

interface Props {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  customerLabel: string | null;
  onQuantity: (variantId: string, quantity: number) => void;
  onDiscount: (variantId: string, discount: number) => void;
  onRemove: (variantId: string) => void;
  onPickCustomer: () => void;
  onCheckout: () => void;
}

export function CartPanel({
  lines,
  subtotal,
  discount,
  total,
  customerLabel,
  onQuantity,
  onDiscount,
  onRemove,
  onPickCustomer,
  onCheckout,
}: Props) {
  return (
    <Flex vertical style={{ height: '100%' }}>
      <Typography.Title level={5} style={{ margin: '0 0 12px' }}>
        Panier
      </Typography.Title>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {lines.length === 0 ? (
          <Empty
            description="Scannez ou cherchez un article"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 48 }}
          />
        ) : (
          lines.map((line) => (
            <div
              key={line.variantId}
              style={{ padding: '10px 0', borderBottom: '1px solid #eef2f7' }}
            >
              <Flex justify="space-between" align="start" gap={8}>
                <div style={{ minWidth: 0 }}>
                  <Typography.Text strong ellipsis>
                    {line.label}
                  </Typography.Text>
                  <div style={{ fontSize: 12, color: '#8a98a8' }}>
                    {line.sku}
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => onRemove(line.variantId)}
                  aria-label={`Retirer ${line.label}`}
                />
              </Flex>

              <Flex
                align="center"
                justify="space-between"
                style={{ marginTop: 6 }}
              >
                <Flex align="center" gap={4}>
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() =>
                      onQuantity(line.variantId, line.quantity - 1)
                    }
                    aria-label="Diminuer"
                  />
                  <InputNumber
                    size="small"
                    min={1}
                    precision={0}
                    style={{ width: 58 }}
                    value={line.quantity}
                    onChange={(value) => onQuantity(line.variantId, value ?? 1)}
                  />
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      onQuantity(line.variantId, line.quantity + 1)
                    }
                    aria-label="Augmenter"
                  />
                  <span style={{ color: '#8a98a8', fontSize: 12 }}>
                    × <Money value={line.unitPrice} />
                  </span>
                </Flex>
                <Money
                  value={line.unitPrice * line.quantity - line.discount}
                  strong
                />
              </Flex>

              <Flex align="center" gap={6} style={{ marginTop: 6 }}>
                <span style={{ fontSize: 12, color: '#8a98a8' }}>Remise</span>
                <DiscountInput
                  lineTotal={line.unitPrice * line.quantity}
                  value={line.discount}
                  onChange={(discount) => onDiscount(line.variantId, discount)}
                />
                {line.quantity > line.available && (
                  <Typography.Text type="danger" style={{ fontSize: 12 }}>
                    dispo {line.available}
                  </Typography.Text>
                )}
              </Flex>
            </div>
          ))
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Flex justify="space-between">
        <span>Sous-total</span>
        <Money value={subtotal} />
      </Flex>
      {discount > 0 && (
        <Flex
          justify="space-between"
          style={{ color: 'var(--sankara-danger)' }}
        >
          <span>Remise</span>
          <Money value={-discount} />
        </Flex>
      )}
      <Flex justify="space-between" style={{ marginTop: 6 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          TOTAL
        </Typography.Title>
        <Typography.Title level={4} style={{ margin: 0 }}>
          <Money value={total} />
        </Typography.Title>
      </Flex>

      <Button block style={{ marginTop: 12 }} onClick={onPickCustomer}>
        {customerLabel ?? 'Client (facultatif) · F4'}
      </Button>

      <Button
        type="primary"
        size="large"
        block
        style={{ marginTop: 8, height: 54, fontSize: 18 }}
        disabled={lines.length === 0}
        onClick={onCheckout}
      >
        ENCAISSER (F9)
      </Button>
    </Flex>
  );
}
