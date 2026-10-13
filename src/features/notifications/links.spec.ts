import { describe, expect, it } from 'vitest';
import { resolveNotificationLink } from './links';

describe('cible d’une notification', () => {
  it('renvoie le lien tel quel quand l’écran existe', () => {
    expect(resolveNotificationLink('/transfers/abc')).toBe('/transfers/abc');
    expect(resolveNotificationLink('/stock?variantId=v1')).toBe(
      '/stock?variantId=v1',
    );
    expect(resolveNotificationLink('/dashboard')).toBe('/dashboard');
  });

  it('renvoie vers l’écran des rapports plutôt que vers un fichier purgé', () => {
    expect(resolveNotificationLink('/reports/exports/abc')).toBe('/reports');
  });

  it('n’ouvre rien quand l’écran n’est pas encore construit', () => {
    // Les commandes web sont du périmètre V2 : pas d'écran, pas de bouton.
    expect(resolveNotificationLink('/orders/abc')).toBeNull();
    expect(resolveNotificationLink(null)).toBeNull();
  });

  it('ouvre les écrans de caisse', () => {
    expect(resolveNotificationLink('/cash-sessions/abc')).toBe(
      '/cash-sessions/abc',
    );
    expect(resolveNotificationLink('/cash-sessions/abc/verify')).toBe(
      '/cash-sessions/abc/verify',
    );
  });
});
