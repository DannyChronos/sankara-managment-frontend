import { Checkbox, Collapse, Flex, Typography } from 'antd';
import type { PermissionModule } from '../../../shared/api/types';

interface Props {
  modules: PermissionModule[];
  value: string[];
  disabled?: boolean;
  onChange: (permissions: string[]) => void;
}

/**
 * Les permissions se lisent par module : personne ne raisonne sur une liste
 * de soixante codes. Chaque module se coche en bloc ou ligne à ligne.
 */
export function PermissionMatrix({
  modules,
  value,
  disabled,
  onChange,
}: Props) {
  const toggle = (code: string, checked: boolean) =>
    onChange(
      checked ? [...value, code] : value.filter((item) => item !== code),
    );

  const toggleModule = (module: PermissionModule, checked: boolean) => {
    const codes = module.permissions.map((permission) => permission.code);
    onChange(
      checked
        ? [...new Set([...value, ...codes])]
        : value.filter((item) => !codes.includes(item)),
    );
  };

  return (
    <Collapse
      items={modules.map((module) => {
        const codes = module.permissions.map((permission) => permission.code);
        const granted = codes.filter((code) => value.includes(code));

        return {
          key: module.code,
          label: (
            <Flex align="center" justify="space-between" gap={12}>
              {/* Seule la case arrête la propagation : cocher le module ne
                  replie pas le panneau, mais cliquer son nom l'ouvre. */}
              <span onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  aria-label={module.name}
                  disabled={disabled}
                  checked={granted.length === codes.length}
                  indeterminate={
                    granted.length > 0 && granted.length < codes.length
                  }
                  onChange={(event) =>
                    toggleModule(module, event.target.checked)
                  }
                />
              </span>
              <span style={{ flex: 1 }}>{module.name}</span>
              <Typography.Text type="secondary">
                {granted.length}/{codes.length}
              </Typography.Text>
            </Flex>
          ),
          children: (
            <Flex vertical gap={8}>
              {module.permissions.map((permission) => (
                <Checkbox
                  key={permission.code}
                  disabled={disabled}
                  checked={value.includes(permission.code)}
                  onChange={(event) =>
                    toggle(permission.code, event.target.checked)
                  }
                >
                  {permission.label}{' '}
                  <Typography.Text type="secondary" code>
                    {permission.code}
                  </Typography.Text>
                </Checkbox>
              ))}
            </Flex>
          ),
        };
      })}
    />
  );
}
