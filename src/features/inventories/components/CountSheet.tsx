import { useRef, useState } from 'react';
import {
  Button,
  Flex,
  Input,
  InputNumber,
  Switch,
  Table,
  Typography,
} from 'antd';
import type { InputRef } from 'antd';
import type { InventoryLine } from '../../../shared/api/types';
import { HEADER_HEIGHT } from '../../../shared/constants/layout';

interface Props {
  lines: InventoryLine[];
  saving: boolean;
  onSave: (lines: { variantId: string; countedQty: number }[]) => void;
}

/**
 * Feuille de comptage, pensée pour une tablette en entrepôt : saisie au doigt,
 * scan au code-barres, et un filtre « reste à compter » pour ne pas relire
 * cinquante lignes déjà faites.
 *
 * Le théorique est masqué par défaut : voir le chiffre attendu avant de
 * compter, c'est compter ce chiffre. On peut l'afficher pour arbitrer.
 */
export function CountSheet({ lines, saving, onSave }: Props) {
  const scanRef = useRef<InputRef>(null);
  const [counts, setCounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(lines.map((line) => [line.variantId, line.countedQty])),
  );
  const [showExpected, setShowExpected] = useState(false);
  const [remainingOnly, setRemainingOnly] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanTerm, setScanTerm] = useState('');

  const counted = Object.values(counts).filter(
    (value) => value !== null,
  ).length;
  const dirty = lines.filter(
    (line) => counts[line.variantId] !== line.countedQty,
  );

  const visible = (
    remainingOnly
      ? lines.filter((line) => counts[line.variantId] === null)
      : lines
  )
    .slice()
    .sort((a, b) => (a.sku ?? '').localeCompare(b.sku ?? ''));

  /** Un bip de douchette vaut « une unité de plus sur cette référence ». */
  const scan = (value: string) => {
    const term = value.trim().toLowerCase();
    if (!term) return;

    const line = lines.find((item) => (item.sku ?? '').toLowerCase() === term);
    if (!line) {
      setScanError(
        `Aucune ligne pour « ${value.trim()} » dans cet inventaire.`,
      );
      return;
    }

    setScanError(null);
    setScanTerm('');
    setCounts((previous) => ({
      ...previous,
      [line.variantId]: (previous[line.variantId] ?? 0) + 1,
    }));
    scanRef.current?.focus();
  };

  return (
    <>
      <Flex gap={16} wrap align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          ref={scanRef}
          allowClear
          autoFocus
          enterButton="+1"
          status={scanError ? 'error' : undefined}
          placeholder="Scanner ou saisir un SKU"
          style={{ maxWidth: 340 }}
          value={scanTerm}
          onChange={(event) => setScanTerm(event.target.value)}
          onSearch={scan}
        />
        <Flex align="center" gap={8}>
          <Switch
            size="small"
            aria-label="Reste à compter"
            checked={remainingOnly}
            onChange={setRemainingOnly}
          />
          <span>Reste à compter</span>
        </Flex>
        <Flex align="center" gap={8}>
          <Switch
            size="small"
            aria-label="Afficher le théorique"
            checked={showExpected}
            onChange={setShowExpected}
          />
          <span>Afficher le théorique</span>
        </Flex>
        <Typography.Text type="secondary">
          {counted}/{lines.length} compté(s)
        </Typography.Text>
      </Flex>

      {scanError && (
        <Typography.Paragraph type="danger">{scanError}</Typography.Paragraph>
      )}

      <Table<InventoryLine>
        rowKey="variantId"
        size="small"
        pagination={false}
        // En-tête collant plutôt qu'un cadre à défilement interne : sur une
        // tablette on fait défiler la page, et les colonnes restent alignées.
        sticky={{ offsetHeader: HEADER_HEIGHT }}
        dataSource={visible}
        locale={{ emptyText: 'Tout est compté.' }}
        columns={[
          {
            title: 'Article',
            key: 'article',
            render: (_, row) => (
              <>
                <div>
                  {row.productName} — {row.variantName}
                </div>
                <small style={{ color: '#8a98a8' }}>{row.sku}</small>
              </>
            ),
          },
          ...(showExpected
            ? [
                {
                  title: 'Théorique',
                  dataIndex: 'expectedQty',
                  align: 'right' as const,
                  width: 110,
                },
              ]
            : []),
          {
            title: 'Compté',
            key: 'counted',
            align: 'right',
            width: 150,
            render: (_, row) => (
              <InputNumber
                min={0}
                precision={0}
                size="large"
                style={{ width: 110 }}
                inputMode="numeric"
                placeholder="—"
                value={counts[row.variantId]}
                onChange={(next) =>
                  setCounts((previous) => ({
                    ...previous,
                    [row.variantId]: next,
                  }))
                }
              />
            ),
          },
          ...(showExpected
            ? [
                {
                  title: 'Écart',
                  key: 'gap',
                  align: 'right' as const,
                  width: 90,
                  render: (_: unknown, row: InventoryLine) => {
                    const value = counts[row.variantId];
                    if (value === null || value === undefined) return '—';
                    const gap = value - row.expectedQty;
                    return (
                      <span
                        style={{
                          color:
                            gap === 0 ? undefined : 'var(--sankara-danger)',
                        }}
                      >
                        {gap > 0 ? `+${gap}` : gap}
                      </span>
                    );
                  },
                },
              ]
            : []),
        ]}
      />

      <Flex justify="end" gap={8} style={{ marginTop: 16 }}>
        <Button
          type="primary"
          disabled={dirty.length === 0}
          loading={saving}
          onClick={() =>
            onSave(
              dirty
                .filter((line) => counts[line.variantId] !== null)
                .map((line) => ({
                  variantId: line.variantId,
                  countedQty: counts[line.variantId] as number,
                })),
            )
          }
        >
          Enregistrer {dirty.length > 0 ? `(${dirty.length})` : ''}
        </Button>
      </Flex>
    </>
  );
}
