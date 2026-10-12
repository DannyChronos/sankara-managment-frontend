import { Navigate } from 'react-router-dom';
import { useAuth } from '../shared/auth/useAuth';
import { roleHomePath } from '../shared/constants/labels';

/** Chaque rôle a son écran d'accueil (FRONTEND.md §1). */
export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomePath[user.roleCode]} replace />;
}
