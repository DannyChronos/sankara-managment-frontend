import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Card,
  Col,
  Empty,
  Radio,
  Row,
  Statistic,
  Table,
  Tag,
} from 'antd';
import {
  BarChart,
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatXof } from '../../../shared/utils/format';
import { useDashboard } from '../hooks';

type Period = 'day' | 'week' | 'month';

const PERIOD_LABEL: Record<Period, string> = {
  day: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
};

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('day');
  const { currentSite } = useAuth();
  const { data, isPending, isError, error, refetch } = useDashboard(period);

  if (isPending) return <PageSkeleton />;
  if (isError)
    return <ErrorState error={error} onRetry={() => void refetch()} />;

  const trend = data.salesTrend.map((point) => ({
    label: point.day.slice(5),
    value: point.revenue,
  }));

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
          <Card>
            <Statistic
              title={`Chiffre d'affaires · ${PERIOD_LABEL[period]}`}
              value={formatXof(data.revenue.selected.revenue)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Ventes"
              value={data.revenue.selected.salesCount}
              suffix={
                <span style={{ fontSize: 13, color: '#8a98a8' }}>
                  panier {formatXof(data.revenue.selected.averageBasket)}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Caisses à vérifier"
              value={data.sessionsToVerify.count}
            />
            {data.sessionsToVerify.count > 0 && (
              <Link to="/cash-sessions/to-verify">Ouvrir la liste</Link>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Articles sous le seuil"
              value={data.lowStock.count}
              valueStyle={
                data.lowStock.count > 0
                  ? { color: 'var(--sankara-danger)' }
                  : undefined
              }
            />
          </Card>
        </Col>
      </Row>

      {data.gaps.gapCount > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message={`${data.gaps.gapCount} écart(s) de caisse ce mois, pour ${formatXof(data.gaps.gapTotal)}.`}
          action={<Link to="/cash-sessions">Voir les sessions</Link>}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={14}>
          <Card title="Ventes des 30 derniers jours">
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
          title="Stock bas"
          style={{ marginTop: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            size="small"
            pagination={false}
            rowKey="stockLevelId"
            dataSource={data.lowStock.items}
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
