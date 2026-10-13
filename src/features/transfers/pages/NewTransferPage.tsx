import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PageHeader, VariantPicker } from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { useSites } from '../../sites/hooks';
import { useCreateTransfer } from '../hooks';
import type { VariantSearchResult } from '../../../shared/api/types';

interface Line {
  variantId: string;
  sku: string;
  label: string;
  available: number;
  quantity: number;
}

/**
 * Préparation d'un transfert : rien ne quitte le site tant qu'il n'est pas
 * expédié (RG-03). Le disponible affiché est celui du site source.
 */
export function NewTransferPage() {
  const navigate = useNavigate();
  const { siteId, currentSite } = useAuth();
  const sites = useSites();
  const create = useCreateTransfer();

  const [toSiteId, setToSiteId] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  const total = lines.reduce((sum, line) => sum + line.quantity, 0);
  const overdrawn = lines.filter((line) => line.quantity > line.available);
  const canSubmit = Boolean(toSiteId) && lines.length > 0;

  const addLine = (variant: VariantSearchResult) => {
    setLines((previous) => [
      ...previous,
      {
        variantId: variant.id,
        sku: variant.sku,
        label: `${variant.productName} — ${variant.name}`,
        available: variant.available,
        quantity: 1,
      },
    ]);
  };

  const submit = () => {
    if (!toSiteId) return;
    create.mutate(
      {
        toSiteId,
        ...(note.trim() ? { note: note.trim() } : {}),
        lines: lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      },
      { onSuccess: (transfer) => void navigate(`/transfers/${transfer.id}`) },
    );
  };

  return (
    <>
      <PageHeader
        title="Nouveau transfert"
        subtitle={`Depuis ${currentSite?.name ?? 'le site courant'}`}
        breadcrumb={[
          { title: 'Stock' },
          { title: 'Transferts', href: '/transfers' },
          { title: 'Nouveau' },
        ]}
      />

      <Card>
        <Form layout="vertical" style={{ maxWidth: 720 }}>
          <Form.Item
            label="Site destination"
            required
            extra="Le stock sort du site courant à l’expédition et n’entre à destination qu’à la réception."
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Choisir le site qui recevra la marchandise"
              loading={sites.isPending}
              value={toSiteId}
              onChange={setToSiteId}
              options={(sites.data?.data ?? [])
                // Un site ne se transfère rien à lui-même.
                .filter((site) => site.id !== siteId)
                .map((site) => ({
                  value: site.id,
                  label: `${site.name} (${site.code})`,
                }))}
            />
          </Form.Item>

          <Form.Item label="Note">
            <Input.TextArea
              rows={2}
              maxLength={1000}
              placeholder="Transporteur, numéro de bon de route…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="Articles à envoyer"
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
            description="L’expédition sera refusée tant que le stock du site source ne suffit pas."
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
              title: 'Disponible',
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
                  status={value > row.available ? 'warning' : undefined}
                  value={value}
                  onChange={(next) =>
                    setLines((previous) =>
                      previous.map((line) =>
                        line.variantId === row.variantId
                          ? { ...line, quantity: next ?? 1 }
                          : line,
                      ),
                    )
                  }
                />
              ),
            },
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
          <Typography.Text type="secondary">{total} article(s)</Typography.Text>
          <Flex gap={8}>
            <Button onClick={() => void navigate('/transfers')}>Annuler</Button>
            <Button
              type="primary"
              disabled={!canSubmit}
              loading={create.isPending}
              onClick={submit}
            >
              Préparer le transfert
            </Button>
          </Flex>
        </Flex>
      </Card>
    </>
  );
}

export default NewTransferPage;
