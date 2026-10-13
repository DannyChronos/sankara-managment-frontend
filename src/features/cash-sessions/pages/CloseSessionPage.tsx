import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Flex, Space, Typography } from 'antd';
import {
  ErrorState,
  Money,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { PdfButton } from '../../../shared/components/PdfButton';
import type { PaymentMethod } from '../../../shared/api/types';
import { useCloseSession, useSession } from '../hooks';
import { TotalsByMethodTable } from '../components/TotalsByMethodTable';
import { CashCountHelper } from '../components/CashCountHelper';

/**
 * Clôture (FRONTEND.md §10.2) : l'attendu est en lecture seule, le caissier
 * saisit ce qu'il a compté. Une aide au comptage par coupures évite les erreurs
 * d'addition.
 */
export function CloseSessionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: session, isPending, isError, error, refetch } = useSession(id);
  const close = useCloseSession(id);
  const [declared, setDeclared] = useState<Record<string, number>>({});
  const [closed, setClosed] = useState(false);

  const gap = useMemo(() => {
    if (!session) return 0;
    return session.totals.reduce(
      (total, row) =>
        total + ((declared[row.method] ?? 0) - row.expectedAmount),
      0,
    );
  }, [session, declared]);

  if (isPending) return <PageSkeleton />;
  if (isError)
    return <ErrorState error={error} onRetry={() => void refetch()} />;

  if (closed || session.status !== 'OPEN') {
    return (
      <>
        <PageHeader
          title={`Caisse ${session.number}`}
          subtitle={session.site.name}
        />
        <Card>
          <Alert
            type="success"
            showIcon
            message="Caisse clôturée"
            description="La session est verrouillée et attend sa vérification. Aucune vente ne peut plus y être ajoutée."
          />
          <Space style={{ marginTop: 16 }}>
            <PdfButton
              path={`/cash-sessions/${session.id}/report`}
              fileName={`${session.number}.pdf`}
            >
              Rapport de session
            </PdfButton>
            <Button onClick={() => void navigate('/dashboard')}>
              Terminer
            </Button>
          </Space>
        </Card>
      </>
    );
  }

  const submit = () => {
    close.mutate(
      {
        declared: session.totals.map((row) => ({
          method: row.method,
          amount: declared[row.method] ?? 0,
        })),
      },
      { onSuccess: () => setClosed(true) },
    );
  };

  return (
    <>
      <PageHeader
        title={`Clôturer la caisse ${session.number}`}
        subtitle={session.site.name}
      />

      <Card title="Montants comptés">
        <TotalsByMethodTable
          totals={session.totals}
          liveGap
          editable={{
            label: 'Compté',
            values: declared,
            onChange: (method: PaymentMethod, amount) =>
              setDeclared((current) => ({ ...current, [method]: amount })),
          }}
        />
      </Card>

      <Card title="Aide au comptage des espèces" style={{ marginTop: 16 }}>
        <CashCountHelper
          onTotal={(total) =>
            setDeclared((current) => ({ ...current, CASH: total }))
          }
        />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Flex vertical gap={12}>
          {gap !== 0 && (
            <Alert
              type="warning"
              showIcon
              message={
                <>
                  Écart constaté : <Money value={gap} signed strong />. Le
                  vérificateur devra le justifier.
                </>
              }
            />
          )}

          <Typography.Text type="secondary">
            Après clôture, aucune vente ne pourra être ajoutée à cette session.
          </Typography.Text>

          <Flex gap={8}>
            <Button
              type="primary"
              size="large"
              loading={close.isPending}
              onClick={submit}
            >
              Clôturer ma journée
            </Button>
            <Button size="large" onClick={() => void navigate(-1)}>
              Annuler
            </Button>
          </Flex>
        </Flex>
      </Card>
    </>
  );
}

export default CloseSessionPage;
