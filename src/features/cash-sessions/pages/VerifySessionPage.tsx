import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Space,
  Tabs,
  Timeline,
  Typography,
} from 'antd';
import {
  ErrorState,
  Money,
  MoneyInput,
  PageHeader,
  PageSkeleton,
  PdfButton,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import type { PaymentMethod } from '../../../shared/api/types';
import {
  useRegularizeSession,
  useSession,
  useSessionEvents,
  useVerifySession,
} from '../hooks';
import { TotalsByMethodTable } from '../components/TotalsByMethodTable';
import { SessionStatusTag } from '../components/SessionStatusTag';

const EVENT_LABEL: Record<string, string> = {
  OPENED: 'Caisse ouverte',
  CLOSED: 'Caisse clôturée',
  FORCE_CLOSED: 'Clôture forcée',
  ASSIGNED: 'Vérificateur désigné',
  VERIFIED_CONFORM: 'Déclarée conforme',
  VERIFIED_NON_CONFORM: 'Déclarée non conforme',
  REGULARIZED: 'Régularisée',
  REVERIFIED: 'Vérifiée à nouveau',
};

/**
 * Écran de vérification (FRONTEND.md §10.4). L'écart se calcule pendant la
 * saisie ; le commentaire devient obligatoire dès qu'il y en a un.
 */
export function VerifySessionPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: session, isPending, isError, error, refetch } = useSession(id);
  const { data: events } = useSessionEvents(id);
  const verify = useVerifySession(id);
  const regularize = useRegularizeSession(id);

  const [received, setReceived] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [regularizedAmount, setRegularizedAmount] = useState<number | null>(
    null,
  );
  const [regularizeComment, setRegularizeComment] = useState('');

  const gap = useMemo(() => {
    if (!session) return 0;
    return session.totals.reduce(
      (total, row) =>
        total + ((received[row.method] ?? 0) - row.expectedAmount),
      0,
    );
  }, [session, received]);

  if (isPending) return <PageSkeleton />;
  if (isError)
    return <ErrorState error={error} onRetry={() => void refetch()} />;

  const isOwnSession = session.cashier.id === user?.id;
  const canVerify =
    !isOwnSession &&
    (session.status === 'CLOSED' || session.status === 'REGULARIZED');
  const hasGap = gap !== 0;

  return (
    <>
      <PageHeader
        title={`Vérifier la caisse ${session.number}`}
        subtitle={`${session.site.name} · ${session.cashier.fullName}`}
        actions={
          <PdfButton
            path={`/cash-sessions/${session.id}/report`}
            fileName={`${session.number}.pdf`}
          >
            Rapport
          </PdfButton>
        }
      />

      {isOwnSession && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Vous ne pouvez pas vérifier votre propre session."
          description="Un autre comptable ou un administrateur doit s’en charger."
        />
      )}

      <Card>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 3 }}
          items={[
            {
              key: 'status',
              label: 'Statut',
              children: (
                <SessionStatusTag
                  status={session.status}
                  forceClosed={session.forceClosed}
                />
              ),
            },
            {
              key: 'closed',
              label: 'Clôturée le',
              children: session.closedAt
                ? formatDateTime(session.closedAt)
                : '—',
            },
            {
              key: 'declared',
              label: 'Déclaré par le caissier',
              children:
                session.declaredTotal === null ? (
                  <Typography.Text type="warning">
                    aucun montant déclaré
                  </Typography.Text>
                ) : (
                  <Money value={session.declaredTotal} />
                ),
            },
          ]}
        />
      </Card>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'verify',
            label: 'Vérification',
            children: (
              <Card>
                <TotalsByMethodTable
                  totals={session.totals}
                  liveGap
                  editable={
                    canVerify
                      ? {
                          label: 'Reçu',
                          values: received,
                          onChange: (method: PaymentMethod, amount) =>
                            setReceived((current) => ({
                              ...current,
                              [method]: amount,
                            })),
                        }
                      : undefined
                  }
                />

                {canVerify && (
                  <Flex vertical gap={12} style={{ marginTop: 16 }}>
                    <Input.TextArea
                      rows={2}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder={
                        hasGap
                          ? 'Commentaire obligatoire : expliquez l’écart constaté'
                          : 'Commentaire (facultatif)'
                      }
                      status={hasGap && !comment ? 'warning' : undefined}
                    />

                    <Flex gap={8} wrap>
                      <Button
                        type="primary"
                        size="large"
                        disabled={hasGap}
                        loading={verify.isPending}
                        onClick={() =>
                          verify.mutate({
                            received: session.totals.map((row) => ({
                              method: row.method,
                              amount: received[row.method] ?? 0,
                            })),
                            comment: comment || undefined,
                          })
                        }
                      >
                        Déclarer conforme
                      </Button>

                      <Button
                        danger
                        size="large"
                        disabled={!hasGap || !comment}
                        loading={verify.isPending}
                        onClick={() =>
                          verify.mutate({
                            received: session.totals.map((row) => ({
                              method: row.method,
                              amount: received[row.method] ?? 0,
                            })),
                            comment,
                          })
                        }
                      >
                        Déclarer non conforme
                      </Button>

                      {hasGap && (
                        <Typography.Text
                          type="secondary"
                          style={{ alignSelf: 'center' }}
                        >
                          Écart de <Money value={gap} signed /> — « conforme »
                          est désactivé.
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                )}
              </Card>
            ),
          },
          {
            key: 'regularize',
            label: 'Régularisation',
            disabled: session.status !== 'NON_CONFORM',
            children: (
              <Card>
                <Typography.Paragraph type="secondary">
                  La session repassera ensuite par la vérification. Son
                  historique est conservé.
                </Typography.Paragraph>
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                  size="middle"
                >
                  <MoneyInput
                    value={regularizedAmount}
                    onChange={setRegularizedAmount}
                    placeholder="Montant reversé"
                  />
                  <Input.TextArea
                    rows={2}
                    value={regularizeComment}
                    onChange={(event) =>
                      setRegularizeComment(event.target.value)
                    }
                    placeholder="Commentaire obligatoire"
                  />
                  <Button
                    type="primary"
                    loading={regularize.isPending}
                    disabled={!regularizeComment || regularizedAmount === null}
                    onClick={() =>
                      regularize.mutate({
                        amount: regularizedAmount ?? 0,
                        comment: regularizeComment,
                      })
                    }
                  >
                    Enregistrer la régularisation
                  </Button>
                </Space>
              </Card>
            ),
          },
          {
            key: 'history',
            label: 'Historique',
            children: (
              <Card>
                <Timeline
                  items={(events ?? []).map((event) => ({
                    children: (
                      <>
                        <strong>{EVENT_LABEL[event.type] ?? event.type}</strong>
                        <div style={{ color: '#8a98a8', fontSize: 12 }}>
                          {formatDateTime(event.createdAt)}
                          {event.actorName ? ` · ${event.actorName}` : ''}
                          {event.attachmentId ? ' · justificatif joint' : ''}
                        </div>
                      </>
                    ),
                  }))}
                />
              </Card>
            ),
          },
        ]}
      />
    </>
  );
}

export default VerifySessionPage;
