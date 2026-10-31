import type { EmecefLiveStatus } from '../../shared/api/types';

export type Severity = 'success' | 'warning' | 'error' | 'default';

/**
 * Trois états suffisent au quotidien : tout va bien, quelque chose traîne,
 * rien ne part. Le détail est dans les chiffres affichés en dessous.
 */
export function severityOf(status: EmecefLiveStatus): {
  severity: Severity;
  label: string;
} {
  if (!status.configured) {
    return { severity: 'default', label: 'Non configuré' };
  }
  if (status.queuePaused) {
    return { severity: 'error', label: 'Envoi suspendu' };
  }
  if (!status.reachable) {
    return { severity: 'error', label: 'DGI injoignable' };
  }
  if (
    status.tokenValidUntil &&
    new Date(status.tokenValidUntil).getTime() < Date.now()
  ) {
    return { severity: 'error', label: 'Jeton expiré' };
  }
  if (status.localRetrying > 0 || status.rejected > 0) {
    return { severity: 'warning', label: 'Relances en cours' };
  }
  return { severity: 'success', label: 'Joignable' };
}
