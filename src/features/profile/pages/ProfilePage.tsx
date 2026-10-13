import {
  Alert,
  Card,
  Col,
  Descriptions,
  Flex,
  Row,
  Tag,
  Typography,
} from 'antd';
import { PageHeader, PageSkeleton } from '../../../shared/components';
import { useAuth } from '../../../shared/auth/useAuth';
import { roleLabel } from '../../../shared/constants/labels';
import { ChangePasswordCard } from '../components/ChangePasswordCard';
import { MyPermissions } from '../components/MyPermissions';

/**
 * Fiche personnelle. Elle est en lecture seule : un compte se modifie par
 * l'administration, pas par son porteur — c'est ce qui rend le journal
 * d'audit lisible. Seul le mot de passe se change ici.
 */
export function ProfilePage() {
  const { user, siteId } = useAuth();

  if (!user) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title={user.fullName}
        subtitle={roleLabel[user.roleCode] ?? user.roleCode}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Mon compte">
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: 'name', label: 'Nom', children: user.fullName },
                {
                  key: 'role',
                  label: 'Rôle',
                  children: roleLabel[user.roleCode] ?? user.roleCode,
                },
                { key: 'phone', label: 'Téléphone', children: user.phone },
                {
                  key: 'email',
                  label: 'Email',
                  children: user.email ?? '—',
                },
                {
                  key: 'discount',
                  label: 'Plafond de remise',
                  children:
                    user.discountCapPercent === null
                      ? 'Valeur par défaut des paramètres'
                      : `${user.discountCapPercent} %`,
                },
              ]}
            />

            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="Ces informations se modifient par l’administration"
              description="Un compte n’est pas modifiable par son porteur : c’est ce qui garde le journal d’audit lisible. Demandez à un administrateur."
            />
          </Card>

          <Card title="Mes sites" style={{ marginTop: 16 }}>
            {user.sites.length === 0 ? (
              <Typography.Text type="secondary">
                Aucun site rattaché.
              </Typography.Text>
            ) : (
              <Flex gap={8} wrap>
                {user.sites.map((site) => (
                  <Tag
                    key={site.id}
                    color={site.id === siteId ? 'blue' : undefined}
                  >
                    {site.name} ({site.code})
                    {site.id === siteId ? ' · site courant' : ''}
                    {site.isDefault ? ' · par défaut' : ''}
                  </Tag>
                ))}
              </Flex>
            )}
            <Typography.Paragraph
              type="secondary"
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              Le site courant se change en haut de l’écran. Il décide de ce que
              vous voyez : stock, ventes et caisses en dépendent.
            </Typography.Paragraph>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <ChangePasswordCard />

          <Card
            title={`Mes permissions (${user.permissions.length})`}
            style={{ marginTop: 16 }}
          >
            <MyPermissions permissions={user.permissions} />
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default ProfilePage;
