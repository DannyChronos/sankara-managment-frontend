import { useState } from 'react';
import { Alert, Button, Card, Flex, Input, Modal, Tag, Typography } from 'antd';
import { useSetEnvironment } from '../hooks';
import type { FiscalProfile } from '../../../shared/api/types';

/**
 * Bascule entre la plateforme de test de la DGI et la production.
 *
 * Passer en production est un acte comptable : à partir de là, chaque facture
 * émise est réelle et opposable. D'où la confirmation tapée — un clic
 * distrait ne doit pas y suffire.
 */
export function EnvironmentCard({
  profile,
  hasRealInvoices,
}: {
  profile: FiscalProfile | null;
  /** Des factures confirmées en production interdisent le retour en test. */
  hasRealInvoices?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const save = useSetEnvironment();

  const env = profile?.emecefEnv ?? 'TEST';

  return (
    <Card title="Environnement">
      <Flex vertical gap={12}>
        <div>
          <Typography.Text type="secondary">Actuel : </Typography.Text>
          <Tag color={env === 'PROD' ? 'green' : 'orange'}>
            {env === 'PROD' ? 'Production' : 'Test'}
          </Tag>
        </div>

        {env === 'TEST' ? (
          <>
            <Alert
              type="warning"
              showIcon
              message="Les factures émises n’ont aucune valeur fiscale."
              description="Tant que l’environnement est « Test », la DGI ne les enregistre pas."
            />
            <Button danger onClick={() => setOpen(true)}>
              Passer en production
            </Button>
          </>
        ) : (
          <>
            <Alert
              type="success"
              showIcon
              message="Les factures émises sont réelles et opposables."
            />
            <Button
              loading={save.isPending}
              disabled={hasRealInvoices}
              onClick={() => save.mutate({ env: 'TEST' })}
            >
              Revenir en test
            </Button>
            {hasRealInvoices && (
              <Typography.Text type="secondary">
                Des factures réelles ont été émises : le retour en mode test
                n’est plus possible.
              </Typography.Text>
            )}
          </>
        )}
      </Flex>

      <Modal
        open={open}
        title="Passer en production"
        okText="Passer en production"
        cancelText="Annuler"
        okButtonProps={{
          danger: true,
          loading: save.isPending,
          disabled: typed !== 'PRODUCTION',
        }}
        onCancel={() => {
          setOpen(false);
          setTyped('');
        }}
        onOk={() =>
          save.mutate(
            { env: 'PROD', confirm: 'PRODUCTION' },
            {
              onSuccess: () => {
                setOpen(false);
                setTyped('');
              },
            },
          )
        }
      >
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="À partir de maintenant, chaque facture émise est réelle."
          description="Elle est enregistrée par la DGI et ne peut être annulée que par un avoir."
        />
        <Typography.Paragraph>
          Tapez <Typography.Text code>PRODUCTION</Typography.Text> pour
          confirmer.
        </Typography.Paragraph>
        <Input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="PRODUCTION"
        />
      </Modal>
    </Card>
  );
}
