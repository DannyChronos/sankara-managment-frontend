import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '../../app/FullPageSpinner';
import { useAuth } from './useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuth();
  const location = useLocation();

  // Tant que le refresh silencieux du démarrage n'a pas répondu, on ne peut
  // pas conclure à une déconnexion : on attend plutôt que de rejeter vers
  // /login un utilisateur qui a une session valide.
  if (!initialized) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
