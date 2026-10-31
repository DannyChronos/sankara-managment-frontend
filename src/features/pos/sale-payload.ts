import { cleanIfu } from '../../shared/utils/ifu';
import type {
  CreatePosSale,
  EinvoiceBuyer,
  InvoiceMode,
  SalePayment,
} from '../../shared/api/types';
import type { CartLine } from './store/cart.store';

/**
 * Ne garde de l'acheteur que ce qui a été réellement saisi.
 *
 * Un champ vide ne doit pas partir en chaîne vide : la facture porterait un
 * nom d'acheteur « » ou un IFU invalide, et la DGI refuserait. Si rien n'a
 * été saisi, l'acheteur est absent — c'est le cas normal d'un particulier.
 */
export function cleanBuyer(buyer: EinvoiceBuyer): EinvoiceBuyer | undefined {
  const cleaned: EinvoiceBuyer = {};

  const name = buyer.name?.trim();
  if (name) cleaned.name = name;

  const ifu = buyer.ifu ? cleanIfu(buyer.ifu) : '';
  if (ifu) cleaned.ifu = ifu;

  const contact = buyer.contact?.trim();
  if (contact) cleaned.contact = contact;

  const address = buyer.address?.trim();
  if (address) cleaned.address = address;

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export interface SalePayloadInput {
  lines: CartLine[];
  payments: SalePayment[];
  customerId: string | null;
  mode: InvoiceMode;
  /** Case cochée en caisse ; sans objet hors du mode « à la demande ». */
  invoiceRequested: boolean;
  buyer: EinvoiceBuyer;
}

/**
 * Corps de `POST /sales` (§6.3).
 *
 * `normalizedInvoice` n'est envoyé qu'en mode « à la demande » : en mode
 * systématique, c'est le serveur qui décide, et lui envoyer `false` ne doit
 * surtout pas ressembler à un refus. L'acheteur, lui, est transmis dès
 * qu'une facture est attendue — en mode systématique aussi, où le caissier
 * n'a rien coché mais a pu renseigner un acheteur entreprise.
 */
export function buildSalePayload({
  lines,
  payments,
  customerId,
  mode,
  invoiceRequested,
  buyer,
}: SalePayloadInput): CreatePosSale {
  const invoiced =
    mode === 'ALWAYS' || (mode === 'ON_DEMAND' && invoiceRequested);
  const cleanedBuyer = invoiced ? cleanBuyer(buyer) : undefined;

  return {
    lines: lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
      ...(line.discount > 0 ? { discount: line.discount } : {}),
    })),
    payments,
    ...(customerId ? { customerId } : {}),
    ...(mode === 'ON_DEMAND' ? { normalizedInvoice: invoiceRequested } : {}),
    ...(cleanedBuyer ? { buyer: cleanedBuyer } : {}),
  };
}
