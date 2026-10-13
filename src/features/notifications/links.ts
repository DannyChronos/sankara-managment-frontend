/**
 * Le backend écrit la cible d'une alerte sans savoir quels écrans existent.
 * On la traduit ici en route de l'application, et on renvoie `null` quand
 * l'écran correspondant n'est pas encore construit : mieux vaut pas de bouton
 * qu'un bouton qui mène à une page introuvable.
 */
export function resolveNotificationLink(link: string | null): string | null {
  if (!link) return null;

  // L'identifiant d'export ne vit que 24 h : c'est l'écran des rapports qui
  // est utile, pas l'URL de téléchargement.
  if (link.startsWith('/reports/exports/')) return '/reports';

  const known = [
    '/dashboard',
    '/stock',
    '/transfers',
    '/inventories',
    '/sales',
    '/customers',
    '/reports',
    '/cash-sessions/',
  ];

  return known.some((prefix) => link.startsWith(prefix)) ? link : null;
}
