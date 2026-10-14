import { useState } from 'react';
import { Card, DatePicker, Flex, Select, Table, Tag, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  VariantPicker,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { usePermission } from '../../../shared/auth/usePermission';
import { useUsers } from '../../users/hooks';
import { formatDateTime } from '../../../shared/utils/format';
import { useStockMovements } from '../hooks';
import { MovementTypeTag } from '../components/MovementTypeTag';
import { MOVEMENT_OPTIONS } from '../labels';
import type { StockMovementView } from '../../../shared/api/types';

/**
 * Historique du registre (F-18). Lecture seule : un mouvement validé ne se
 * modifie ni ne s'efface, une erreur se corrige par un mouvement inverse.
 */
export function StockMovementsPage() {
  const { siteId, currentSite } = useAuth();
  const { can } = usePermission();
  const [type, setType] = useState<string | undefined>();
  const [variant, setVariant] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [performedById, setPerformedById] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);

  // La liste des comptes n'est pas ouverte à tout le monde : un caissier lit
  // le registre sans pouvoir lire l'annuaire. Le filtre ne lui est pas
  // proposé plutôt que de lui montrer un champ qui échouerait.
  const peutFiltrerParUtilisateur = can('users:read');
  const users = useUsers({ limit: 100 }, peutFiltrerParUtilisateur);

  const movements = useStockMovements({
    page,
    limit: 20,
    ...(siteId ? { siteId } : {}),
    ...(type ? { type } : {}),
    ...(variant ? { variantId: variant.id } : {}),
    ...(performedById ? { performedById } : {}),
    ...(range?.[0] ? { from: range[0].format('YYYY-MM-DD') } : {}),
    ...(range?.[1] ? { to: range[1].format('YYYY-MM-DD') } : {}),
  });

  if (movements.isPending) return <PageSkeleton />;
  if (movements.isError) {
    return (
      <ErrorState
        error={movements.error}
        onRetry={() => void movements.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Mouvements de stock"
        subtitle={`${movements.data.meta.total} mouvement(s) · ${currentSite?.name ?? 'tous les sites'}`}
      />

      <Card>
        <Typography.Paragraph type="secondary">
          Le registre est en insertion seule : chaque ligne est datée, signée et
          motivée. Une erreur se corrige par un mouvement inverse, jamais par
          une réécriture.
        </Typography.Paragraph>

        <Flex gap={12} wrap align="center" style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Tous les types"
            style={{ minWidth: 220 }}
            value={type}
            onChange={(value?: string) => {
              setType(value);
              setPage(1);
            }}
            options={MOVEMENT_OPTIONS}
          />

          {variant ? (
            <Tag
              color="geekblue"
              closable
              onClose={() => {
                setVariant(null);
                setPage(1);
              }}
            >
              {variant.label}
            </Tag>
          ) : (
            <div style={{ minWidth: 280, flex: '1 1 280px' }}>
              <VariantPicker
                placeholder="Filtrer sur un article : nom, SKU ou code-barres"
                onPick={(picked) => {
                  setVariant({
                    id: picked.id,
                    label: `${picked.sku} · ${picked.name}`,
                  });
                  setPage(1);
                }}
              />
            </div>
          )}

          {peutFiltrerParUtilisateur && (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Tous les utilisateurs"
              style={{ minWidth: 220 }}
              value={performedById}
              loading={users.isFetching}
              onChange={(value?: string) => {
                setPerformedById(value);
                setPage(1);
              }}
              options={(users.data?.data ?? []).map((item) => ({
                value: item.id,
                label: item.fullName,
              }))}
            />
          )}

          <DatePicker.RangePicker
            value={range}
            onChange={(values) => {
              setRange(values);
              setPage(1);
            }}
            format="DD/MM/YYYY"
          />
        </Flex>

        <Table<StockMovementView>
          rowKey="id"
          dataSource={movements.data.data}
          loading={movements.isFetching}
          pagination={{
            current: movements.data.meta.page,
            pageSize: movements.data.meta.limit,
            total: movements.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Date',
              dataIndex: 'occurredAt',
              width: 150,
              render: (value: string) => formatDateTime(value),
            },
            { title: 'Site', dataIndex: 'siteCode', width: 80 },
            {
              title: 'Article',
              key: 'article',
              render: (_, row) => (
                <>
                  <div>{row.productName}</div>
                  <small style={{ color: '#8a98a8' }}>
                    {row.sku} · {row.variantName}
                  </small>
                </>
              ),
            },
            {
              title: 'Type',
              dataIndex: 'type',
              width: 180,
              render: (value: string) => <MovementTypeTag type={value} />,
            },
            {
              title: 'Quantité',
              dataIndex: 'quantity',
              align: 'right',
              width: 110,
              render: (value: number, row) => (
                <strong
                  style={{
                    color:
                      row.direction === 'IN'
                        ? 'var(--sankara-success)'
                        : 'var(--sankara-danger)',
                  }}
                >
                  {row.direction === 'IN' ? '+' : '−'}
                  {value}
                </strong>
              ),
            },
            {
              title: 'Solde après',
              dataIndex: 'balanceAfter',
              align: 'right',
              width: 120,
            },
            {
              title: 'Motif',
              dataIndex: 'reason',
              render: (value: string | null) => value ?? '—',
            },
            {
              title: 'Par',
              dataIndex: 'performedBy',
              width: 170,
              render: (value: string | null) =>
                value ?? <span style={{ color: '#8a98a8' }}>système</span>,
            },
          ]}
        />
      </Card>
    </>
  );
}

export default StockMovementsPage;
