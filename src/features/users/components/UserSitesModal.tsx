import { useState } from 'react';
import { Alert, Form, Modal, Select } from 'antd';
import type { UserSummary } from '../../../shared/api/types';

type SiteOption = { id: string; code: string; name: string };

interface Props {
  user: UserSummary;
  sites: SiteOption[];
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (siteIds: string[], defaultSiteId?: string) => void;
}

/**
 * Les sites se remplacent en bloc : la route est un PUT, pas une mise à jour
 * partielle. Retirer un site retire aussi l'accès à son stock et à ses ventes.
 */
export function UserSitesModal({
  user,
  sites,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [siteIds, setSiteIds] = useState<string[]>(
    user.sites.map((site) => site.id),
  );
  const [defaultSiteId, setDefaultSiteId] = useState<string | undefined>(
    user.sites.find((site) => site.isDefault)?.id,
  );

  const removed = user.sites.filter((site) => !siteIds.includes(site.id));

  return (
    <Modal
      open={open}
      title={`Sites de ${user.fullName}`}
      okText="Enregistrer"
      cancelText="Annuler"
      okButtonProps={{ loading: pending }}
      onCancel={onCancel}
      onOk={() =>
        onSubmit(
          siteIds,
          defaultSiteId && siteIds.includes(defaultSiteId)
            ? defaultSiteId
            : undefined,
        )
      }
    >
      {removed.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${removed.map((site) => site.code).join(', ')} sera retiré`}
          description="L’utilisateur perdra l’accès au stock et aux ventes de ce site."
        />
      )}

      <Form layout="vertical">
        <Form.Item label="Sites rattachés">
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            value={siteIds}
            onChange={setSiteIds}
            options={sites.map((site) => ({
              value: site.id,
              label: `${site.name} (${site.code})`,
            }))}
          />
        </Form.Item>

        {siteIds.length > 1 && (
          <Form.Item
            label="Site par défaut"
            extra="Celui sur lequel l’utilisateur arrive en se connectant."
          >
            <Select
              allowClear
              value={defaultSiteId}
              onChange={setDefaultSiteId}
              options={sites
                .filter((site) => siteIds.includes(site.id))
                .map((site) => ({ value: site.id, label: site.name }))}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
