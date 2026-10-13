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
    // Le détail d'une session de caisse n'a pas d'écran : pas de bouton.
    expect(resolveNotificationLink('/cash-sessions/abc')).toBeNull();
    expect(resolveNotificationLink('/orders/abc')).toBeNull();
    expect(resolveNotificationLink(null)).toBeNull();
  });

  it('garde les écrans de caisse qui existent', () => {
    expect(resolveNotificationLink('/cash-sessions/abc/verify')).toBe(
      '/cash-sessions/abc/verify',
    );
  });
});
