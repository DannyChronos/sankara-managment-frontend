import { useState } from 'react';
import { Button, Card, Flex, Radio, Tooltip, Typography } from 'antd';
import { formatDate } from '../../../shared/utils/format';
import { useSetInvoiceMode } from '../hooks';
import { LegalWarningModal } from './LegalWarningModal';
import type { FiscalProfile, InvoiceMode } from '../../../shared/api/types';

/**
 * Mode d'émission des factures normalisées.
 *
 * La carte reste inerte tant que le jeton n'a pas été accepté par la DGI :
 * activer la facturation sans jeton valide ne produirait que des factures en
 * échec, et le caissier en subirait l'attente à chaque vente.
 */
export function InvoiceModeCard({
  profile,
}: {
  profile: FiscalProfile | null;
}) {
  const verified = Boolean(profile?.verifiedAt);
  // Le mode affiché est celui du serveur tant que l'utilisateur n'a rien
  // choisi d'autre. Dérivé plutôt que recopié dans un effet : après
  // l'enregistrement, `picked` est remis à zéro et la carte suit de nouveau
  // le serveur, sans rendu en cascade.
  const [picked, setPicked] = useState<InvoiceMode | null>(null);
  const saved = profile?.invoiceMode ?? 'DISABLED';
  const mode = picked ?? saved;
  const [warningOpen, setWarningOpen] = useState(false);
  const save = useSetInvoiceMode();

  const submit = () => {
    if (mode === 'ON_DEMAND' && saved !== 'ON_DEMAND') {
      setWarningOpen(true);
      return;
    }
    save.mutate({ mode }, { onSuccess: () => setPicked(null) });
  };

  const card = (
    <Card
      title="Mode de facturation"
      extra={
        <Button
          type="primary"
          loading={save.isPending}
          disabled={!verified || mode === saved}
          onClick={submit}
        >
          Enregistrer
        </Button>
      }
    >
      <Flex vertical gap={12}>
        <Radio.Group
          value={mode}
          disabled={!verified || save.isPending}
          onChange={(event) => setPicked(event.target.value as InvoiceMode)}
        >
          <Flex vertical gap={8}>
            <Radio value="DISABLED">
              Désactivée
              <Typography.Text type="secondary" style={{ display: 'block' }}>
                Aucune facture n’est envoyée à la DGI ; les ventes impriment un
                reçu simple.
              </Typography.Text>
            </Radio>
            <Radio value="ALWAYS">
              Systématique — recommandé
              <Typography.Text type="secondary" style={{ display: 'block' }}>
                Chaque vente produit une facture normalisée, sans que le
                caissier ait à y penser.
              </Typography.Text>
            </Radio>
            <Radio value="ON_DEMAND">
              À la demande du client
              <Typography.Text type="secondary" style={{ display: 'block' }}>
                Le caissier coche une case en caisse. Ce choix engage
                l’entreprise.
              </Typography.Text>
            </Radio>
          </Flex>
        </Radio.Group>

        {profile?.invoiceMode === 'ON_DEMAND' && profile.onDemandAckAt && (
          <Typography.Text type="secondary">
            Mode « à la demande » choisi le {formatDate(profile.onDemandAckAt)}.
          </Typography.Text>
        )}
      </Flex>

      <LegalWarningModal
        open={warningOpen}
        pending={save.isPending}
        onCancel={() => {
          setWarningOpen(false);
          setPicked(null);
        }}
        onConfirm={() =>
          save.mutate(
            { mode: 'ON_DEMAND', acknowledgeLegalWarning: true },
            {
              onSuccess: () => {
                setWarningOpen(false);
                setPicked(null);
              },
            },
          )
        }
      />
    </Card>
  );

  return verified ? (
    card
  ) : (
    <Tooltip title="Enregistrez et testez le jeton e-MECeF avant d’activer la facture normalisée.">
      {card}
    </Tooltip>
  );
}
