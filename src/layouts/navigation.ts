import type { RoleCode } from '../shared/api/types';

/**
 * Menu déclaré une seule fois, avec la permission requise par entrée ; il est
 * ensuite filtré selon les permissions de l'utilisateur (FRONTEND.md §7.1).
 *
 * Chaque section et chaque entrée portent une phrase : elle s'affiche en
 * info-bulle. Vingt-deux écrans dont les noms se ressemblent — « Mouvements »,
 * « Transferts », « Bons d'entrée / sortie » — ne se devinent pas.
 */
export interface NavItem {
  key: string;
  label: string;
  path: string;
  perm: string;
  /** Ce que l'écran permet de faire, en une phrase. */
  hint: string;
}

export interface NavSection {
  key: string;
  label: string;
  /** Ce que la section couvre, en une phrase. */
  hint: string;
  /**
   * Métiers dont c'est le quotidien. Indicatif : ce sont les permissions,
   * pas cette liste, qui décident de ce qui s'affiche.
   */
  roles: RoleCode[];
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    key: 'home',
    label: 'Accueil',
    hint: 'Vue d’ensemble de l’activité du site courant.',
    roles: ['ADMIN', 'ACCOUNTANT'],
    items: [
      {
        key: 'dashboard',
        label: 'Tableau de bord',
        path: '/dashboard',
        perm: 'reports:read',
        hint: 'Chiffre d’affaires, caisses à vérifier, articles sous le seuil.',
      },
    ],
  },
  {
    key: 'cash',
    label: 'Caisse',
    hint: 'Vendre au comptoir et tenir sa propre caisse, de l’ouverture à la clôture.',
    roles: ['CASHIER'],
    items: [
      {
        key: 'pos',
        label: 'Point de vente',
        path: '/pos',
        perm: 'sales:create',
        hint: 'Encaisser une vente au comptoir.',
      },
      {
        key: 'my-session',
        label: 'Ma caisse',
        path: '/cash-sessions/me',
        perm: 'cash-sessions:open',
        hint: 'Ma caisse du jour : recette attendue et clôture.',
      },
      {
        key: 'my-sales',
        label: 'Historique de mes ventes',
        path: '/sales',
        perm: 'sales:read',
        hint: 'Les ventes que j’ai encaissées.',
      },
    ],
  },
  {
    key: 'control',
    label: 'Contrôle',
    hint: 'Vérifier les recettes déclarées par les caissiers et traiter les écarts.',
    roles: ['ACCOUNTANT', 'ADMIN'],
    items: [
      {
        key: 'to-verify',
        label: 'Sessions à vérifier',
        path: '/cash-sessions/to-verify',
        perm: 'cash-sessions:verify',
        hint: 'Caisses clôturées en attente de contrôle.',
      },
      {
        key: 'all-sessions',
        label: 'Toutes les sessions',
        path: '/cash-sessions',
        perm: 'cash-sessions:read-all',
        hint: 'Toutes les sessions de caisse et leurs écarts.',
      },
    ],
  },
  {
    key: 'stock',
    label: 'Stock',
    hint: 'Tenir l’entrepôt : entrées, sorties, transferts entre sites et inventaires.',
    roles: ['STOREKEEPER', 'ADMIN'],
    items: [
      {
        key: 'levels',
        label: 'État du stock',
        path: '/stock',
        perm: 'stock:read',
        hint: 'Stock physique, réservé et disponible, article par article.',
      },
      {
        key: 'movements',
        label: 'Mouvements',
        path: '/stock/movements',
        perm: 'stock:read',
        hint: 'Le registre des écritures de stock, en lecture seule.',
      },
      {
        key: 'operations',
        label: 'Bons d’entrée / sortie',
        path: '/stock/operations',
        perm: 'stock:read',
        hint: 'Entrées de production, réceptions, casse et échantillons.',
      },
      {
        key: 'transfers',
        label: 'Transferts',
        path: '/transfers',
        perm: 'transfers:read',
        hint: 'Marchandise envoyée d’un site à un autre.',
      },
      {
        key: 'inventories',
        label: 'Inventaires',
        path: '/inventories',
        perm: 'inventories:read',
        hint: 'Comptage physique et ajustement des écarts.',
      },
      {
        key: 'suppliers',
        label: 'Fournisseurs',
        path: '/suppliers',
        perm: 'stock:entry',
        hint: 'Qui livre les articles revendus, et ce qu’on a reçu d’eux.',
      },
    ],
  },
  {
    key: 'catalog',
    label: 'Catalogue',
    hint: 'Ce que l’enseigne vend : produits, variantes et prix.',
    roles: ['ADMIN'],
    items: [
      {
        key: 'products',
        label: 'Produits',
        path: '/catalog/products',
        perm: 'catalog:read',
        hint: 'Les produits, leurs variantes et leurs prix.',
      },
      {
        key: 'categories',
        label: 'Catégories',
        path: '/catalog/categories',
        perm: 'catalog:read',
        hint: 'L’arborescence qui classe les produits.',
      },
    ],
  },
  {
    key: 'sales',
    label: 'Ventes',
    hint: 'Historique des ventes, retours et fichier clients.',
    roles: ['ACCOUNTANT', 'ADMIN'],
    items: [
      {
        key: 'sales-list',
        label: 'Ventes',
        path: '/sales',
        perm: 'sales:read',
        hint: 'Toutes les ventes, avec annulations et retours.',
      },
      {
        key: 'customers',
        label: 'Clients',
        path: '/customers',
        perm: 'customers:read',
        hint: 'Fiches clients, achats passés et garanties en cours.',
      },
    ],
  },
  {
    key: 'reports',
    label: 'Rapports',
    hint: 'Chiffres consolidés par période, à l’écran ou exportés.',
    roles: ['ACCOUNTANT', 'ADMIN'],
    items: [
      {
        key: 'reports-sales',
        label: 'Rapports',
        path: '/reports',
        perm: 'reports:read',
        hint: 'Ventes, stock, mouvements et caisses, exportables en Excel ou PDF.',
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    hint: 'Paramétrer la plateforme : comptes, droits, sites et réglages.',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        key: 'users',
        label: 'Utilisateurs',
        path: '/users',
        perm: 'users:read',
        hint: 'Comptes, rôle attribué et rattachement aux sites.',
      },
      {
        key: 'roles',
        label: 'Rôles',
        path: '/rbac/roles',
        perm: 'rbac:read',
        hint: 'Ce que chaque rôle a le droit de faire.',
      },
      {
        key: 'sites',
        label: 'Sites',
        path: '/sites',
        perm: 'sites:read',
        hint: 'Entrepôts et boutiques de l’enseigne.',
      },
      {
        key: 'settings',
        label: 'Paramètres',
        path: '/settings',
        perm: 'settings:manage',
        hint: 'Tolérance de caisse, plafond de remise, seuils de stock.',
      },
      {
        key: 'audit',
        label: "Journal d'audit",
        path: '/audit',
        perm: 'audit:read',
        hint: 'Qui a fait quoi, et quand.',
      },
    ],
  },
];
