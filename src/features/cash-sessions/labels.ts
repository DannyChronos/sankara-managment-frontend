/**
 * Étapes de la vie d'une session, telles que le registre les enregistre. Une
 * session n'est jamais réécrite : chaque passage ajoute une ligne.
 */
export const SESSION_EVENTS: Record<string, { label: string; color: string }> =
  {
    OPENED: { label: 'Ouverture', color: 'blue' },
    CLOSED: { label: 'Clôture', color: 'orange' },
    FORCE_CLOSED: { label: 'Clôture forcée', color: 'volcano' },
    ASSIGNED: { label: 'Vérificateur désigné', color: 'default' },
    VERIFIED_CONFORM: { label: 'Vérifiée conforme', color: 'green' },
    VERIFIED_NON_CONFORM: { label: 'Vérifiée non conforme', color: 'red' },
    REGULARIZED: { label: 'Régularisation', color: 'gold' },
    REVERIFIED: { label: 'Revérifiée', color: 'green' },
  };
