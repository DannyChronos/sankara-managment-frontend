/**
 * Statuts d'une commande. La V1 ne fait que de la caisse : une vente naît
 * `PAID` et ne bouge plus, sauf annulation ou retour. Les statuts de
 * livraison sont déclarés pour le jour où les commandes web arriveront.
 */
export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  PENDING_PAYMENT: { label: 'En attente de paiement', color: 'warning' },
  PAID: { label: 'Payée', color: 'success' },
  PREPARING: { label: 'En préparation', color: 'processing' },
  SHIPPED: { label: 'Expédiée', color: 'geekblue' },
  DELIVERED: { label: 'Livrée', color: 'cyan' },
  COMPLETED: { label: 'Terminée', color: 'success' },
  CANCELLED: { label: 'Annulée', color: 'error' },
  PARTIALLY_RETURNED: { label: 'Retour partiel', color: 'orange' },
  RETURNED: { label: 'Retournée', color: 'volcano' },
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(
  ([value, info]) => ({ value, label: info.label }),
);
