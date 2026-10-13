import type { InventoryStatus } from '../../shared/api/types';

export const INVENTORY_STATUS: Record<
  InventoryStatus,
  { label: string; color: string }
> = {
  IN_PROGRESS: { label: 'Comptage en cours', color: 'processing' },
  SUBMITTED: { label: 'À valider', color: 'warning' },
  VALIDATED: { label: 'Validé', color: 'success' },
  CANCELLED: { label: 'Annulé', color: 'error' },
};

export const INVENTORY_STATUS_OPTIONS = Object.entries(INVENTORY_STATUS).map(
  ([value, info]) => ({ value, label: info.label }),
);
