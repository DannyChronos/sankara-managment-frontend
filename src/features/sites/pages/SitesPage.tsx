import { useState } from 'react';
import { App, Button, Card, Switch, Table, Tag } from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  PermissionGate,
} from '../../../shared/components';
import { formatDate } from '../../../shared/utils/format';
import {
  useAllSites,
  useCreateSite,
  useSetSiteStatus,
  useUpdateSite,
} from '../hooks';
import { SiteForm } from '../components/SiteForm';
import { siteTypeLabel } from '../labels';
import type { SiteDetail } from '../../../shared/api/types';

export function SitesPage() {
  // `App.useApp()` plutôt que `Modal.confirm` : la fonction statique ignore
  // le thème et la locale du contexte.
  const { modal } = App.useApp();
  const [editing, setEditing] = useState<SiteDetail | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const sites = useAllSites();
  const create = useCreateSite();
  const update = useUpdateSite();
  const setStatus = useSetSiteStatus();

  if (sites.isPending) return <PageSkeleton />;
  if (sites.isError) {
    return (
      <ErrorState error={sites.error} onRetry={() => void sites.refetch()} />
    );
  }

  return (
    <>
      <PageHeader
        title="Sites"
        subtitle={`${sites.data.meta.total} site(s)`}
        actions={
          <PermissionGate perm="sites:manage">
            <Button
              type="primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Nouveau site
            </Button>
          </PermissionGate>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table<SiteDetail>
          rowKey="id"
          pagination={false}
          dataSource={sites.data.data}
          columns={[
            { title: 'Code', dataIndex: 'code', width: 100 },
            { title: 'Nom', dataIndex: 'name' },
            {
              title: 'Type',
              dataIndex: 'type',
              width: 180,
              render: (value: string) => siteTypeLabel[value] ?? value,
            },
            {
              title: 'Caisse',
              dataIndex: 'canSell',
              width: 110,
              render: (value: boolean) =>
                value ? <Tag color="success">oui</Tag> : <Tag>non</Tag>,
            },
            {
              title: 'En ligne',
              dataIndex: 'isEcommerceSource',
              width: 110,
              render: (value: boolean) =>
                value ? <Tag color="geekblue">exposé</Tag> : '—',
            },
            {
              title: 'Comptes',
              dataIndex: 'userCount',
              align: 'right',
              width: 100,
            },
            {
              title: 'Créé le',
              dataIndex: 'createdAt',
              width: 130,
              render: (value: string) => formatDate(value),
            },
            {
              title: 'Actif',
              dataIndex: 'isActive',
              width: 90,
              render: (value: boolean, row) => (
                <PermissionGate
                  perm="sites:manage"
                  fallback={
                    value ? <Tag color="success">oui</Tag> : <Tag>non</Tag>
                  }
                >
                  <Switch
                    size="small"
                    checked={value}
                    aria-label={`Site ${row.code} actif`}
                    loading={setStatus.isPending}
                    onChange={(next) => {
                      if (next) {
                        setStatus.mutate({ id: row.id, isActive: true });
                        return;
                      }
                      modal.confirm({
                        title: `Désactiver ${row.code} ?`,
                        content:
                          'Le site disparaît des écrans et des sélecteurs. Un site qui porte encore du stock ne peut pas être désactivé.',
                        okText: 'Désactiver',
                        okButtonProps: { danger: true },
                        cancelText: 'Annuler',
                        onOk: () =>
                          setStatus.mutate({ id: row.id, isActive: false }),
                      });
                    }}
                  />
                </PermissionGate>
              ),
            },
            {
              title: '',
              key: 'actions',
              width: 110,
              render: (_, row) => (
                <PermissionGate perm="sites:manage">
                  <Button
                    type="link"
                    onClick={() => {
                      setEditing(row);
                      setFormOpen(true);
                    }}
                  >
                    Modifier
                  </Button>
                </PermissionGate>
              ),
            },
          ]}
        />
      </Card>

      {formOpen && (
        <SiteForm
          site={editing ?? undefined}
          open
          pending={create.isPending || update.isPending}
          onCancel={() => setFormOpen(false)}
          onSubmit={(payload) => {
            if (editing) {
              const { code: _code, ...rest } = payload;
              update.mutate(
                { id: editing.id, payload: rest },
                { onSuccess: () => setFormOpen(false) },
              );
            } else {
              create.mutate(payload, { onSuccess: () => setFormOpen(false) });
            }
          }}
        />
      )}
    </>
  );
}

export default SitesPage;
