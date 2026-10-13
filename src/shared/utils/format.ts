import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

export const TIMEZONE = 'Africa/Porto-Novo';

/** Espace fine insécable (U+202F) : séparateur de milliers français. */
const NARROW_NBSP = String.fromCodePoint(0x202f);

/** `185000` -> `185 000 FCFA` — entiers seulement (CDC RG-16). */
export function formatXof(amount: number): string {
  // `Math.round(-0)` vaut -0, qui s'affiche « -0 » : un zéro n'a pas de signe.
  const rounded = Math.round(amount) || 0;
  const grouped = rounded.toLocaleString('fr-FR').replace(/\s/g, NARROW_NBSP);
  return `${grouped}${NARROW_NBSP}FCFA`;
}

/** Montant signé, pour les écarts de caisse : `-5 000 FCFA`. */
export function formatGap(amount: number): string {
  return amount > 0 ? `+${formatXof(amount)}` : formatXof(amount);
}

/** JJ/MM/AAAA, fuseau Africa/Porto-Novo (CDC §6). */
export function formatDate(value: string | Date): string {
  return dayjs(value).tz(TIMEZONE).format('DD/MM/YYYY');
}

export function formatDateTime(value: string | Date): string {
  return dayjs(value).tz(TIMEZONE).format('DD/MM/YYYY HH:mm');
}

export { dayjs };
