import { Collapse, Tag, Timeline, Typography } from 'antd';
import { formatDateTime } from '../../../shared/utils/format';
import type { EinvoiceAttempt, EinvoiceStep } from '../../../shared/api/types';

const stepLabel: Record<EinvoiceStep, string> = {
  SUBMIT: 'Soumission',
  CONFIRM: 'Confirmation',
  CANCEL: 'Abandon',
  STATUS: 'État du service',
  TOKEN_CHECK: 'Test du jeton',
};

/** Vert si la DGI a répondu sans erreur, rouge sinon. */
function colorOf(attempt: EinvoiceAttempt): string {
  if (attempt.error || attempt.errorCode) return 'red';
  if (attempt.httpStatus && attempt.httpStatus >= 400) return 'red';
  return 'green';
}

/**
 * Chronologie des appels à la DGI (§8.2) : c'est la pièce qu'on regarde
 * quand une facture est refusée et que personne ne comprend pourquoi.
 *
 * Le journal est en insertion seule côté serveur : ce qui s'affiche ici est
 * exactement ce qui est parti et ce qui est revenu, sans réécriture.
 */
export function AttemptsTimeline({
  attempts,
}: {
  attempts: EinvoiceAttempt[];
}) {
  if (attempts.length === 0) {
    return (
      <Typography.Text type="secondary">
        Aucun appel enregistré : la facture n’est pas encore partie.
      </Typography.Text>
    );
  }

  return (
    <Timeline
      items={attempts.map((attempt) => ({
        color: colorOf(attempt),
        children: (
          <div>
            <Typography.Text strong>
              {stepLabel[attempt.step] ?? attempt.step}
            </Typography.Text>{' '}
            <Typography.Text type="secondary">
              {formatDateTime(attempt.createdAt)}
              {attempt.durationMs !== null ? ` · ${attempt.durationMs} ms` : ''}
            </Typography.Text>
            <div style={{ marginTop: 4 }}>
              {attempt.httpStatus !== null && (
                <Tag color={attempt.httpStatus >= 400 ? 'red' : 'blue'}>
                  HTTP {attempt.httpStatus}
                </Tag>
              )}
              {attempt.errorCode && (
                <Tag color="red">code DGI {attempt.errorCode}</Tag>
              )}
            </div>
            {attempt.error && (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>
                {attempt.error}
              </Typography.Text>
            )}
            {attempt.response !== null && attempt.response !== undefined && (
              <Collapse
                ghost
                size="small"
                items={[
                  {
                    key: 'raw',
                    label: 'Réponse brute',
                    children: (
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          maxHeight: 280,
                          overflow: 'auto',
                          background: '#f6f8fa',
                          padding: 8,
                          borderRadius: 4,
                        }}
                      >
                        {JSON.stringify(attempt.response, null, 2)}
                      </pre>
                    ),
                  },
                ]}
              />
            )}
          </div>
        ),
      }))}
    />
  );
}
