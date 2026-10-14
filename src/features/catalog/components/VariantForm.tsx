import {
  Alert,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Typography,
} from 'antd';
import { MoneyInput } from '../../../shared/components';
import { FIRMNESS_OPTIONS } from '../labels';
import type { UpdateVariantPayload } from '../api';
import type { Firmness, ProductVariantView } from '../../../shared/api/types';

interface Props {
  variant: ProductVariantView;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: UpdateVariantPayload) => void;
}

/**
 * Correction d'une variante : une épaisseur mal saisie, un code-barres à
 * reprendre, une déclinaison qu'on ne fabrique plus.
 *
 * Le SKU n'est pas modifiable. Il identifie l'article sur les tickets et
 * dans l'historique des ventes : le changer ferait diverger la variante de
 * son passé. Une référence erronée se remplace par une nouvelle variante,
 * l'ancienne étant désactivée.
 */
export function VariantForm({
  variant,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<
    Omit<UpdateVariantPayload, 'firmness'> & { firmness?: Firmness }
  >();

  return (
    <Modal
      open={open}
      width={560}
      title={`Modifier ${variant.sku}`}
      okText="Enregistrer"
      cancelText="Annuler"
      okButtonProps={{ loading: pending }}
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            // Un champ vidé part absent plutôt qu'en chaîne vide : le
            // serveur refuserait un code-barres « ».
            const { barcode, ...reste } = values;
            onSubmit({
              ...reste,
              ...(barcode?.trim() ? { barcode: barcode.trim() } : {}),
            });
          })
          .catch(() => undefined);
      }}
    >
      {/* La modale n'est montée qu'à l'ouverture : `initialValues` suffit. */}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: variant.name,
          barcode: variant.barcode ?? '',
          widthCm: variant.widthCm ?? undefined,
          lengthCm: variant.lengthCm ?? undefined,
          thicknessCm: variant.thicknessCm ?? undefined,
          densityKgM3: variant.densityKgM3 ?? undefined,
          firmness: (variant.firmness as Firmness | null) ?? undefined,
          costPrice: variant.costPrice ?? undefined,
          isActive: variant.isActive,
        }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`SKU ${variant.sku}`}
          description="La référence ne se modifie pas : elle figure sur les tickets déjà remis et dans l’historique des ventes. Pour en changer, créez une variante et désactivez celle-ci."
        />

        <Form.Item
          name="name"
          label="Libellé"
          rules={[
            { required: true, message: 'Le libellé est obligatoire.' },
            { max: 120, message: 'Au plus 120 caractères.' },
          ]}
        >
          <Input maxLength={120} />
        </Form.Item>

        <Form.Item
          name="barcode"
          label="Code-barres"
          extra="C’est lui que lit la douchette en caisse. Il doit être unique."
        >
          <Input maxLength={40} placeholder="Aucun" />
        </Form.Item>

        <Flex gap={12} wrap>
          <Form.Item name="widthCm" label="Largeur (cm)">
            <InputNumber min={1} max={400} style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="lengthCm" label="Longueur (cm)">
            <InputNumber min={1} max={400} style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="thicknessCm" label="Épaisseur (cm)">
            <InputNumber min={1} max={100} style={{ width: 130 }} />
          </Form.Item>
        </Flex>

        <Flex gap={12} wrap>
          <Form.Item name="densityKgM3" label="Densité (kg/m³)">
            <InputNumber min={1} max={200} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="firmness" label="Fermeté">
            <Select
              allowClear
              style={{ width: 160 }}
              options={FIRMNESS_OPTIONS}
            />
          </Form.Item>
          <Form.Item
            name="costPrice"
            label="Prix de revient"
            extra="Sert à la valorisation du stock, jamais au prix de vente."
          >
            <MoneyInput />
          </Form.Item>
        </Flex>

        <Form.Item
          name="isActive"
          label="Active"
          valuePropName="checked"
          extra="Une variante inactive disparaît de la caisse ; son stock et son historique restent."
        >
          <Switch />
        </Form.Item>

        <Typography.Text type="secondary">
          Le prix de vente se règle depuis la colonne « Prix » de la liste.
        </Typography.Text>
      </Form>
    </Modal>
  );
}
