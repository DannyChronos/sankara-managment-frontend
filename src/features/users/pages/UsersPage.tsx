import { useState } from 'react';
import {
  App,
  Button,
  Card,
  Dropdown,
  Flex,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { formatDateTime } from '../../../shared/utils/format';
import { useRoles } from '../../rbac/hooks';
import { useSites } from '../../sites/hooks';
import {
  useCreateUser,
  useSetUserSites,
  useSetUserStatus,
  useUpdateUser,
  useUsers,
} from '../hooks';
import { UserForm } from '../components/UserForm';
import { UserSitesModal } from '../components/UserSitesModal';
import { ALL_SITES_ROLES, USER_STATUS } from '../labels';
import type { CreatedUser, UserSummary } from '../../../shared/api/types';

export function UsersPage() {
  const { user: me } = useAuth();
  // `App.useApp()` plutôt que `Modal.confirm` : la fonction statique ignore
  // le thème et la locale du contexte.
  const { modal } = App.useApp();
  const [q, setQ] = useState('');
  const [roleCode, setRoleCode] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [sitesFor, setSitesFor] = useState<UserSummary | null>(null);
  const [created, setCreated] = useState<CreatedUser | null>(null);

  const roles = useRoles();
  const sites = useSites();
  const create = useCreateUser();
  const update = useUpdateUser();
  const setStatus = useSetUserStatus();
  const setSites = useSetUserSites();

  const users = useUsers({
    page,
    limit: 20,
    ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
    ...(roleCode ? { roleCode } : {}),
  });

  if (users.isPending) return <PageSkeleton />;
  if (users.isError) {
    return (
      <ErrorState error={users.error} onRetry={() => void users.refetch()} />
    );
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.data.meta.total} compte(s)`}
        actions={
          <PermissionGate perm="users:create">
            <Button
              type="primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Nouvel utilisateur
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Nom, email ou téléphone"
            style={{ maxWidth: 320 }}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Tous les rôles"
            style={{ minWidth: 200 }}
            value={roleCode}
            onChange={(value?: string) => {
              setRoleCode(value);
              setPage(1);
            }}
            options={(roles.data ?? []).map((role) => ({
              value: role.code,
              label: role.name,
            }))}
          />
        </Flex>

        <Table<UserSummary>
          rowKey="id"
          dataSource={users.data.data}
          loading={users.isFetching}
          pagination={{
            current: users.data.meta.page,
            pageSize: users.data.meta.limit,
            total: users.data.meta.total,
            onChange: setPage,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Nom',
              dataIndex: 'fullName',
              render: (value: string, row) => (
                <>
                  <div>{value}</div>
                  <small style={{ color: '#8a98a8' }}>
                    {row.email ?? row.phone}
                  </small>
                </>
              ),
            },
            {
              title: 'Rôle',
              dataIndex: ['role', 'name'],
              width: 180,
            },
            {
              title: 'Sites',
              key: 'sites',
              render: (_, row) =>
                row.sites.length === 0 ? (
                  ALL_SITES_ROLES.includes(row.role.code) ? (
                    <Tag color="blue">tous les sites</Tag>
                  ) : (
                    <Tag color="warning">aucun</Tag>
                  )
                ) : (
                  <Space size={4} wrap>
                    {row.sites.map((site) => (
                      <Tag
                        key={site.id}
                        color={site.isDefault ? 'blue' : undefined}
                      >
                        {site.code}
                      </Tag>
                    ))}
                  </Space>
                ),
            },
            {
              title: 'Remise max',
              dataIndex: 'discountCapPercent',
              align: 'right',
              width: 110,
              render: (value: number | null) =>
                value === null ? 'défaut' : `${value} %`,
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              width: 130,
              render: (value: keyof typeof USER_STATUS) => (
                <Tag color={USER_STATUS[value]?.color}>
                  {USER_STATUS[value]?.label ?? value}
                </Tag>
              ),
            },
            {
              title: 'Dernière connexion',
              dataIndex: 'lastLoginAt',
              width: 170,
              render: (value: string | null) =>
                value ? formatDateTime(value) : 'jamais',
            },
            {
              title: '',
              key: 'actions',
              width: 60,
              render: (_, row) => (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      { key: 'edit', label: 'Modifier' },
                      { key: 'sites', label: 'Gérer les sites' },
                      { type: 'divider' },
                      row.status === 'ACTIVE'
                        ? {
                            key: 'disable',
                            label: 'Désactiver',
                            danger: true,
                            // On ne se coupe pas soi-même l'accès.
                            disabled: row.id === me?.id,
                          }
                        : {
                            key: 'enable',
                            label:
                              row.status === 'LOCKED'
                                ? 'Déverrouiller'
                                : 'Réactiver',
                          },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'edit') {
                        setEditing(row);
                        setFormOpen(true);
                      }
                      if (key === 'sites') setSitesFor(row);
                      if (key === 'enable') {
                        setStatus.mutate({ id: row.id, status: 'ACTIVE' });
                      }
                      if (key === 'disable') {
                        modal.confirm({
                          title: `Désactiver ${row.fullName} ?`,
                          content:
                            'Ses sessions ouvertes sont révoquées immédiatement. Le compte n’est pas supprimé : son historique reste intact.',
                          okText: 'Désactiver',
                          okButtonProps: { danger: true },
                          cancelText: 'Annuler',
                          onOk: () =>
                            setStatus.mutate({
                              id: row.id,
                              status: 'DISABLED',
                            }),
                        });
                      }
                    },
                  }}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    aria-label="Actions"
                  />
                </Dropdown>
              ),
            },
          ]}
        />
      </Card>

      {formOpen && (
        <UserForm
          user={editing ?? undefined}
          roles={roles.data ?? []}
          sites={sites.data?.data ?? []}
          open
          pending={create.isPending || update.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(payload) => {
            if (editing) {
              update.mutate(
                { id: editing.id, payload },
                { onSuccess: () => setFormOpen(false) },
              );
            } else {
              create.mutate(payload, {
                onSuccess: (user) => {
                  setFormOpen(false);
                  setCreated(user);
                },
              });
            }
          }}
        />
      )}

      {sitesFor && (
        <UserSitesModal
          key={sitesFor.id}
          user={sitesFor}
          sites={sites.data?.data ?? []}
          open
          pending={setSites.isPending}
          onCancel={() => setSitesFor(null)}
          onSubmit={(siteIds, defaultSiteId) =>
            setSites.mutate(
              { id: sitesFor.id, siteIds, defaultSiteId },
              { onSuccess: () => setSitesFor(null) },
            )
          }
        />
      )}

      <Modal
        open={Boolean(created?.temporaryPassword)}
        title="Mot de passe provisoire"
        okText="J’ai noté"
        cancelButtonProps={{ style: { display: 'none' } }}
        onOk={() => setCreated(null)}
        onCancel={() => setCreated(null)}
      >
        <Typography.Paragraph>
          Le compte de <strong>{created?.fullName}</strong> est créé.
          Transmettez-lui ce mot de passe : il ne sera plus affiché.
        </Typography.Paragraph>
        <Typography.Paragraph copyable={{ text: created?.temporaryPassword }}>
          <Typography.Text code style={{ fontSize: 18 }}>
            {created?.temporaryPassword}
          </Typography.Text>
        </Typography.Paragraph>
      </Modal>
    </>
  );
}

export default UsersPage;
