import { useEffect, useRef } from 'react';
import { Alert, Button, Flex, Modal, Spin, Typography } from 'antd';
import { Money, PdfButton } from '../../../shared/components';
import { EinvoiceSecurityBlock } from '../../../shared/components/EinvoiceSecurityBlock';
import { rejectionMessage } from '../../einvoices/rejection';
import type { Order, SaleEinvoice } from '../../../shared/api/types';

interface Props {
  open: boolean;
  sale: Order;
  einvoice: SaleEinvoice | undefined;
  /** Vrai quand les dix secondes d'attente sont écoulées (§6.4). */
  timedOut: boolean;
  onWaitMore: () => void;
  onClose: () => void;
}

/**
 * Attente de la facture après l'encaissement (§6.4).
 *
 * Trois principes tiennent cet écran :
 *
 * 1. la vente **est** enregistrée — aucun message ne doit laisser croire le
 *    contraire, et le caissier ne doit jamais refaire la vente ;
 * 2. le panier est déjà vidé : la vente suivante peut commencer pendant que
 *    la DGI répond ;
 * 3. on n'attend pas indéfiniment une administration : passé dix secondes,
 *    un reçu provisoire part à l'imprimante et la facture suivra.
 */
export function EinvoiceWaitModal({
  open,
  sale,
  einvoice,
  timedOut,
  onWaitMore,
  onClose,
}: Props) {
  const status = einvoice?.status ?? 'PENDING';
  const invoice = einvoice?.invoice ?? null;

  // Entrée imprime, Échap continue sans imprimer : au comptoir, la file
  // n'attend pas que le caissier cherche la souris. L'impression passe par le
  // bouton lui-même — il porte déjà la récupération du PDF et son état de
  // chargement, le dupliquer serait s'exposer à ce que les deux divergent.
  const printRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        printRef.current?.querySelector('button')?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const receiptButton = (label: string, primary?: boolean) => (
    <span ref={primary ? printRef : undefined}>
      <PdfButton
        path={`/sales/${sale.id}/receipt`}
        fileName={`${sale.number}.pdf`}
        type={primary ? 'primary' : 'default'}
        print
      >
        {label}
      </PdfButton>
    </span>
  );

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      title={`Vente ${sale.number}`}
      footer={
        <Flex gap={8} justify="end" wrap>
          {status === 'CONFIRMED' && receiptButton('Imprimer la facture', true)}
          {status === 'REJECTED' && receiptButton('Imprimer le reçu', true)}
          {status === 'PENDING' && timedOut && (
            <>
              {receiptButton('Imprimer un reçu provisoire', true)}
              <Button onClick={onWaitMore}>Attendre encore</Button>
            </>
          )}
          <Button onClick={onClose}>Vente suivante (Échap)</Button>
        </Flex>
      }
    >
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        <Money value={sale.total} strong />
      </Typography.Title>

      {sale.payments
        .filter((payment) => payment.changeGiven)
        .map((payment) => (
          <Typography.Text
            key={payment.id}
            type="success"
            style={{ fontSize: 18, display: 'block', marginBottom: 12 }}
          >
            Rendu : <Money value={payment.changeGiven ?? 0} strong />
          </Typography.Text>
        ))}

      {status === 'PENDING' && !timedOut && (
        <Flex align="center" gap={12}>
          <Spin />
          <Typography.Text>Facture normalisée en cours…</Typography.Text>
        </Flex>
      )}

      {status === 'PENDING' && timedOut && (
        <Alert
          type="info"
          showIcon
          message="La facture n’est pas encore prête."
          description="La vente est enregistrée. Imprimez un reçu provisoire : vous serez prévenu dès que la facture sera disponible, et vous pourrez l’imprimer à ce moment-là."
        />
      )}

      {status === 'REJECTED' && (
        <Alert
          type="error"
          showIcon
          message="La DGI a refusé la facture"
          description={
            <>
              {invoice ? rejectionMessage(invoice) : 'Motif non communiqué.'}{' '}
              <strong>La vente est bien enregistrée</strong> : remettez le reçu
              au client, un administrateur a été prévenu.
            </>
          }
        />
      )}

      {status === 'CONFIRMED' && invoice && (
        <>
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 12 }}
            message="Facture normalisée enregistrée par la DGI"
          />
          <EinvoiceSecurityBlock invoice={invoice} />
        </>
      )}
    </Modal>
  );
}
