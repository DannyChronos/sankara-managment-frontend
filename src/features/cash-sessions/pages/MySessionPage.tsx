import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Descriptions, Row, Statistic } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { toApiError } from '../../../shared/api/errors';
import { formatDateTime, formatXof } from '../../../shared/utils/format';
import { useCurrentSession } from '../hooks';
import { TotalsByMethodTable } from '../components/TotalsByMethodTable';
import { SessionStatusTag } from '../components/SessionStatusTag';

/** Ma caisse : l'état de la journée en temps réel (FRONTEND.md §10.1). */
export function MySessionPage() {
  const navigate = useNavigate();
  const {
    data: session,
    isPending,
    isError,
    error,
    refetch,
  } = useCurrentSession();

  if (isPending) return <PageSkeleton />;

  if (isError) {
    const apiError = toApiError(error);

    if (apiError.code === 'NO_OPEN_SESSION') {
      return (
        <>
          <PageHeader title="Ma caisse" />
          <Card>
            <Alert
              type="info"
              showIcon
              message="Aucune caisse ouverte"
              description="Ouvrez votre caisse depuis le point de vente pour commencer à vendre."
            />
            <Button
              type="primary"
              icon={<ShopOutlined />}
              size="large"
              style={{ marginTop: 16 }}
              onClick={() => void navigate('/pos')}
            >
              Aller au point de vente
            </Button>
          </Card>
        </>
      );
    }

    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const salesTotal = session.totals.reduce(
    (total, row) => total + row.salesIn,
    0,
  );
  const refundsTotal = session.totals.reduce(
    (total, row) => total + row.refundsOut,
    0,
  );

  return (
    <>
      <PageHeader
        title={`Ma caisse · ${session.number}`}
        subtitle={session.site.name}
        actions={
          <>
            <Link to="/pos">
              <Button>Retour au point de vente</Button>
            </Link>
            <Link to={`/cash-sessions/${session.id}/close`}>
              <Button type="primary">Clôturer ma journée</Button>
            </Link>
          </>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Fond de caisse"
              value={formatXof(session.openingFloat)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Encaissements" value={formatXof(salesTotal)} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Recette attendue"
              value={formatXof(session.expectedTotal)}
              valueStyle={{ color: 'var(--sankara-navy)', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Détail par mode de paiement" style={{ marginTop: 16 }}>
        <TotalsByMethodTable totals={session.totals} />
      </Card>

      <Card title="Session" style={{ marginTop: 16 }}>
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: 'status',
              label: 'Statut',
              children: <SessionStatusTag status={session.status} />,
            },
            {
              key: 'cashier',
              label: 'Caissier',
              children: session.cashier.fullName,
            },
            {
              key: 'opened',
              label: 'Ouverte le',
              children: formatDateTime(session.openedAt),
            },
            {
              key: 'refunds',
              label: 'Remboursements',
              children: <Money value={-refundsTotal} signed />,
            },
          ]}
        />
      </Card>
    </>
  );
}

export default MySessionPage;
