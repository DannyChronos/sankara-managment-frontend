import { Form, Input, Modal, Select, Switch } from 'antd';
import type { SitePayload } from '../api';
import { SITE_TYPES } from '../labels';
import type { SiteDetail } from '../../../shared/api/types';

interface Props {
  site?: SiteDetail;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: SitePayload) => void;
}

/**
 * Le code d'un site entre dans les numéros de vente, de bon et d'inventaire :
 * il se fixe à la création et ne bouge plus.
 */
export function SiteForm({ site, open, pending, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<SitePayload>();
  const editing = Boolean(site);

  return (
    <Modal
      open={open}
      title={editing ? `Modifier ${site?.code}` : 'Nouveau site'}
      okText={editing ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      okButtonProps={{ loading: pending }}
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => onSubmit(values))
          .catch(() => undefined);
      }}
      afterOpenChange={(opened) => {
        if (opened) {
          form.setFieldsValue({
            code: site?.code ?? '',
            name: site?.name ?? '',
            type: site?.type ?? 'SHOP',
            address: site?.address ?? '',
            phone: site?.phone ?? '',
            canSell: site?.canSell ?? true,
            isEcommerceSource: site?.isEcommerceSource ?? false,
          });
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="code"
          label="Code"
          extra="2 à 6 majuscules. Repris dans les numéros de vente et de bon — définitif."
          rules={[
            { required: !editing, message: 'Le code est obligatoire.' },
            {
              pattern: /^[A-Z][A-Z0-9]{1,5}$/,
              message: '2 à 6 caractères en majuscules.',
            },
          ]}
        >
          <Input maxLength={6} disabled={editing} placeholder="CAL" />
        </Form.Item>

        <Form.Item
          name="name"
          label="Nom"
          rules={[{ required: true, message: 'Le nom est obligatoire.' }]}
        >
          <Input maxLength={120} placeholder="Matelas Sankara — Calavi" />
        </Form.Item>

        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Select options={SITE_TYPES} />
        </Form.Item>

        <Form.Item name="address" label="Adresse">
          <Input maxLength={255} />
        </Form.Item>

        <Form.Item name="phone" label="Téléphone">
          <Input maxLength={30} placeholder="+22901970000" />
        </Form.Item>

        <Form.Item
          name="canSell"
          label="Autorise les sessions de caisse"
          valuePropName="checked"
          extra="Un entrepôt pur ne vend pas : ses caissiers ne peuvent pas ouvrir de caisse."
        >
          <Switch aria-label="Autorise les sessions de caisse" />
        </Form.Item>

        <Form.Item
          name="isEcommerceSource"
          label="Stock exposé à la boutique en ligne"
          valuePropName="checked"
        >
          <Switch aria-label="Stock exposé à la boutique en ligne" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
