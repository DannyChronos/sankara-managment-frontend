/**
 * Menu déclaré une seule fois, avec la permission requise par entrée ; il est
 * ensuite filtré selon les permissions de l'utilisateur (FRONTEND.md §7.1).
 */
export interface NavItem {
  key: string;
  label: string;
  path: string;
  perm: string;
}

export interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    key: 'home',
    label: 'Accueil',
    items: [
      {
        key: 'dashboard',
        label: 'Tableau de bord',
        path: '/dashboard',
        perm: 'reports:read',
      },
    ],
  },
  {
    key: 'cash',
    label: 'Caisse',
    items: [
      {
        key: 'pos',
        label: 'Point de vente',
        path: '/pos',
        perm: 'sales:create',
      },
      {
        key: 'my-session',
        label: 'Ma caisse',
        path: '/cash-sessions/me',
        perm: 'cash-sessions:open',
      },
      {
        key: 'my-sales',
        label: 'Historique de mes ventes',
        path: '/sales',
        perm: 'sales:read',
      },
    ],
  },
  {
    key: 'control',
    label: 'Contrôle',
    items: [
      {
        key: 'to-verify',
        label: 'Sessions à vérifier',
        path: '/cash-sessions/to-verify',
        perm: 'cash-sessions:verify',
      },
      {
        key: 'all-sessions',
        label: 'Toutes les sessions',
        path: '/cash-sessions',
        perm: 'cash-sessions:read-all',
      },
    ],
  },
  {
    key: 'stock',
    label: 'Stock',
    items: [
      {
        key: 'levels',
        label: 'État du stock',
        path: '/stock',
        perm: 'stock:read',
      },
      {
        key: 'movements',
        label: 'Mouvements',
        path: '/stock/movements',
        perm: 'stock:read',
      },
      {
        key: 'transfers',
        label: 'Transferts',
        path: '/transfers',
        perm: 'transfers:read',
      },
      {
        key: 'inventories',
        label: 'Inventaires',
        path: '/inventories',
        perm: 'inventories:read',
      },
    ],
  },
  {
    key: 'catalog',
    label: 'Catalogue',
    items: [
      {
        key: 'products',
        label: 'Produits',
        path: '/catalog/products',
        perm: 'catalog:read',
      },
      {
        key: 'categories',
        label: 'Catégories',
        path: '/catalog/categories',
        perm: 'catalog:read',
      },
    ],
  },
  {
    key: 'sales',
    label: 'Ventes',
    items: [
      {
        key: 'sales-list',
        label: 'Ventes',
        path: '/sales',
        perm: 'sales:read',
      },
      {
        key: 'customers',
        label: 'Clients',
        path: '/customers',
        perm: 'customers:read',
      },
      {
        key: 'orders',
        label: 'Commandes web',
        path: '/orders',
        perm: 'orders:read',
      },
    ],
  },
  {
    key: 'reports',
    label: 'Rapports',
    items: [
      {
        key: 'reports-sales',
        label: 'Rapports',
        path: '/reports',
        perm: 'reports:read',
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    items: [
      {
        key: 'users',
        label: 'Utilisateurs',
        path: '/users',
        perm: 'users:read',
      },
      { key: 'roles', label: 'Rôles', path: '/rbac/roles', perm: 'rbac:read' },
      { key: 'sites', label: 'Sites', path: '/sites', perm: 'sites:read' },
      {
        key: 'settings',
        label: 'Paramètres',
        path: '/settings',
        perm: 'settings:manage',
      },
      {
        key: 'integrations',
        label: 'Intégrations',
        path: '/integrations',
        perm: 'integrations:manage',
      },
      {
        key: 'audit',
        label: "Journal d'audit",
        path: '/audit',
        perm: 'audit:read',
      },
    ],
  },
];
