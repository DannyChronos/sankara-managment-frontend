import { useState } from 'react';
import { Alert, Input, Modal, Typography } from 'antd';
import { IfuInput } from '../../../shared/components';
import { buyerIfuError } from '../../../shared/utils/ifu';
import { cleanBuyer } from '../../pos/sale-payload';
import type { EinvoiceBuyer } from '../../../shared/api/types';

/**
 * « Émettre la facture normalisée » (§7.3) : le client revient dans la
 * journée réclamer sa facture.
 *
 * Le serveur n'accepte cette émission que le jour de la vente, et l'opérateur
 * imprimé reste le caissier qui a encaissé — la facture doit dire la vérité
 * sur l'opération, pas sur qui a cliqué.
 */
export function NormalizeLateModal({
  open,
  saleNumber,
  pending,
  defaultBuyer,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  saleNumber: string;
  pending: boolean;
  defaultBuyer?: EinvoiceBuyer;
  onCancel: () => void;
  onSubmit: (buyer?: EinvoiceBuyer) => void;
}) {
  const [buyer, setBuyer] = useState<EinvoiceBuyer>(defaultBuyer ?? {});
  const ifuError = buyerIfuError(buyer);

  return (
    <Modal
      open={open}
      title={`Facture normalisée · ${saleNumber}`}
      okText="Émettre la facture"
      cancelText="Annuler"
      okButtonProps={{ loading: pending, disabled: ifuError !== null }}
      onCancel={onCancel}
      onOk={() => onSubmit(cleanBuyer(buyer))}
      afterOpenChange={(opened) => {
        if (opened) setBuyer(defaultBuyer ?? {});
      }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Les deux champs sont facultatifs."
        description="Un particulier n’a rien à renseigner. Pour une entreprise, la raison sociale et l’IFU figureront sur la facture."
      />

      <Input
        placeholder="Nom de l’acheteur"
        maxLength={120}
        style={{ marginBottom: 8 }}
        value={buyer.name ?? ''}
        onChange={(event) => setBuyer({ ...buyer, name: event.target.value })}
      />
      <IfuInput
        status={ifuError ? 'error' : undefined}
        value={buyer.ifu ?? ''}
        onChange={(value) => setBuyer({ ...buyer, ifu: value })}
      />
      {ifuError && (
        <Typography.Text type="danger" style={{ fontSize: 12 }}>
          {ifuError}
        </Typography.Text>
      )}
    </Modal>
  );
}
