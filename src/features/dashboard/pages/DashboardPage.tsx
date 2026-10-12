import { Card, Col, Row, Statistic, Typography } from 'antd';
import { PageHeader } from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatXof } from '../../../shared/utils/format';

/**
 * Squelette du tableau de bord (FRONTEND.md §8) : les cartes seront branchées
 * sur `GET /dashboard?siteId=&period=` dès que l'endpoint existe.
 */
export function DashboardPage() {
  const { currentSite } = useAuth();

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle={currentSite ? currentSite.name : undefined}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Chiffre d’affaires du jour"
              value={formatXof(0)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Ventes du jour" value={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Sessions à vérifier" value={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Articles sous le seuil" value={0} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">
          Les indicateurs, la courbe des ventes sur 30 jours et le top 10 des
          variantes seront branchés sur l’API du tableau de bord.
        </Typography.Text>
      </Card>
    </>
  );
}

export default DashboardPage;
