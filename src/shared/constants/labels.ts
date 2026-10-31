import type {
  CashSessionStatus,
  EinvoiceStatus,
  InvoiceMode,
  NormalizedInvoiceKind,
  NormalizedInvoiceStatus,
  PaymentMethod,
  RoleCode,
  TaxGroup,
  TaxRegime,
} from '../api/types';

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: 'Espèces',
  MTN_MOMO: 'MTN MoMo',
  MOOV_MONEY: 'Moov Money',
  CARD: 'Carte bancaire',
  BANK_TRANSFER: 'Virement',
  ONLINE: 'Paiement en ligne',
};

export const cashSessionStatusLabel: Record<CashSessionStatus, string> = {
  OPEN: 'Ouverte',
  CLOSED: 'Clôturée, à vérifier',
  CONFORM: 'Conforme',
  NON_CONFORM: 'Non conforme',
  REGULARIZED: 'Régularisée',
};

/** Couleurs de Tag Ant Design par statut (composant `StatusTag`). */
export const cashSessionStatusColor: Record<CashSessionStatus, string> = {
  OPEN: 'processing',
  CLOSED: 'warning',
  CONFORM: 'success',
  NON_CONFORM: 'error',
  REGULARIZED: 'geekblue',
};

export const roleLabel: Record<RoleCode, string> = {
  MAINTAINER: 'Mainteneur',
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  ACCOUNTANT: 'Comptable',
  STOREKEEPER: 'Magasinier',
  CASHIER: 'Caissier',
};

/** Page d'accueil par rôle (FRONTEND.md §1). */
export const roleHomePath: Record<RoleCode, string> = {
  MAINTAINER: '/dashboard',
  SUPER_ADMIN: '/dashboard',
  ADMIN: '/dashboard',
  ACCOUNTANT: '/cash-sessions/to-verify',
  STOREKEEPER: '/stock',
  CASHIER: '/pos',
};

// ──────────────────── facture normalisée e-MECeF (DGI) ───────────────────

/** Ce que le caissier lit sur sa vente (FRONTEND-FACTURE §3.2). */
export const einvoiceStatusLabel: Record<EinvoiceStatus, string> = {
  NOT_REQUESTED: 'Reçu simple',
  PENDING: 'Facture en cours',
  CONFIRMED: 'Facture normalisée',
  REJECTED: 'Facture rejetée',
};

export const einvoiceStatusColor: Record<EinvoiceStatus, string> = {
  NOT_REQUESTED: 'default',
  PENDING: 'processing',
  CONFIRMED: 'success',
  REJECTED: 'error',
};

/**
 * Statut de la facture elle-même, au journal. « Soumise » et « en cours » se
 * distinguent : la première attend la confirmation de la DGI, la seconde
 * n'est pas encore partie.
 */
export const normalizedInvoiceStatusLabel: Record<
  NormalizedInvoiceStatus,
  string
> = {
  PENDING: 'En attente d’envoi',
  SUBMITTED: 'Soumise à la DGI',
  CONFIRMED: 'Confirmée',
  REJECTED: 'Rejetée',
  EXPIRED: 'Abandonnée (délai dépassé)',
};

export const normalizedInvoiceStatusColor: Record<
  NormalizedInvoiceStatus,
  string
> = {
  PENDING: 'default',
  SUBMITTED: 'processing',
  CONFIRMED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning',
};

export const invoiceKindLabel: Record<NormalizedInvoiceKind, string> = {
  SALE: 'Facture',
  CREDIT_NOTE: 'Avoir',
};

export const taxGroupLabel: Record<TaxGroup, string> = {
  A: 'A — Exonéré',
  B: 'B — Taxable (TVA 18 %)',
  C: 'C — Exportation',
  D: 'D — Régime spécial TVA',
  E: 'E — Régime TPS',
  F: 'F — Réservé',
};

/**
 * Seuls ces trois groupes sont proposés à la saisie (§B1) ; les autres
 * restent dans la table pour afficher une facture ancienne sans trou.
 */
export const SUPPORTED_TAX_GROUPS: TaxGroup[] = ['A', 'B', 'E'];

/** Groupe par défaut d'un produit selon le régime de l'entreprise. */
export const defaultTaxGroup: Record<TaxRegime, TaxGroup> = {
  VAT: 'B',
  TPS: 'E',
};

export const taxRegimeLabel: Record<TaxRegime, string> = {
  VAT: 'TVA',
  TPS: 'TPS',
};

export const invoiceModeLabel: Record<InvoiceMode, string> = {
  DISABLED: 'Désactivée',
  ALWAYS: 'Systématique',
  ON_DEMAND: 'À la demande du client',
};

/**
 * Motifs de rejet que nous savons expliquer (§12). Les autres codes `DGI_*`
 * portent le message de la DGI : elle est mieux placée que nous pour dire
 * pourquoi elle a refusé.
 */
export const rejectionReasonLabel: Record<string, string> = {
  TOTAL_MISMATCH:
    'Le montant calculé par la DGI ne correspond pas au montant de la vente. Contactez le support.',
  DGI_99: 'La DGI n’a pas pu traiter la facture.',
  DGI_1: 'Trop de factures en attente chez la DGI.',
  DGI_3: 'Type de facture refusé par la DGI.',
  DGI_8: 'Facture sans article : la DGI l’a refusée.',
  DGI_20: 'La DGI ne reconnaît plus cette facture.',
};
