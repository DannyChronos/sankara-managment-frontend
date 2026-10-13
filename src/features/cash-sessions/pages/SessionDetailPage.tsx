import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Descriptions, Flex } from 'antd';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
  PdfButton,
  PermissionGate,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import { sessionReportUrl } from '../api';
import { useSession, useSessionEvents } from '../hooks';
import { SessionStatusTag } from '../components/SessionStatusTag';
import { SessionTimeline } from '../components/SessionTimeline';
import { TotalsByMethodTable } from '../components/TotalsByMethodTable';
import { GapCell } from '../components/GapCell';

/**
 * Fiche d'une session : ce qui était attendu, ce qui a été déclaré puis reçu,
 * et toute la suite des passages. Les actions mènent aux écrans dédiés —
 * clôturer, vérifier — plutôt que de les dupliquer ici.
 */
export function SessionDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const session = useSession(id);
  const events = useSessionEvents(id);

  if (session.isPending) return <PageSkeleton />;
  if (session.isError) {
    return (
      <ErrorState
        error={session.error}
        onRetry={() => void session.refetch()}
      />
    );
  }

  const data = session.data;
  const isMine = data.cashier.id === user?.id;
  const open = data.status === 'OPEN';
  const awaitingCheck = data.status === 'CLOSED';
  const nonConform = data.status === 'NON_CONFORM';

  return (
    <>
      <PageHeader
        title={data.number}
        subtitle={`${data.site.name} · ${data.cashier.fullName}`}
        breadcrumb={[
          { title: 'Caisse' },
          { title: 'Sessions', href: '/cash-sessions' },
          { title: data.number },
        ]}
        actions={
          <>
            <PdfButton
              path={sessionReportUrl(data.id)}
              fileName={`${data.number}.pdf`}
            >
              Rapport
            </PdfButton>
            {open && isMine && (
              <PermissionGate perm="cash-sessions:close">
                <Link to={`/cash-sessions/${data.id}/close`}>
                  <Button type="primary">Clôturer ma caisse</Button>
                </Link>
              </PermissionGate>
            )}
            {(awaitingCheck || nonConform) && !isMine && (
              <PermissionGate perm="cash-sessions:verify">
                <Link to={`/cash-sessions/${data.id}/verify`}>
                  <Button type="primary">
                    {nonConform ? 'Régulariser' : 'Vérifier'}
                  </Button>
                </Link>
              </PermissionGate>
            )}
          </>
        }
      />

      {open && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Caisse encore ouverte"
          description="Les totaux bougent à chaque vente : ils ne sont définitifs qu’à la clôture."
        />
      )}
      {data.forceClosed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Clôturée automatiquement"
          description="La caisse est restée ouverte au-delà de l’heure de clôture : aucun montant n’a été déclaré par le caissier."
        />
      )}
      {nonConform && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Session non conforme"
          description="L’écart dépasse la tolérance. Une régularisation la renvoie en vérification."
        />
      )}
      {awaitingCheck && isMine && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="En attente de vérification"
          description="Un autre utilisateur doit la vérifier : on ne vérifie pas sa propre caisse (RG-15)."
        />
      )}

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 4 }}
          items={[
            {
              key: 'status',
              label: 'Statut',
              children: (
                <SessionStatusTag
                  status={data.status}
                  forceClosed={data.forceClosed}
                />
              ),
            },
            {
              key: 'openedAt',
              label: 'Ouverte le',
              children: formatDateTime(data.openedAt),
            },
            {
              key: 'closedAt',
              label: 'Clôturée le',
              children: data.closedAt ? formatDateTime(data.closedAt) : '—',
            },
            {
              key: 'float',
              label: 'Fond de caisse',
              children: <Money value={data.openingFloat} />,
            },
            {
              key: 'expected',
              label: 'Attendu',
              children: <Money value={data.expectedTotal} strong />,
            },
            {
              key: 'declared',
              label: 'Déclaré',
              children:
                data.declaredTotal === null ? (
                  '—'
                ) : (
                  <Money value={data.declaredTotal} />
                ),
            },
            {
              key: 'received',
              label: 'Reçu',
              children:
                data.receivedTotal === null ? (
                  '—'
                ) : (
                  <Money value={data.receivedTotal} />
                ),
            },
            {
              key: 'gap',
              label: 'Écart',
              children: <GapCell value={data.gapTotal} />,
            },
          ]}
        />
      </Card>

      <Flex gap={16} wrap align="start" style={{ marginTop: 16 }}>
        <Card title="Par mode de paiement" style={{ flex: '2 1 520px' }}>
          <TotalsByMethodTable totals={data.totals} />
        </Card>

        <Card
          title="Historique"
          style={{ flex: '1 1 320px' }}
          loading={events.isPending}
        >
          {events.isError ? (
            <ErrorState
              error={events.error}
              onRetry={() => void events.refetch()}
            />
          ) : (
            <SessionTimeline events={events.data ?? []} />
          )}
        </Card>
      </Flex>
    </>
  );
}

export default SessionDetailPage;
