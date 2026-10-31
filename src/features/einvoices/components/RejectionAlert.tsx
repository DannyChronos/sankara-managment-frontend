import { Alert, Button, Typography } from 'antd';
import { PermissionGate } from '../../../shared/components';
import { hasRawReason, rejectionMessage } from '../rejection';
import type { NormalizedInvoice } from '../../../shared/api/types';

export function RejectionAlert({
  invoice,
  onRetry,
  retrying,
}: {
  invoice: NormalizedInvoice;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <Alert
      type="error"
      showIcon
      message="La DGI a refusé la facture"
      description={
        <>
          <Typography.Paragraph style={{ marginBottom: 8 }}>
            {rejectionMessage(invoice)}
          </Typography.Paragraph>
          {/* Le message brut est conservé : il est parfois le seul indice
              exploitable par le support. */}
          {hasRawReason(invoice) && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Réponse de la DGI : {invoice.rejectionReason}
            </Typography.Text>
          )}
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            La vente, elle, est bien enregistrée : elle n’a pas à être refaite.
          </Typography.Paragraph>
          {onRetry && (
            <PermissionGate perm="einvoice:retry">
              <Button danger loading={retrying} onClick={onRetry}>
                Relancer la facture
              </Button>
            </PermissionGate>
          )}
        </>
      }
    />
  );
}
