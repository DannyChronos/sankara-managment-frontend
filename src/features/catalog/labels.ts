import type { Firmness } from '../../shared/api/types';

export const FIRMNESS_LABEL: Record<string, string> = {
  SOFT: 'Souple',
  MEDIUM: 'Moyen',
  FIRM: 'Ferme',
  EXTRA_FIRM: 'Très ferme',
};

export const FIRMNESS_OPTIONS: { value: Firmness; label: string }[] = [
  { value: 'SOFT', label: 'Souple' },
  { value: 'MEDIUM', label: 'Moyen' },
  { value: 'FIRM', label: 'Ferme' },
  { value: 'EXTRA_FIRM', label: 'Très ferme' },
];

/** Formats courants au Bénin ; la saisie libre reste possible. */
export const COMMON_SIZES = [
  { widthCm: 90, lengthCm: 190 },
  { widthCm: 120, lengthCm: 190 },
  { widthCm: 140, lengthCm: 190 },
  { widthCm: 160, lengthCm: 200 },
  { widthCm: 180, lengthCm: 200 },
];

/**
 * Mêmes limites que le serveur (`catalog.constants.ts`) : autant refuser le
 * fichier avant de l'envoyer que de le téléverser pour rien.
 */
export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
