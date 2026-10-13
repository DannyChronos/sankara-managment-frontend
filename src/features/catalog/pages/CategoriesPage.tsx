import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  Table,
  Tag,
} from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useCategories, useCreateCategory, useUpdateCategory } from '../hooks';
import type { CategoryNode } from '../../../shared/api/types';

interface Fields {
  name: string;
  parentId?: string | null;
  position?: number;
  isActive?: boolean;
}

/**
 * Arborescence des catégories. Elle classe le catalogue : un produit en
 * dépend, et une catégorie désactivée fait disparaître ses produits des
 * écrans — le serveur refuse d'ailleurs de la couper tant qu'elle en
 * contient encore d'actifs.
 */
export function CategoriesPage() {
  const categories = useCategories({ tree: true });
  const create = useCreateCategory();
  const update = useUpdateCategory();

  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [parentFor, setParentFor] = useState<CategoryNode | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<Fields>();

  if (categories.isPending) return <PageSkeleton />;
  if (categories.isError) {
    return (
      <ErrorState
        error={categories.error}
        onRetry={() => void categories.refetch()}
      />
    );
  }

  const openForm = (
    category: CategoryNode | null,
    parent: CategoryNode | null,
  ) => {
    setEditing(category);
    setParentFor(parent);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Catégories"
        subtitle="Elles classent le catalogue et structurent la recherche en caisse."
        breadcrumb={[{ title: 'Catalogue' }, { title: 'Catégories' }]}
        actions={
          <PermissionGate perm="catalog:manage">
            <Button type="primary" onClick={() => openForm(null, null)}>
              Nouvelle catégorie
            </Button>
          </PermissionGate>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table<CategoryNode>
          rowKey="id"
          pagination={false}
          dataSource={categories.data}
          expandable={{ defaultExpandAllRows: true }}
          columns={[
            { title: 'Nom', dataIndex: 'name' },
            {
              title: 'Identifiant',
              dataIndex: 'slug',
              width: 220,
              render: (value: string) => (
                <small style={{ color: '#8a98a8' }}>{value}</small>
              ),
            },
            {
              title: 'Produits',
              dataIndex: 'productCount',
              align: 'right',
              width: 100,
              render: (value: number, row) =>
                value > 0 ? (
                  <Link to={`/catalog/products?categoryId=${row.id}`}>
                    {value}
                  </Link>
                ) : (
                  value
                ),
            },
            {
              title: 'Ordre',
              dataIndex: 'position',
              align: 'right',
              width: 90,
            },
            {
              title: 'Active',
              dataIndex: 'isActive',
              width: 100,
              render: (value: boolean) =>
                value ? <Tag color="success">oui</Tag> : <Tag>non</Tag>,
            },
            {
              title: '',
              key: 'actions',
              width: 200,
              render: (_, row) => (
                <PermissionGate perm="catalog:manage">
                  <Button type="link" onClick={() => openForm(row, null)}>
                    Modifier
                  </Button>
                  <Button type="link" onClick={() => openForm(null, row)}>
                    Sous-catégorie
                  </Button>
                </PermissionGate>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={open}
        title={
          editing
            ? `Modifier ${editing.name}`
            : parentFor
              ? `Sous-catégorie de ${parentFor.name}`
              : 'Nouvelle catégorie'
        }
        okText={editing ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        okButtonProps={{ loading: create.isPending || update.isPending }}
        onCancel={() => setOpen(false)}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              const payload = {
                name: values.name,
                position: values.position ?? 0,
                ...(editing
                  ? { isActive: values.isActive }
                  : parentFor
                    ? { parentId: parentFor.id }
                    : {}),
              };

              if (editing) {
                update.mutate(
                  { id: editing.id, payload },
                  { onSuccess: () => setOpen(false) },
                );
              } else {
                create.mutate(payload, { onSuccess: () => setOpen(false) });
              }
            })
            .catch(() => undefined);
        }}
        afterOpenChange={(opened) => {
          if (opened) {
            form.setFieldsValue({
              name: editing?.name ?? '',
              position: editing?.position ?? 0,
              isActive: editing?.isActive ?? true,
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
            <Input maxLength={80} placeholder="Matelas orthopédiques" />
          </Form.Item>

          <Form.Item
            name="position"
            label="Ordre d’affichage"
            extra="Les plus petits chiffres passent en premier."
          >
            <InputNumber min={0} precision={0} style={{ width: 120 }} />
          </Form.Item>

          {editing && (
            <Form.Item
              name="isActive"
              label="Active"
              valuePropName="checked"
              extra="Une catégorie qui contient encore des produits actifs ne peut pas être désactivée."
            >
              <Switch aria-label="Catégorie active" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}

export default CategoriesPage;
