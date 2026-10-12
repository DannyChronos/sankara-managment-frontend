import { useCallback } from 'react';
import { useAuthStore } from './auth.store';

/**
 * `can('cash-sessions:verify')` — masque les menus et les boutons.
 * Le backend reste l'arbitre : ceci ne fait qu'éviter d'afficher
 * une action qui serait refusée (FRONTEND.md §6).
 */
export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const can = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.roleCode === 'SUPER_ADMIN') return true;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const canAny = useCallback(
    (...permissions: string[]): boolean => permissions.some(can),
    [can],
  );

  return { can, canAny };
}
