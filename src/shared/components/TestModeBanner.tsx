import { Alert } from 'antd';
import { Link } from 'react-router-dom';
import { usePermission } from '../auth/usePermission';
import { usePosFiscalContext } from '../../features/fiscal/hooks';

/**
 * Bandeau d'avertissement affiché **partout**, caisse comprise, quand les
 * factures partent vers la plateforme de test de la DGI (§4.4).
 *
 * Il est volontairement impossible à manquer : une facture émise en test
 * ressemble en tout point à une vraie — même QR code, même code MECeF — et
 * rien d'autre que ce bandeau ne dit au caissier qu'elle ne vaut rien.
 */
export function TestModeBanner() {
  const context = usePosFiscalContext();
  const { can } = usePermission();

  if (!context.data) return null;
  const { env, invoiceMode } = context.data;
  if (env !== 'TEST' || invoiceMode === 'DISABLED') return null;

  return (
    <Alert
      type="warning"
      banner
      showIcon
      className="no-print"
      message={
        <>
          Factures normalisées en mode TEST : elles n’ont aucune valeur fiscale.
          {/* Le caissier voit l'avertissement, mais l'écran de réglage ne
              lui est pas ouvert : proposer le lien serait promettre un 403. */}
          {can('fiscal:manage') && (
            <>
              {' '}
              <Link to="/settings/fiscal">Paramètres fiscaux</Link>
            </>
          )}
        </>
      }
    />
  );
}
