import { Alert, Button, Card, Flex, Spin, Table, Typography } from 'antd';
import { Link } from 'react-router-dom';
import {
  EinvoiceSecurityBlock,
  Money,
  PdfButton,
  PermissionGate,
} from '../../../shared/components';
import { NormalizedInvoiceStatusTag } from '../../../shared/components/EinvoiceStatusTag';
import { RejectionAlert } from '../../einvoices/components/RejectionAlert';
import { formatDateTime } from '../../../shared/utils/format';
import type {
  NormalizedInvoice,
  Order,
  SaleEinvoice,
} from '../../../shared/api/types';

interface Props {
  sale: Order;
  einvoice: SaleEinvoice | undefined;
  loading: boolean;
  /** Vente du jour : passé minuit, le serveur refuse l'émission tardive. */
  sameDay: boolean;
  retrying: boolean;
  onNormalizeLate: () => void;
  onRetry: (invoiceId: string) => void;
}

/**
 * Bloc « Facture normalisée » de la fiche de vente (§7.2).
 *
 * Il parle depuis la base, jamais depuis un calcul local : code MECeF, NIM,
 * compteurs et QR code sont ceux que la DGI a renvoyés, pour qu'une
 * réimpression dans six mois donne le même document.
 */
export function SaleEinvoiceCard({
  sale,
  einvoice,
  loading,
  sameDay,
  retrying,
  onNormalizeLate,
  onRetry,
}: Props) {
  const status = einvoice?.status ?? sale.einvoiceStatus;
  const invoice = einvoice?.invoice ?? null;
  const creditNotes = einvoice?.creditNotes ?? [];

  return (
    <Card title="Facture normalisée" style={{ marginTop: 16 }}>
      {loading && !einvoice ? (
        <Spin />
      ) : (
        <>
          {status === 'NOT_REQUESTED' && (
            <Flex vertical gap={12} align="start">
              <Typography.Text type="secondary">
                Aucune facture normalisée : cette vente a donné lieu à un reçu
                simple.
              </Typography.Text>
              <PermissionGate perm="einvoice:normalize-late">
                {sameDay ? (
                  <Button onClick={onNormalizeLate}>
                    Émettre la facture normalisée
                  </Button>
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    La facture normalisée ne peut être émise après coup que le
                    jour de la vente.
                  </Typography.Text>
                )}
              </PermissionGate>
            </Flex>
          )}

          {status === 'PENDING' && (
            <Flex align="center" gap={12}>
              <Spin />
              <div>
                <Typography.Text strong>
                  Facture en cours de traitement
                </Typography.Text>
                <div>
                  <Typography.Text type="secondary">
                    {invoice?.submittedAt
                      ? `Envoyée à la DGI à ${formatDateTime(invoice.submittedAt).slice(-5)}`
                      : 'En attente d’envoi à la DGI'}
                    {invoice?.nextAttemptAt &&
                      ` · prochaine tentative à ${formatDateTime(invoice.nextAttemptAt).slice(-5)}`}
                  </Typography.Text>
                </div>
              </div>
            </Flex>
          )}

          {status === 'REJECTED' && invoice && (
            <RejectionAlert
              invoice={invoice}
              retrying={retrying}
              onRetry={() => onRetry(invoice.id)}
            />
          )}

          {status === 'CONFIRMED' && invoice && (
            <>
              <EinvoiceSecurityBlock invoice={invoice} />
              <Flex gap={8} style={{ marginTop: 16 }} wrap>
                <PdfButton
                  path={`/sales/${sale.id}/receipt`}
                  fileName={`${sale.number}.pdf`}
                  print
                >
                  Ticket
                </PdfButton>
                <PdfButton
                  path={`/sales/${sale.id}/receipt?format=a4`}
                  fileName={`${sale.number}-A4.pdf`}
                >
                  Facture A4
                </PdfButton>
              </Flex>
            </>
          )}

          {/* Un avoir n'annule pas la facture : il la contrebalance, et les
              deux documents restent dus au client. */}
          {creditNotes.length > 0 && (
            <>
              <Typography.Title level={5} style={{ marginTop: 20 }}>
                Avoirs liés
              </Typography.Title>
              <Table<NormalizedInvoice>
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={creditNotes}
                columns={[
                  {
                    title: 'Émis le',
                    dataIndex: 'createdAt',
                    width: 160,
                    render: (value: string) => formatDateTime(value),
                  },
                  {
                    title: 'Montant',
                    dataIndex: 'expectedTotal',
                    align: 'right',
                    width: 140,
                    render: (value: number) => <Money value={value} />,
                  },
                  {
                    title: 'Statut',
                    dataIndex: 'status',
                    width: 190,
                    render: (value: NormalizedInvoice['status']) => (
                      <NormalizedInvoiceStatusTag status={value} />
                    ),
                  },
                  {
                    title: 'Code MECeF/DGI',
                    dataIndex: 'mecefCode',
                    render: (value: string | null) => value ?? '—',
                  },
                  {
                    title: '',
                    key: 'link',
                    width: 90,
                    render: (_, row) => (
                      <PermissionGate perm="einvoice:read">
                        <Link to={`/einvoices/${row.id}`}>Détail</Link>
                      </PermissionGate>
                    ),
                  },
                ]}
              />
            </>
          )}

          {invoice?.env === 'TEST' && status !== 'NOT_REQUESTED' && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
              message="Émise en environnement de test : sans valeur fiscale."
            />
          )}
        </>
      )}
    </Card>
  );
}
