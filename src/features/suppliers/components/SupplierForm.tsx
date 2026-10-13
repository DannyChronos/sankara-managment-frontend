import { Form, Input, Modal, Switch } from 'antd';
import type { SupplierPayload } from '../api';
import type { Supplier } from '../../../shared/api/types';

interface Props {
  /** Absent : création. Présent : modification de cette fiche. */
  supplier?: Supplier;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: SupplierPayload) => void;
}

/**
 * Seul le nom est obligatoire : un fournisseur se crée souvent dans la
 * foulée d'une livraison, le reste se complète ensuite.
 */
export function SupplierForm({
  supplier,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<SupplierPayload>();

  return (
    <Modal
      open={open}
      title={supplier ? `Modifier ${supplier.name}` : 'Nouveau fournisseur'}
      okText={supplier ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      okButtonProps={{ loading: pending }}
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then(({ isActive, ...values }) => {
            // Un champ vidé doit partir absent, pas en chaîne vide : le
            // serveur refuserait un email « ».
            const payload = Object.fromEntries(
              Object.entries(values).filter(
                ([, value]) => typeof value === 'string' && value.trim() !== '',
              ),
            ) as unknown as SupplierPayload;
            onSubmit(supplier ? { ...payload, isActive } : payload);
          })
          .catch(() => undefined);
      }}
    >
      {/*
        La modale n'est montée que lorsqu'elle s'ouvre : `initialValues`
        suffit, et ne dépend pas de la fin de l'animation d'ouverture.
      */}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: supplier?.name ?? '',
          phone: supplier?.phone ?? '',
          email: supplier?.email ?? '',
          address: supplier?.address ?? '',
          isActive: supplier?.isActive ?? true,
        }}
      >
        <Form.Item
          name="name"
          label="Raison sociale"
          rules={[
            { required: true, message: 'Le nom est obligatoire.' },
            { min: 2, message: 'Au moins 2 caractères.' },
          ]}
        >
          <Input maxLength={120} placeholder="Mousse du Bénin SARL" />
        </Form.Item>

        <Form.Item name="phone" label="Téléphone">
          <Input maxLength={30} placeholder="+229 21 30 00 00" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Adresse email invalide.' }]}
        >
          <Input maxLength={180} placeholder="contact@mousse.bj" />
        </Form.Item>

        <Form.Item name="address" label="Adresse">
          <Input.TextArea
            rows={2}
            maxLength={255}
            placeholder="Zone industrielle, Cotonou"
          />
        </Form.Item>

        {supplier && (
          <Form.Item
            name="isActive"
            label="Actif"
            valuePropName="checked"
            extra="Un fournisseur inactif n’est plus proposé en réception ; ses bons passés restent intacts."
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
