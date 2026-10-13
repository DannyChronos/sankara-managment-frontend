import type { SiteType } from '../../shared/api/types';

export const SITE_TYPES: { value: SiteType; label: string }[] = [
  { value: 'WAREHOUSE', label: 'Entrepôt' },
  { value: 'SHOP', label: 'Boutique' },
  { value: 'MIXED', label: 'Entrepôt et boutique' },
];

export const siteTypeLabel: Record<string, string> = Object.fromEntries(
  SITE_TYPES.map((entry) => [entry.value, entry.label]),
);
