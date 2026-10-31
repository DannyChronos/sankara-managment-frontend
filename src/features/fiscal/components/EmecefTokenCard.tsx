import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Flex,
  Input,
  Radio,
  Space,
  Typography,
} from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import { useSetEmecefToken, useTestEmecefToken } from '../hooks';
import type { EmecefEnv, FiscalProfile } from '../../../shared/api/types';

/** Un jeton qui expire bientôt doit être renouvelé avant la panne. */
const WARNING_DAYS = 15;

function daysUntil(date: string): number {
  return Math.floor((new Date(date).getTime() - Date.now()) / 86_400_000);
}

/**
 * Jeton e-MECeF délivré par la DGI pour l'IFU de l'entreprise.
 *
 * Le jeton n'est jamais réaffiché : seuls ses quatre derniers caractères
 * reviennent du serveur, de quoi vérifier qu'on parle du bon sans pouvoir le
 * recopier depuis l'écran.
 */
export function EmecefTokenCard({
  profile,
  queuePaused,
  disabled,
}: {
  profile: FiscalProfile | null;
  queuePaused?: boolean;
  disabled?: boolean;
}) {
  const [token, setToken] = useState('');
  const [env, setEnv] = useState<EmecefEnv>(profile?.emecefEnv ?? 'TEST');
  const [replacing, setReplacing] = useState(false);

  const save = useSetEmecefToken();
  const test = useTestEmecefToken();

  const stored = Boolean(profile?.tokenLast4);
  const verified = Boolean(profile?.verifiedAt);
  const expiresIn = profile?.tokenExpiresAt
    ? daysUntil(profile.tokenExpiresAt)
    : null;
  const showField = !stored || replacing;

  return (
    <Card title="Jeton e-MECeF">
      {disabled && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Complétez d’abord le profil fiscal"
          description="Le jeton est délivré pour un IFU : il ne peut pas être vérifié avant que l’IFU soit enregistré."
        />
      )}

      {queuePaused && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Envoi des factures suspendu"
          description="La DGI a refusé le jeton. Enregistrez un jeton valide puis relancez le test : la file reprendra d’elle-même."
        />
      )}

      {expiresIn !== null && expiresIn < 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Jeton expiré"
          description="Aucune facture ne peut plus être émise : renouvelez le jeton sur votre compte e-MECeF."
        />
      )}
      {expiresIn !== null && expiresIn >= 0 && expiresIn < WARNING_DAYS && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Le jeton expire dans ${expiresIn} jour(s)`}
          description="Renouvelez-le sur votre compte e-MECeF avant l’échéance."
        />
      )}

      <Flex vertical gap={12}>
        <div>
          <Typography.Text type="secondary">Environnement</Typography.Text>
          <div>
            <Radio.Group
              value={env}
              disabled={disabled || save.isPending}
              onChange={(event) => setEnv(event.target.value as EmecefEnv)}
              options={[
                { value: 'TEST', label: 'Test' },
                { value: 'PROD', label: 'Production' },
              ]}
            />
          </div>
        </div>

        {showField ? (
          <Input.Password
            autoComplete="off"
            placeholder="Collez ici le jeton délivré par la DGI"
            value={token}
            disabled={disabled}
            onChange={(event) => setToken(event.target.value)}
          />
        ) : (
          <Flex align="center" gap={8}>
            <Typography.Text code>
              {'•'.repeat(18)}
              {profile?.tokenLast4}
            </Typography.Text>
            {verified ? (
              <Typography.Text type="success">
                <CheckCircleTwoTone twoToneColor="#52c41a" /> Vérifié le{' '}
                {formatDateTime(profile!.verifiedAt!)}
              </Typography.Text>
            ) : (
              <Typography.Text type="warning">
                Enregistré, pas encore vérifié
              </Typography.Text>
            )}
          </Flex>
        )}

        {profile?.tokenExpiresAt && (
          <Typography.Text type="secondary">
            Valide jusqu’au {formatDate(profile.tokenExpiresAt)}
            {profile.nim ? ` · NIM ${profile.nim}` : ''}
          </Typography.Text>
        )}

        <Space>
          {showField ? (
            <>
              <Button
                type="primary"
                loading={save.isPending}
                disabled={disabled || token.trim().length === 0}
                onClick={() =>
                  save.mutate(
                    { token: token.trim(), env },
                    {
                      onSuccess: () => {
                        setToken('');
                        setReplacing(false);
                      },
                    },
                  )
                }
              >
                Enregistrer et tester
              </Button>
              {stored && (
                <Button
                  onClick={() => {
                    setToken('');
                    setReplacing(false);
                  }}
                >
                  Annuler
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => setReplacing(true)} disabled={disabled}>
                Remplacer le jeton
              </Button>
              <Button
                loading={test.isPending}
                disabled={disabled}
                onClick={() => test.mutate()}
              >
                Tester
              </Button>
            </>
          )}
        </Space>

        <Typography.Link
          href="https://developper.impots.bj"
          target="_blank"
          rel="noreferrer"
        >
          Où trouver mon jeton ?
        </Typography.Link>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Le jeton se génère depuis le compte e-MECeF de l’entreprise, rubrique
          « Gestion des jetons ». Il est propre à l’IFU et à l’environnement.
        </Typography.Text>
      </Flex>
    </Card>
  );
}
