/**
 * `LOCKED` n'est pas une décision d'administrateur : le compte s'est verrouillé
 * tout seul après trop d'échecs de connexion. Le réactiver le déverrouille.
 */
export const USER_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Actif', color: 'success' },
  DISABLED: { label: 'Désactivé', color: 'default' },
  LOCKED: { label: 'Verrouillé', color: 'error' },
};

/**
 * Ces rôles ne sont rattachés à aucun site en particulier : ils les voient
 * tous. Un rattachement vide n'est donc pas un oubli, contrairement aux
 * autres rôles, où il interdit toute vente et toute écriture de stock.
 */
export const ALL_SITES_ROLES = ['MAINTAINER', 'SUPER_ADMIN', 'ADMIN'];
