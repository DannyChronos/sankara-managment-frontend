import { Alert, Col, Row } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { usePermission } from '../../../shared/auth/usePermission';
import { useEinvoices } from '../../einvoices/hooks';
import { useEmecefStatus, useFiscalProfile } from '../hooks';
import { FiscalProfileForm } from '../components/FiscalProfileForm';
import { EmecefTokenCard } from '../components/EmecefTokenCard';
import { InvoiceModeCard } from '../components/InvoiceModeCard';
import { EnvironmentCard } from '../components/EnvironmentCard';
import { EmecefStatusCard } from '../components/EmecefStatusCard';

/**
 * Paramètres fiscaux (§4). Les cartes suivent l'ordre dans lequel on les
 * remplit : identité, puis jeton, puis mode. Chacune reste inerte tant que la
 * précédente n'est pas faite — c'est aussi ce que le serveur impose, l'écran
 * ne fait que l'annoncer avant le refus.
 */
export function FiscalSettingsPage() {
  const profile = useFiscalProfile();
  const status = useEmecefStatus();
  const { can } = usePermission();

  // Le retour en test est interdit dès qu'une facture réelle est partie : on
  // interroge le journal plutôt que de laisser l'utilisateur se heurter au
  // refus du serveur.
  const realInvoices = useEinvoices(
    can('einvoice:read')
      ? { env: 'PROD', status: 'CONFIRMED', limit: 1 }
      : { limit: 1 },
  );
  const hasRealInvoices =
    can('einvoice:read') && (realInvoices.data?.meta.total ?? 0) > 0;

  if (profile.isPending) return <PageSkeleton />;
  if (profile.isError) {
    return (
      <ErrorState
        error={profile.error}
        onRetry={() => void profile.refetch()}
      />
    );
  }

  const data = profile.data;

  return (
    <>
      <PageHeader
        title="Fiscalité"
        subtitle="Facture normalisée e-MECeF (DGI Bénin)"
        breadcrumb={[
          { title: 'Paramètres', href: '/settings' },
          { title: 'Fiscalité' },
        ]}
      />

      {!data && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Aucun profil fiscal enregistré"
          description="Renseignez l’identité fiscale de l’entreprise pour commencer : c’est elle qui figurera sur les factures."
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <FiscalProfileForm profile={data} />
        </Col>
        <Col xs={24} lg={10}>
          <EmecefStatusCard />
        </Col>

        <Col xs={24} lg={14}>
          <EmecefTokenCard
            profile={data}
            queuePaused={status.data?.queuePaused}
            disabled={!data}
          />
        </Col>
        <Col xs={24} lg={10}>
          <InvoiceModeCard profile={data} />
        </Col>

        <Col xs={24} lg={10}>
          <EnvironmentCard profile={data} hasRealInvoices={hasRealInvoices} />
        </Col>
      </Row>
    </>
  );
}

export default FiscalSettingsPage;
