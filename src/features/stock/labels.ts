/**
 * Libellés du vocabulaire stock. Séparés des composants : les Tag ne doivent
 * exporter que des composants (react-refresh), et ces tables servent aussi
 * aux filtres et aux formulaires.
 */

/** Types de mouvement du registre (DATABASE.md §6). */
export const MOVEMENT: Record<string, { label: string; color: string }> = {
  PRODUCTION_IN: { label: 'Entrée production', color: 'green' },
  PURCHASE_IN: { label: 'Réception', color: 'green' },
  RETURN_IN: { label: 'Retour', color: 'cyan' },
  TRANSFER_IN: { label: 'Transfert entrant', color: 'geekblue' },
  ADJUSTMENT_IN: { label: 'Ajustement +', color: 'lime' },
  SALE_OUT: { label: 'Vente', color: 'blue' },
  TRANSFER_OUT: { label: 'Transfert sortant', color: 'geekblue' },
  WRITE_OFF: { label: 'Casse', color: 'red' },
  SAMPLE_OUT: { label: 'Échantillon', color: 'orange' },
  INTERNAL_USE_OUT: { label: 'Usage interne', color: 'orange' },
  ADJUSTMENT_OUT: { label: 'Ajustement −', color: 'volcano' },
  REVERSAL: { label: 'Contre-écriture', color: 'magenta' },
};

export const MOVEMENT_OPTIONS = Object.entries(MOVEMENT).map(
  ([value, info]) => ({ value, label: info.label }),
);

/** Statuts d'un bon : un bon validé ne revient jamais en brouillon. */
export const OPERATION_STATUS: Record<
  string,
  { label: string; color: string }
> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  VALIDATED: { label: 'Validé', color: 'success' },
  CANCELLED: { label: 'Annulé', color: 'error' },
};

export const OPERATION_TYPE: Record<string, string> = {
  PRODUCTION_ENTRY: 'Entrée de production',
  PURCHASE_RECEIPT: 'Réception fournisseur',
  WRITE_OFF: 'Casse',
  SAMPLE: 'Échantillon',
  INTERNAL_USE: 'Usage interne',
};

/** Les types d'entrée alimentent le stock, les autres le diminuent. */
export const ENTRY_TYPES = ['PRODUCTION_ENTRY', 'PURCHASE_RECEIPT'];
