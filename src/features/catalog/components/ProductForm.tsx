import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { useCategories } from '../hooks';
import type { ProductPayload } from '../api';
import type { ProductDetail } from '../../../shared/api/types';

interface Props {
  product?: ProductDetail;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: ProductPayload) => void;
}

/**
 * Un produit est une famille — « Matelas Ortho Confort » — et ne se vend pas
 * tel quel : ce sont ses variantes, dimensions et épaisseurs, qui portent un
 * SKU et un prix.
 */
export function ProductForm({
  product,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<ProductPayload>();
  const categories = useCategories({ isActive: true });

  return (
    <Modal
      open={open}
      title={product ? `Modifier ${product.name}` : 'Nouveau produit'}
      okText={product ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      okButtonProps={{ loading: pending }}
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            const payload = Object.fromEntries(
              Object.entries(values).filter(
                ([, value]) =>
                  value !== undefined &&
                  !(typeof value === 'string' && value.trim() === ''),
              ),
            ) as unknown as ProductPayload;
            onSubmit(payload);
          })
          .catch(() => undefined);
      }}
      afterOpenChange={(opened) => {
        if (opened) {
          form.setFieldsValue({
            name: product?.name ?? '',
            categoryId: product?.category.id,
            description: product?.description ?? '',
            brand: product?.brand ?? 'Matelas Sankara',
            warrantyMonths: product?.warrantyMonths ?? undefined,
            isPublishedOnline: product?.isPublishedOnline ?? false,
            ...(product ? { isActive: product.isActive } : {}),
          });
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Nom"
          rules={[
            { required: true, message: 'Le nom est obligatoire.' },
            { min: 2, message: 'Au moins 2 caractères.' },
          ]}
        >
          <Input maxLength={140} placeholder="Matelas Ortho Confort" />
        </Form.Item>

        <Form.Item
          name="categoryId"
          label="Catégorie"
          rules={[{ required: true, message: 'Choisissez une catégorie.' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={categories.isPending}
            options={(categories.data ?? []).map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="brand" label="Marque">
          <Input maxLength={80} />
        </Form.Item>

        <Form.Item
          name="warrantyMonths"
          label="Garantie (mois)"
          extra="Reprise sur la fiche client : elle court à partir de la date d’achat."
        >
          <InputNumber min={0} max={600} precision={0} style={{ width: 140 }} />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} maxLength={4000} />
        </Form.Item>

        <Form.Item
          name="isPublishedOnline"
          label="Publié sur la boutique en ligne"
          valuePropName="checked"
        >
          <Switch aria-label="Publié sur la boutique en ligne" />
        </Form.Item>

        {product && (
          <Form.Item
            name="isActive"
            label="Actif"
            valuePropName="checked"
            extra="Un produit inactif disparaît de la caisse ; son historique reste."
          >
            <Switch aria-label="Produit actif" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
