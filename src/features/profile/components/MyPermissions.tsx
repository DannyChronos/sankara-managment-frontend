import { Collapse, Empty, Flex, Tag, Typography } from 'antd';
import { usePermissionModules } from '../../rbac/hooks';
import { usePermission } from '../../../shared/auth/usePermission';

/**
 * « Qu'est-ce que j'ai le droit de faire ? » — la question revient dès qu'un
 * bouton manque quelque part. Le catalogue des permissions demande
 * `rbac:read` ; sans lui, on s'en tient à la liste brute des codes.
 */
export function MyPermissions({ permissions }: { permissions: string[] }) {
  const { can } = usePermission();
  const modules = usePermissionModules();
  const granted = new Set(permissions);

  if (!can('rbac:read') || modules.isError) {
    return (
      <Flex gap={6} wrap>
        {permissions.map((code) => (
          <Tag key={code}>{code}</Tag>
        ))}
      </Flex>
    );
  }

  if (modules.isPending)
    return <Typography.Text type="secondary">…</Typography.Text>;

  const sections = modules.data
    .map((module) => ({
      module,
      items: module.permissions.filter((permission) =>
        granted.has(permission.code),
      ),
    }))
    .filter((section) => section.items.length > 0);

  if (sections.length === 0) {
    return (
      <Empty
        description="Aucune permission."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Collapse
      size="small"
      items={sections.map(({ module, items }) => ({
        key: module.code,
        label: (
          <Flex justify="space-between" gap={12}>
            <span>{module.name}</span>
            <Typography.Text type="secondary">
              {items.length}/{module.permissions.length}
            </Typography.Text>
          </Flex>
        ),
        children: (
          <Flex vertical gap={4}>
            {items.map((permission) => (
              <span key={permission.code}>{permission.label}</span>
            ))}
          </Flex>
        ),
      }))}
    />
  );
}
