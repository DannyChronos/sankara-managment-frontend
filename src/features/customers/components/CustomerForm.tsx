import { Form, Input, Modal } from 'antd';
import type { CustomerPayload } from '../api';
import type { Customer } from '../../../shared/api/types';

interface Props {
  /** Absent : création. Présent : modification de cette fiche. */
  customer?: Customer;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: CustomerPayload) => void;
}

/**
 * Seul le nom est obligatoire : au comptoir, on n'a pas toujours plus. Le
 * téléphone, lui, est unique côté serveur — c'est la clé de reconnaissance
 * d'un client qui revient.
 */
export function CustomerForm({
  customer,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<CustomerPayload>();

  return (
    <Modal
      open={open}
      title={customer ? `Modifier ${customer.fullName}` : 'Nouveau client'}
      okText={customer ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      okButtonProps={{ loading: pending }}
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            // Un champ vidé doit partir absent, pas en chaîne vide : la
            // validation du serveur refuserait un email ou un téléphone « ».
            const payload = Object.fromEntries(
              Object.entries(values).filter(
                ([, value]) => typeof value === 'string' && value.trim() !== '',
              ),
            ) as unknown as CustomerPayload;
            onSubmit(payload);
          })
          .catch(() => undefined);
      }}
      afterOpenChange={(opened) => {
        if (opened) {
          form.setFieldsValue({
            fullName: customer?.fullName ?? '',
            phone: customer?.phone ?? '',
            email: customer?.email ?? '',
            address: customer?.address ?? '',
            city: customer?.city ?? '',
            notes: customer?.notes ?? '',
          });
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="fullName"
          label="Nom complet"
          rules={[
            { required: true, message: 'Le nom est obligatoire.' },
            { min: 2, message: 'Au moins 2 caractères.' },
          ]}
        >
          <Input maxLength={120} placeholder="Afi Kodjo" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Téléphone"
          extra="Obligatoire pour une livraison, et seul moyen de retrouver un client au comptoir."
          rules={[
            {
              pattern: /^\+?[0-9]{8,15}$/,
              message: 'Numéro invalide (8 à 15 chiffres).',
            },
          ]}
        >
          <Input maxLength={16} placeholder="+22997000000" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Adresse email invalide.' }]}
        >
          <Input maxLength={180} />
        </Form.Item>

        <Form.Item name="address" label="Adresse">
          <Input maxLength={255} />
        </Form.Item>

        <Form.Item name="city" label="Ville">
          <Input maxLength={80} placeholder="Cotonou" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
