import { useState } from 'react';
import { Alert, Checkbox, Modal, Typography } from 'antd';

/**
 * Avertissement du mode « à la demande » (§4.3).
 *
 * Ce n'est pas une formalité : la DGI considère que toute vente d'une
 * entreprise assujettie doit donner lieu à une facture normalisée. Le choix
 * appartient au client, pas à nous — mais il doit être fait en connaissance
 * de cause, et le serveur en garde l'auteur et la date.
 */
export function LegalWarningModal({
  open,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <Modal
      open={open}
      title="Facture normalisée à la demande"
      okText="Choisir ce mode"
      cancelText="Annuler"
      okButtonProps={{ disabled: !acknowledged, loading: pending }}
      onCancel={() => {
        setAcknowledged(false);
        onCancel();
      }}
      onOk={onConfirm}
      afterOpenChange={(opened) => {
        if (!opened) setAcknowledged(false);
      }}
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Selon la DGI, toute vente d’une entreprise assujettie doit donner lieu à une facture normalisée."
        description="Ne l’émettre qu’à la demande du client expose l’entreprise à des amendes en cas de contrôle."
      />

      <Typography.Paragraph>
        Ce choix relève de la responsabilité de Matelas Sankara. Il est
        enregistré avec votre nom et la date.
      </Typography.Paragraph>

      <Checkbox
        checked={acknowledged}
        onChange={(event) => setAcknowledged(event.target.checked)}
      >
        J’ai compris et je choisis ce mode en connaissance de cause.
      </Checkbox>
    </Modal>
  );
}
