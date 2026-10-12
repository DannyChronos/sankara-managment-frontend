import { Alert } from 'antd';
import { useOnline } from '../hooks/useOnline';

/** Bandeau hors ligne — connexion 3G instable (CDC §6, FRONTEND.md §14). */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <Alert
      banner
      type="warning"
      showIcon
      message="Connexion perdue — les enregistrements sont suspendus jusqu’au retour du réseau."
    />
  );
}
