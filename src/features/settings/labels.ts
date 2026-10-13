/**
 * Les six paramètres de la V1 (DATABASE.md §5.2). Chacun dit ce qu'il change
 * concrètement : un seuil mal réglé bloque un inventaire ou laisse passer un
 * écart de caisse sans contrôle.
 */
export interface SettingDefinition {
  key: string;
  label: string;
  hint: string;
  kind: 'money' | 'integer' | 'percent' | 'boolean' | 'time';
  min?: number;
  max?: number;
}

export const SETTINGS: { group: string; items: SettingDefinition[] }[] = [
  {
    group: 'Caisse',
    items: [
      {
        key: 'cash.tolerance_xof',
        label: 'Tolérance d’écart',
        hint: 'En deçà, une session se clôture conforme sans commentaire. À 0, le moindre écart demande une justification.',
        kind: 'money',
        min: 0,
      },
      {
        key: 'cash.auto_close_time',
        label: 'Clôture automatique',
        hint: 'Heure à laquelle une caisse restée ouverte est clôturée d’office, et signalée comme telle.',
        kind: 'time',
      },
    ],
  },
  {
    group: 'Ventes',
    items: [
      {
        key: 'sales.default_discount_cap_percent',
        label: 'Plafond de remise par défaut',
        hint: 'S’applique aux caissiers sans plafond propre. Au-delà, la vente demande l’accord d’un administrateur.',
        kind: 'percent',
        min: 0,
        max: 100,
      },
    ],
  },
  {
    group: 'Stock',
    items: [
      {
        key: 'stock.allow_negative',
        label: 'Autoriser le stock négatif',
        hint: 'Désactivé, une sortie sans stock est refusée. À n’activer que pour rattraper une situation connue.',
        kind: 'boolean',
      },
      {
        key: 'stock.adjust_validation_threshold',
        label: 'Seuil de validation d’un écart d’inventaire',
        hint: 'Au-delà de cet écart en unités, la validation demande la permission inventories:validate (RG-04).',
        kind: 'integer',
        min: 0,
      },
    ],
  },
  {
    group: 'Boutique en ligne',
    items: [
      {
        key: 'ecommerce.reservation_ttl_minutes',
        label: 'Durée d’une réservation',
        hint: 'Temps pendant lequel une commande web immobilise le stock avant de le relâcher.',
        kind: 'integer',
        min: 1,
      },
    ],
  },
];
