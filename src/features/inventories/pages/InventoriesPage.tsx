import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Flex,
  Input,
  Modal,
  Progress,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
  VariantPicker,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import { useInventories, useStartInventory } from '../hooks';
import { INVENTORY_STATUS_OPTIONS } from '../labels';
import { InventoryStatusTag } from '../components/InventoryStatusTag';
import type { Inventory, VariantSearchResult } from '../../../shared/api/types';

export function InventoriesPage() {
  const navigate = useNavigate();
  const { siteId, currentSite } = useAuth();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [startOpen, setStartOpen] = useState(false);
  const [note, setNote] = useState('');
  const [scope, setScope] = useState<VariantSearchResult[]>([]);

  const start = useStartInventory();
  const inventories = useInventories({
    page,
    limit: 20,
    ...(siteId ? { siteId } : {}),
    ...(status ? { status } : {}),
  });

  if (inventories.isPending) return <PageSkeleton />;
  if (inventories.isError) {
    return (
      <ErrorState
        error={inventories.error}
        onRetry={() => void inventories.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Inventaires"
        subtitle={currentSite?.name}
        actions={
          <PermissionGate perm="inventories:count">
            <Button type="primary" onClick={() => setStartOpen(true)}>
              Ouvrir un inventaire
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Tous les statuts"
            style={{ minWidth: 220 }}
            value={status}
            onChange={(value?: string) => {
              setStatus(value);
              setPage(1);
            }}
            options={INVENTORY_STATUS_OPTIONS}
          />
        </Flex>

        <Table<Inventory>
          rowKey="id"
          dataSource={inventories.data.data}
          loading={inventories.isFetching}
          pagination={{
            current: inventories.data.meta.page,
            pageSize: inventories.data.meta.limit,
            total: inventories.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Numéro',
              dataIndex: 'number',
              width: 180,
              render: (value: string, row) => (
                <Link to={`/inventories/${row.id}`}>{value}</Link>
              ),
            },
            { title: 'Site', dataIndex: ['site', 'code'], width: 80 },
            {
              title: 'Comptage',
              key: 'progress',
              width: 220,
              render: (_, row) => (
                <Progress
                  percent={
                    row.lineCount === 0
                      ? 0
                      : Math.round((row.countedCount / row.lineCount) * 100)
                  }
                  size="small"
                  format={() => `${row.countedCount}/${row.lineCount}`}
                />
              ),
            },
            {
              title: 'Écarts',
              dataIndex: 'gapCount',
              align: 'right',
              width: 100,
              render: (value: number) =>
                value > 0 ? <Tag color="warning">{value}</Tag> : value,
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              width: 180,
              render: (value: Inventory['status']) => (
                <InventoryStatusTag status={value} />
              ),
            },
            {
              title: 'Ouvert le',
              dataIndex: 'createdAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
          ]}
        />
      </Card>

      <Modal
        open={startOpen}
        title="Ouvrir un inventaire"
        okText="Ouvrir le comptage"
        cancelText="Annuler"
        okButtonProps={{ loading: start.isPending }}
        onCancel={() => setStartOpen(false)}
        onOk={() =>
          start.mutate(
            {
              ...(scope.length > 0
                ? { variantIds: scope.map((variant) => variant.id) }
                : {}),
              ...(note.trim() ? { note: note.trim() } : {}),
            },
            {
              onSuccess: (inventory) => {
                setStartOpen(false);
                setScope([]);
                setNote('');
                void navigate(`/inventories/${inventory.id}`);
              },
            },
          )
        }
      >
        <Typography.Paragraph type="secondary">
          Le stock théorique est figé à l’ouverture. Un seul inventaire peut
          être ouvert à la fois sur {currentSite?.name ?? 'ce site'}.
        </Typography.Paragraph>

        <Typography.Text strong>Portée</Typography.Text>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
          {scope.length === 0
            ? 'Tout le site sera compté. Ajoutez des articles pour un inventaire tournant.'
            : `${scope.length} article(s) seront comptés.`}
        </Typography.Paragraph>

        <VariantPicker
          exclude={scope.map((variant) => variant.id)}
          placeholder="Limiter à certains articles (facultatif)"
          onPick={(variant) => setScope((previous) => [...previous, variant])}
        />

        {scope.length > 0 && (
          <Flex gap={6} wrap style={{ marginTop: 12 }}>
            {scope.map((variant) => (
              <Tag
                key={variant.id}
                closable
                onClose={() =>
                  setScope((previous) =>
                    previous.filter((item) => item.id !== variant.id),
                  )
                }
              >
                {variant.sku}
              </Tag>
            ))}
          </Flex>
        )}

        <Input.TextArea
          rows={2}
          maxLength={1000}
          placeholder="Note (facultatif)"
          style={{ marginTop: 16 }}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Modal>
    </>
  );
}

export default InventoriesPage;
