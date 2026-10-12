import type { CashSessionStatus, PaymentMethod, RoleCode } from '../api/types';

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
