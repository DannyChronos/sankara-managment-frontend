import type { ReportType } from '../../shared/api/types';

/**
 * Les quatre rapports de la V1. Chacun lit les mêmes données que les écrans
 * correspondants : un rapport ne recalcule rien, il regroupe.
 */
export const REPORTS: { type: ReportType; label: string; hint: string }[] = [
  {
    type: 'sales',
    label: 'Ventes',
    hint: 'Jour par jour et par site : volume, remises, retours, net encaissé.',
  },
  {
    type: 'stock',
    label: 'Stock',
    hint: 'État à l’instant présent et valorisation au prix de revient.',
  },
  {
    type: 'movements',
    label: 'Mouvements',
    hint: 'Chaque écriture du registre sur la période, avec son motif.',
  },
  {
    type: 'cash-sessions',
    label: 'Caisses',
    hint: 'Sessions, montants déclarés et écarts constatés.',
  },
];

/** Rapports dont la période a un sens — l'état du stock, lui, est instantané. */
export const PERIODIC_REPORTS: ReportType[] = [
  'sales',
  'movements',
  'cash-sessions',
];

/** Rapports qui se filtrent par caissier. */
export const CASHIER_REPORTS: ReportType[] = ['sales', 'cash-sessions'];
