import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  Typography,
} from 'antd';
import {
  Money,
  MoneyInput,
  PageHeader,
  VariantPicker,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { useCreateOperation, useSuppliers } from '../hooks';
import { ENTRY_TYPES, OPERATION_TYPE } from '../labels';
import type { VariantSearchResult } from '../../../shared/api/types';

interface Line {
  variantId: string;
  sku: string;
  label: string;
  available: number;
  quantity: number;
  unitCost: number | null;
}

const TYPE_OPTIONS = [
  {
    label: 'Entrées',
    options: ENTRY_TYPES.map((value) => ({
      value,
      label: OPERATION_TYPE[value],
    })),
  },
  {
    label: 'Sorties',
    options: Object.keys(OPERATION_TYPE)
      .filter((value) => !ENTRY_TYPES.includes(value))
      .map((value) => ({ value, label: OPERATION_TYPE[value] })),
  },
];

/** Bon d'entrée ou de sortie, créé en brouillon : rien ne bouge avant validation. */
export function NewStockOperationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentSite } = useAuth();
  const create = useCreateOperation();
  const suppliers = useSuppliers();

  const initialType = searchParams.get('type');
  const [type, setType] = useState(
    initialType && initialType in OPERATION_TYPE
      ? initialType
      : 'PRODUCTION_ENTRY',
  );
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  const isEntry = ENTRY_TYPES.includes(type);
  const total = lines.reduce((sum, line) => sum + line.quantity, 0);
  const valuation = lines.reduce(
    (sum, line) => sum + line.quantity * (line.unitCost ?? 0),
    0,
  );
  const overdrawn = useMemo(
    () =>
      isEntry ? [] : lines.filter((line) => line.quantity > line.available),
    [isEntry, lines],
  );

  const addLine = (variant: VariantSearchResult) => {
    setLines((previous) => [
      ...previous,
      {
        variantId: variant.id,
        sku: variant.sku,
        label: `${variant.productName} — ${variant.name}`,
        available: variant.available,
        quantity: 1,
        unitCost: null,
      },
    ]);
  };

  const patchLine = (variantId: string, patch: Partial<Line>) => {
    setLines((previous) =>
      previous.map((line) =>
        line.variantId === variantId ? { ...line, ...patch } : line,
      ),
    );
  };

  const canSubmit =
    lines.length > 0 &&
    lines.every((line) => line.quantity >= 1) &&
    (isEntry || reason.trim().length > 0);

  const submit = () => {
    create.mutate(
      {
        type,
        ...(isEntry && supplierId ? { supplierId } : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        lines: lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          ...(line.unitCost !== null ? { unitCost: line.unitCost } : {}),
        })),
      },
      {
        onSuccess: (operation) =>
          void navigate(`/stock/operations/${operation.id}`),
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Nouveau bon"
        subtitle={currentSite?.name}
        breadcrumb={[
          { title: 'Stock' },
          { title: 'Bons', href: '/stock/operations' },
          { title: 'Nouveau' },
        ]}
      />

      <Card>
        <Form layout="vertical" style={{ maxWidth: 720 }}>
          <Form.Item label="Type de bon" required>
            <Select
              value={type}
              onChange={(value: string) => {
                setType(value);
                if (ENTRY_TYPES.includes(value)) {
                  setReason('');
                } else {
                  setSupplierId(undefined);
                }
              }}
              options={TYPE_OPTIONS}
            />
          </Form.Item>

          {type === 'PURCHASE_RECEIPT' && (
            <Form.Item
              label="Fournisseur"
              extra="Pour les articles revendus (sommiers, oreillers)."
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Choisir un fournisseur"
                loading={suppliers.isPending}
                value={supplierId}
                onChange={setSupplierId}
                options={(suppliers.data?.data ?? [])
                  .filter((supplier) => supplier.isActive)
                  .map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  }))}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Motif"
            required={!isEntry}
            extra={
              isEntry
                ? 'Facultatif pour une entrée.'
                : 'Obligatoire : toute sortie doit être justifiée (F-14).'
            }
          >
            <Input
              maxLength={255}
              placeholder={
                isEntry
                  ? 'Fin de production du lot 42'
                  : 'Mousse déchirée au stockage'
              }
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Form.Item>

          <Form.Item label="Note">
            <Input.TextArea
              rows={2}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="Articles"
        style={{ marginTop: 16 }}
        extra={
          <VariantPicker
            exclude={lines.map((line) => line.variantId)}
            onPick={addLine}
          />
        }
      >
        {overdrawn.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Quantité supérieure au disponible"
            description="La validation sera refusée par le serveur tant que le stock ne suffit pas."
          />
        )}

        <Table<Line>
          rowKey="variantId"
          pagination={false}
          locale={{ emptyText: 'Ajoutez au moins un article.' }}
          dataSource={lines}
          columns={[
            { title: 'SKU', dataIndex: 'sku', width: 200 },
            { title: 'Article', dataIndex: 'label' },
            {
              title: isEntry ? 'En stock' : 'Disponible',
              dataIndex: 'available',
              align: 'right',
              width: 110,
            },
            {
              title: 'Quantité',
              dataIndex: 'quantity',
              align: 'right',
              width: 130,
              render: (value: number, row) => (
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: 90 }}
                  status={
                    !isEntry && value > row.available ? 'warning' : undefined
                  }
                  value={value}
                  onChange={(next) =>
                    patchLine(row.variantId, { quantity: next ?? 1 })
                  }
                />
              ),
            },
            ...(isEntry
              ? [
                  {
                    title: 'Prix de revient',
                    dataIndex: 'unitCost',
                    align: 'right' as const,
                    width: 200,
                    render: (value: number | null, row: Line) => (
                      <MoneyInput
                        value={value}
                        onChange={(next) =>
                          patchLine(row.variantId, { unitCost: next })
                        }
                        placeholder="facultatif"
                      />
                    ),
                  },
                ]
              : []),
            {
              title: '',
              key: 'remove',
              width: 60,
              render: (_, row) => (
                <Button
                  type="link"
                  danger
                  onClick={() =>
                    setLines((previous) =>
                      previous.filter(
                        (line) => line.variantId !== row.variantId,
                      ),
                    )
                  }
                >
                  retirer
                </Button>
              ),
            },
          ]}
        />

        <Flex
          justify="space-between"
          align="center"
          wrap
          gap={16}
          style={{ marginTop: 16 }}
        >
          <Typography.Text type="secondary">
            {total} article(s)
            {isEntry && valuation > 0 && (
              <>
                {' · valeur '}
                <Money value={valuation} />
              </>
            )}
          </Typography.Text>
          <Flex gap={8}>
            <Button onClick={() => void navigate('/stock/operations')}>
              Annuler
            </Button>
            <Button
              type="primary"
              disabled={!canSubmit}
              loading={create.isPending}
              onClick={submit}
            >
              Créer le brouillon
            </Button>
          </Flex>
        </Flex>
      </Card>
    </>
  );
}

export default NewStockOperationPage;
