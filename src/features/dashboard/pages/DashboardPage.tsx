import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Col, Empty, Radio, Row, Table, Tag } from 'antd';
import {
  BarChart,
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { usePermission } from '../../../shared/auth/usePermission';
import { formatXof } from '../../../shared/utils/format';
import { useDashboard } from '../hooks';
import { StatCard } from '../components/StatCard';

type Period = 'day' | 'week' | 'month';

const PERIOD_LABEL: Record<Period, string> = {
  day: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
};

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('day');
  const { currentSite } = useAuth();
  const { can } = usePermission();
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = useDashboard(period);

  if (isPending) return <PageSkeleton />;
  if (isError)
    return <ErrorState error={error} onRetry={() => void refetch()} />;

  const trend = data.salesTrend.map((point) => ({
    label: point.day.slice(5),
    value: point.revenue,
  }));

  // Un chiffre n'est utile que s'il mène à l'écran qui l'explique — encore
  // faut-il que l'utilisateur ait le droit d'y entrer.
  const stockLink = can('stock:read') ? '/stock?lowOnly=true' : undefined;
  const sessionsLink = can('cash-sessions:verify')
    ? '/cash-sessions/to-verify'
    : can('cash-sessions:open')
      ? '/cash-sessions'
      : undefined;
  const variantLink = (variantId: string) =>
    can('stock:read') ? `/stock?variantId=${variantId}` : undefined;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle={currentSite?.name}
        actions={
          <Radio.Group
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: 'Jour', value: 'day' },
              { label: 'Semaine', value: 'week' },
              { label: 'Mois', value: 'month' },
            ]}
          />
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title={`Chiffre d'affaires · ${PERIOD_LABEL[period]}`}
            value={formatXof(data.revenue.selected.revenue)}
            hint={`Mois en cours : ${formatXof(data.revenue.month.revenue)}`}
            to="/reports"
            linkLabel="Rapport des ventes"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Ventes"
            value={data.revenue.selected.salesCount}
            hint={`Panier moyen ${formatXof(data.revenue.selected.averageBasket)}`}
            to={can('sales:read') ? '/sales' : undefined}
            linkLabel="Historique des ventes"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Caisses à vérifier"
            value={data.sessionsToVerify.count}
            danger={data.sessionsToVerify.count > 0}
            hint={
              data.gaps.verifiedCount > 0
                ? `${data.gaps.verifiedCount} vérifiée(s) ce mois, ${data.gaps.nonConformCount} non conforme(s)`
                : 'Aucune vérification ce mois'
            }
            to={sessionsLink}
            linkLabel={
              can('cash-sessions:verify') ? 'Vérifier' : 'Voir les sessions'
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Articles sous le seuil"
            value={data.lowStock.count}
            danger={data.lowStock.count > 0}
            hint={
              data.gaps.gapCount > 0
                ? `${data.gaps.gapCount} écart(s) de caisse ce mois : ${formatXof(data.gaps.gapTotal)}`
                : 'Aucun écart de caisse ce mois'
            }
            to={stockLink}
            linkLabel="État du stock"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={14}>
          <Card
            title="Ventes des 30 derniers jours"
            extra={<Link to="/reports">Rapport détaillé</Link>}
          >
            <BarChart data={trend} height={260} />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="Top ventes" styles={{ body: { padding: 0 } }}>
            {data.topVariants.length === 0 ? (
              <Empty
                description="Aucune vente sur la période"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 24 }}
              />
            ) : (
              <Table
                size="small"
                pagination={false}
                rowKey="variantId"
                dataSource={data.topVariants}
                // Ce qui se vend le mieux appelle une question : en reste-t-il ?
                onRow={(row) => ({
                  style: variantLink(row.variantId)
                    ? { cursor: 'pointer' }
                    : undefined,
                  onClick: () => {
                    const target = variantLink(row.variantId);
                    if (target) void navigate(target);
                  },
                })}
                columns={[
                  {
                    title: 'Article',
                    dataIndex: 'name',
                    render: (_, row) => (
                      <>
                        <div>{row.productName}</div>
                        <small style={{ color: '#8a98a8' }}>{row.name}</small>
                      </>
                    ),
                  },
                  {
                    title: 'Qté',
                    dataIndex: 'quantity',
                    align: 'right',
                    width: 70,
                  },
                  {
                    title: 'Montant',
                    dataIndex: 'revenue',
                    align: 'right',
                    width: 130,
                    render: (value: number) => <Money value={value} />,
                  },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      {data.lowStock.items.length > 0 && (
        <Card
          title={`Stock bas (${data.lowStock.count})`}
          style={{ marginTop: 16 }}
          styles={{ body: { padding: 0 } }}
          extra={
            stockLink &&
            data.lowStock.count > data.lowStock.items.length && (
              <Link to={stockLink}>Voir les {data.lowStock.count}</Link>
            )
          }
        >
          <Table
            size="small"
            pagination={false}
            rowKey="stockLevelId"
            dataSource={data.lowStock.items}
            onRow={(row) => ({
              style: variantLink(row.variantId)
                ? { cursor: 'pointer' }
                : undefined,
              onClick: () => {
                const target = variantLink(row.variantId);
                if (target) void navigate(target);
              },
            })}
            columns={[
              { title: 'Site', dataIndex: 'siteCode', width: 80 },
              { title: 'SKU', dataIndex: 'sku', width: 190 },
              {
                title: 'Article',
                dataIndex: 'name',
                render: (_, row) => `${row.productName} — ${row.name}`,
              },
              {
                title: 'Disponible',
                dataIndex: 'available',
                align: 'right',
                width: 110,
                render: (value: number, row) => (
                  <Tag color={value <= 0 ? 'error' : 'warning'}>
                    {value} / seuil {row.minThreshold}
                  </Tag>
                ),
              },
            ]}
          />
        </Card>
      )}
    </>
  );
}

export default DashboardPage;
