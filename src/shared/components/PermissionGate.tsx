import type { ReactNode } from 'react';
import { usePermission } from '../auth/usePermission';

/** N'affiche ses enfants que si l'utilisateur a la permission. */
export function PermissionGate({
  perm,
  children,
  fallback = null,
}: {
  perm: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermission();
  return <>{can(perm) ? children : fallback}</>;
}
