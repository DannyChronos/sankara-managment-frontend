import { Alert, Descriptions, Flex, Typography } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { formatDateTime } from '../utils/format';
import type { NormalizedInvoice } from '../api/types';

/** `ME6FAM9V4H453ANJ` → `ME6F-AM9V-4H45-3ANJ`, comme sur le ticket. */
function groupCode(code: string): string {
  const compact = code.replace(/[\s-]/g, '');
  return (compact.match(/.{1,4}/g) ?? [compact]).join('-');
}

/**
 * Éléments de sécurité délivrés par la DGI (§B11.1) : ce bloc est la preuve
 * que la facture est normalisée. Les valeurs ne sont pas recalculées ici —
 * elles sont relues de la base telle que la DGI les a renvoyées, pour qu'une
 * réimpression dans six mois soit identique à l'originale.
 */
export function EinvoiceSecurityBlock({
  invoice,
}: {
  invoice: NormalizedInvoice;
}) {
  return (
    <Flex gap={24} wrap align="start">
      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
        <Descriptions
          size="small"
          column={1}
          items={[
            {
              key: 'code',
              label: 'Code MECeF/DGI',
              children: invoice.mecefCode ? (
                <Typography.Text copyable={{ text: invoice.mecefCode }} strong>
                  {groupCode(invoice.mecefCode)}
                </Typography.Text>
              ) : (
                '—'
              ),
            },
            {
              key: 'nim',
              label: 'NIM',
              children: invoice.nim ?? '—',
            },
            {
              key: 'counters',
              label: 'Compteurs',
              children: invoice.counters ?? '—',
            },
            {
              key: 'dgiDateTime',
              label: 'Date DGI',
              children: invoice.dgiDateTime ?? '—',
            },
            {
              key: 'operator',
              label: 'Opérateur',
              children: `${invoice.operator.code} · ${invoice.operator.name}`,
            },
            {
              key: 'confirmedAt',
              label: 'Confirmée le',
              children: invoice.confirmedAt
                ? formatDateTime(invoice.confirmedAt)
                : '—',
            },
          ]}
        />
      </div>

      {invoice.qrCode && (
        <Flex vertical align="center" gap={6}>
          <QRCodeSVG value={invoice.qrCode} size={120} level="M" />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Vérification DGI
          </Typography.Text>
        </Flex>
      )}

      {invoice.env === 'TEST' && (
        <Alert
          type="warning"
          showIcon
          style={{ flexBasis: '100%' }}
          message="Facture émise en environnement de test"
          description="Elle n’a aucune valeur fiscale et n’est pas opposable à la DGI."
        />
      )}
    </Flex>
  );
}
