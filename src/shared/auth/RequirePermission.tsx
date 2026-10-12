import type { ReactNode } from 'react';
import { Result } from 'antd';
import { usePermission } from './usePermission';

interface Props {
  perm: string;
  children: ReactNode;
}

export function RequirePermission({ perm, children }: Props) {
  const { can } = usePermission();

  if (!can(perm)) {
    return (
      <Result
        status="403"
        title="Accès refusé"
        subTitle="Vous n’avez pas la permission d’ouvrir cette page."
      />
    );
  }

  return <>{children}</>;
}
