import type { EinvoiceBuyer } from '../api/types';

/**
 * IFU : identifiant fiscal unique béninois, 13 chiffres.
 *
 * Ces fonctions vivent hors du composant de saisie : elles servent aussi à la
 * caisse, au formulaire client et à la construction du corps de vente, et un
 * module de composants ne doit exporter que des composants.
 */

/** Groupement de lecture : `3201912345678` → `3201 9123 4567 8`. */
export function formatIfu(value: string): string {
  return (value.match(/.{1,4}/g) ?? []).join(' ');
}

/** Ce qui part au serveur : les chiffres, rien d'autre. */
export function cleanIfu(value: string): string {
  return value.replace(/\D/g, '').slice(0, 13);
}

export function isValidIfu(value: string): boolean {
  return /^[0-9]{13}$/.test(value);
}

const MESSAGE = 'L’IFU doit compter 13 chiffres.';

/**
 * Règle Ant Design pour un IFU **facultatif** : vide, c'est valide — un
 * particulier n'en a pas. Mal formé, non : une facture partie avec un IFU
 * faux est refusée par la DGI, et le caissier l'apprendrait après le départ
 * du client.
 */
export const optionalIfuRule = {
  validator: (_: unknown, value: string | undefined) =>
    !value || isValidIfu(cleanIfu(value))
      ? Promise.resolve()
      : Promise.reject(new Error(MESSAGE)),
};

export const requiredIfuRule = {
  validator: (_: unknown, value: string | undefined) =>
    value && isValidIfu(cleanIfu(value))
      ? Promise.resolve()
      : Promise.reject(new Error(MESSAGE)),
};

/** L'IFU saisi pour un acheteur est-il exploitable ? */
export function buyerIfuError(buyer: EinvoiceBuyer): string | null {
  if (!buyer.ifu) return null;
  return isValidIfu(cleanIfu(buyer.ifu)) ? null : MESSAGE;
}
