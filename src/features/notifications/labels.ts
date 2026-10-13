/**
 * Les huit alertes émises par le backend (F-36). La couleur dit l'urgence :
 * rouge pour ce qui demande un arbitrage, orange pour ce qui demande un geste,
 * bleu pour ce qui informe.
 */
export const NOTIFICATION_TYPES: Record<
  string,
  { label: string; color: string }
> = {
  'stock.low': { label: 'Stock bas', color: 'warning' },
  'cash-session.to-verify': { label: 'Caisse à vérifier', color: 'warning' },
  'cash-session.non-conform': { label: 'Session non conforme', color: 'error' },
  'cash-session.force-closed': {
    label: 'Clôture automatique',
    color: 'error',
  },
  'transfer.received-with-gap': {
    label: 'Écart de transfert',
    color: 'error',
  },
  'transfer.shipped': { label: 'Transfert en route', color: 'processing' },
  'report.export-ready': { label: 'Export prêt', color: 'success' },
  'report.daily': { label: 'Rapport journalier', color: 'default' },
};

export const NOTIFICATION_TYPE_OPTIONS = Object.entries(NOTIFICATION_TYPES).map(
  ([value, info]) => ({ value, label: info.label }),
);
