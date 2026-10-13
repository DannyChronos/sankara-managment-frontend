import type { TransferStatus } from '../../shared/api/types';

/**
 * Un transfert passe de brouillon à expédié, puis réceptionné — avec ou sans
 * écart. L'écart n'est pas une erreur à corriger : c'est un constat, et il
 * reste visible sur le transfert.
 */
export const TRANSFER_STATUS: Record<
  TransferStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  SHIPPED: { label: 'En transit', color: 'processing' },
  RECEIVED: { label: 'Réceptionné', color: 'success' },
  RECEIVED_WITH_GAP: { label: 'Reçu avec écart', color: 'warning' },
  CANCELLED: { label: 'Annulé', color: 'error' },
};

export const TRANSFER_STATUS_OPTIONS = Object.entries(TRANSFER_STATUS).map(
  ([value, info]) => ({ value, label: info.label }),
);
