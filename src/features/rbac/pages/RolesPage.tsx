import { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import {
  useCreateRole,
  useDeleteRole,
  usePermissionModules,
  useRenameRole,
  useRoles,
  useSetRolePermissions,
} from '../hooks';
import { PermissionMatrix } from '../components/PermissionMatrix';
import type { Role } from '../../../shared/api/types';

export function RolesPage() {
  const roles = useRoles();
  const modules = usePermissionModules();
  const create = useCreateRole();
  const rename = useRenameRole();
  const setPermissions = useSetRolePermissions();
  const remove = useDeleteRole();

  const { modal } = App.useApp();
  const [selected, setSelected] = useState<Role | null>(null);
  // Le brouillon porte le rôle qu'il modifie : changer de rôle repart donc
  // naturellement de ses permissions enregistrées, sans resynchronisation.
  const [edit, setEdit] = useState<{
    roleId: string;
    permissions: string[];
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<{ code: string; name: string }>();

  /** Changer de rôle abandonne les cases cochées sans avoir enregistré. */
  const select = (role: Role) => {
    setSelected(role);
    setEdit(null);
  };

  if (roles.isPending || modules.isPending) return <PageSkeleton />;
  if (roles.isError) {
    return (
      <ErrorState error={roles.error} onRetry={() => void roles.refetch()} />
    );
  }
  if (modules.isError) {
    return (
      <ErrorState
        error={modules.error}
        onRetry={() => void modules.refetch()}
      />
    );
  }

  const draft =
    edit && selected && edit.roleId === selected.id
      ? edit.permissions
      : (selected?.permissions ?? []);

  const dirty =
    selected !== null &&
    (draft.length !== selected.permissions.length ||
      draft.some((code) => !selected.permissions.includes(code)));

  return (
    <>
      <PageHeader
        title="Rôles et permissions"
        subtitle="Un rôle système se modifie dans ses permissions, mais ne se supprime pas."
        actions={
          <PermissionGate perm="rbac:manage">
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Nouveau rôle
            </Button>
          </PermissionGate>
        }
      />

      <Flex gap={16} wrap align="start">
        <Card style={{ flex: '1 1 420px' }} styles={{ body: { padding: 0 } }}>
          <Table<Role>
            rowKey="id"
            pagination={false}
            dataSource={roles.data}
            rowClassName={(row) =>
              row.id === selected?.id ? 'ant-table-row-selected' : ''
            }
            onRow={(row) => ({ onClick: () => select(row) })}
            columns={[
              {
                title: 'Rôle',
                dataIndex: 'name',
                render: (value: string, row) => (
                  <>
                    <div>{value}</div>
                    <small style={{ color: '#8a98a8' }}>{row.code}</small>
                  </>
                ),
              },
              {
                title: 'Comptes',
                dataIndex: 'userCount',
                align: 'right',
                width: 90,
              },
              {
                title: 'Permissions',
                key: 'permissions',
                align: 'right',
                width: 120,
                render: (_, row) => row.permissions.length,
              },
              {
                title: '',
                key: 'system',
                width: 100,
                render: (_, row) =>
                  row.isSystem ? (
                    <Tag>système</Tag>
                  ) : (
                    <Tag color="blue">sur mesure</Tag>
                  ),
              },
            ]}
          />
        </Card>

        <Card
          style={{ flex: '1 1 460px' }}
          title={selected ? selected.name : 'Permissions'}
          extra={
            selected && (
              <PermissionGate perm="rbac:manage">
                <Flex gap={8}>
                  {!selected.isSystem && (
                    <Button
                      danger
                      disabled={selected.userCount > 0}
                      loading={remove.isPending}
                      onClick={() => {
                        modal.confirm({
                          title: `Supprimer le rôle ${selected.name} ?`,
                          content: 'Cette action est définitive.',
                          okText: 'Supprimer',
                          okButtonProps: { danger: true },
                          cancelText: 'Annuler',
                          onOk: () =>
                            remove.mutate(selected.id, {
                              onSuccess: () => {
                                setSelected(null);
                                setEdit(null);
                              },
                            }),
                        });
                      }}
                    >
                      Supprimer
                    </Button>
                  )}
                  <Button
                    type="primary"
                    disabled={!dirty}
                    loading={setPermissions.isPending}
                    onClick={() =>
                      setPermissions.mutate(
                        { id: selected.id, permissions: draft },
                        {
                          onSuccess: (role) => {
                            setSelected(role);
                            setEdit(null);
                          },
                        },
                      )
                    }
                  >
                    Enregistrer
                  </Button>
                </Flex>
              </PermissionGate>
            )
          }
        >
          {!selected ? (
            <Typography.Text type="secondary">
              Choisissez un rôle pour voir et modifier ses permissions.
            </Typography.Text>
          ) : (
            <>
              {selected.isSystem && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Rôle livré avec la plateforme"
                  description="Ses permissions restent modifiables ; son code et son existence, non."
                />
              )}
              {!selected.isSystem && (
                <Flex gap={8} align="center" style={{ marginBottom: 16 }}>
                  <Input
                    defaultValue={selected.name}
                    maxLength={60}
                    style={{ maxWidth: 280 }}
                    onPressEnter={(event) =>
                      rename.mutate({
                        id: selected.id,
                        name: event.currentTarget.value,
                      })
                    }
                  />
                  <Typography.Text type="secondary">
                    Entrée pour renommer
                  </Typography.Text>
                </Flex>
              )}
              {selected.userCount > 0 && (
                <Typography.Paragraph type="secondary">
                  {selected.userCount} compte(s) portent ce rôle : toute
                  modification les touche tous.
                </Typography.Paragraph>
              )}
              <PermissionMatrix
                modules={modules.data}
                value={draft}
                onChange={(permissions) =>
                  setEdit({ roleId: selected.id, permissions })
                }
              />
            </>
          )}
        </Card>
      </Flex>

      <Modal
        open={createOpen}
        title="Nouveau rôle"
        okText="Créer"
        cancelText="Annuler"
        okButtonProps={{ loading: create.isPending }}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          form
            .validateFields()
            .then((values) =>
              create.mutate(
                { ...values, permissions: [] },
                {
                  onSuccess: (role) => {
                    setCreateOpen(false);
                    form.resetFields();
                    select(role);
                  },
                },
              ),
            )
            .catch(() => undefined);
        }}
      >
        <Typography.Paragraph type="secondary">
          Le rôle naît sans permission : cochez-les ensuite dans la liste.
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Code"
            extra="Majuscules, sans espace. Définitif."
            rules={[
              { required: true, message: 'Le code est obligatoire.' },
              {
                pattern: /^[A-Z][A-Z0-9_]{2,29}$/,
                message: 'Majuscules, chiffres et _ seulement, 3 à 30 signes.',
              },
            ]}
          >
            <Input placeholder="SUPERVISEUR" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: 'Le nom est obligatoire.' }]}
          >
            <Input maxLength={60} placeholder="Superviseur" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default RolesPage;
