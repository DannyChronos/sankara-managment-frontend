import { Form, Input, InputNumber, Modal, Select } from 'antd';
import type { CreateUserPayload } from '../api';
import type { Role, UserSummary } from '../../../shared/api/types';

/** Un formulaire n'a besoin que de quoi nommer un site. */
type SiteOption = { id: string; code: string; name: string };

interface Props {
  /** Absent : création. Présent : modification de ce compte. */
  user?: UserSummary;
  roles: Role[];
  sites: SiteOption[];
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateUserPayload) => void;
}

/**
 * À la création, le mot de passe n'est pas saisi : le serveur en génère un
 * provisoire et le renvoie une seule fois. Les sites se modifient ensuite par
 * leur propre route — c'est un remplacement, pas une mise à jour partielle.
 */
export function UserForm({
  user,
  roles,
  sites,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<CreateUserPayload>();
  const editing = Boolean(user);
  // `useWatch` est typé, contrairement à `getFieldValue` dans un rendu
  // conditionnel : le site par défaut n'a de sens qu'à partir de deux sites.
  const pickedSites = Form.useWatch('siteIds', form) ?? [];

  return (
    <Modal
      open={open}
      title={editing ? `Modifier ${user?.fullName}` : 'Nouvel utilisateur'}
      okText={editing ? 'Enregistrer' : 'Créer le compte'}
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
                  value !== null &&
                  !(typeof value === 'string' && value.trim() === ''),
              ),
            ) as unknown as CreateUserPayload;
            onSubmit(payload);
          })
          .catch(() => undefined);
      }}
      afterOpenChange={(opened) => {
        if (opened) {
          form.setFieldsValue({
            firstName: user?.firstName ?? '',
            lastName: user?.lastName ?? '',
            email: user?.email ?? '',
            phone: user?.phone ?? '',
            roleId: user?.role.id,
            discountCapPercent: user?.discountCapPercent ?? undefined,
            ...(editing ? {} : { siteIds: [], defaultSiteId: undefined }),
          });
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="firstName"
          label="Prénom"
          rules={[{ required: true, message: 'Le prénom est obligatoire.' }]}
        >
          <Input maxLength={60} />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Nom"
          rules={[{ required: true, message: 'Le nom est obligatoire.' }]}
        >
          <Input maxLength={60} />
        </Form.Item>

        {/*
          L'email d'abord : c'est par lui que part le code d'activation, puis
          toute réinitialisation. Un compte sans email serait inactivable.
        */}
        <Form.Item
          name="email"
          label="Email"
          extra="Identifiant de connexion, et canal du code d’activation."
          rules={[
            { required: true, message: 'L’email est obligatoire.' },
            { type: 'email', message: 'Adresse email invalide.' },
          ]}
        >
          <Input maxLength={180} placeholder="awa@matelas-sankara.bj" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Téléphone"
          extra="Facultatif : second identifiant de connexion et secours par SMS."
          rules={[
            {
              pattern: /^\+?[0-9]{8,15}$/,
              message: 'Numéro invalide (8 à 15 chiffres).',
            },
          ]}
        >
          <Input maxLength={16} placeholder="+22997000011" />
        </Form.Item>

        <Form.Item
          name="roleId"
          label="Rôle"
          rules={[{ required: true, message: 'Choisissez un rôle.' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={roles.map((role) => ({
              value: role.id,
              label: role.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="discountCapPercent"
          label="Plafond de remise (%)"
          extra="Vide : le plafond par défaut des paramètres s’applique."
        >
          <InputNumber min={0} max={100} precision={0} style={{ width: 160 }} />
        </Form.Item>

        {!editing && (
          <>
            <Form.Item
              name="siteIds"
              label="Sites"
              extra="Un compte sans site ne peut ni vendre ni tenir de stock."
            >
              <Select
                mode="multiple"
                allowClear
                optionFilterProp="label"
                placeholder="Rattacher à un ou plusieurs sites"
                options={sites.map((site) => ({
                  value: site.id,
                  label: `${site.name} (${site.code})`,
                }))}
              />
            </Form.Item>

            {pickedSites.length > 1 && (
              <Form.Item name="defaultSiteId" label="Site par défaut">
                <Select
                  allowClear
                  options={sites
                    .filter((site) => pickedSites.includes(site.id))
                    .map((site) => ({ value: site.id, label: site.name }))}
                />
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
}
