import { describe, expect, it } from 'vitest';
import { buildSalePayload, cleanBuyer } from './sale-payload';
import type { CartLine } from './store/cart.store';
import type { SalePayment } from '../../shared/api/types';

const matelas: CartLine = {
  variantId: 'variant-1',
  sku: 'MS-ORTHO-140190-25',
  label: 'Matelas Ortho Confort · 140×190',
  unitPrice: 185000,
  quantity: 2,
  discount: 0,
  available: 4,
};

const oreiller: CartLine = {
  ...matelas,
  variantId: 'variant-2',
  sku: 'MS-OREILLER',
  label: 'Oreiller mémoire de forme',
  unitPrice: 7500,
  quantity: 1,
  discount: 500,
};

const payments: SalePayment[] = [
  { method: 'CASH', amount: 377000, amountTendered: 400000 },
];

function payload(overrides: Partial<Parameters<typeof buildSalePayload>[0]>) {
  return buildSalePayload({
    lines: [matelas],
    payments,
    customerId: null,
    mode: 'DISABLED',
    invoiceRequested: false,
    buyer: {},
    ...overrides,
  });
}

describe('acheteur de la facture', () => {
  it('absent quand rien n’a été saisi : c’est le cas du particulier', () => {
    expect(cleanBuyer({})).toBeUndefined();
    expect(cleanBuyer({ name: '', ifu: '' })).toBeUndefined();
    expect(cleanBuyer({ name: '   ' })).toBeUndefined();
  });

  it('ne laisse pas partir une chaîne vide que la DGI refuserait', () => {
    expect(cleanBuyer({ name: 'Sonacop SA', ifu: '' })).toEqual({
      name: 'Sonacop SA',
    });
  });

  it('retire les espaces : du nom comme de l’IFU', () => {
    expect(
      cleanBuyer({ name: '  Sonacop SA  ', ifu: '3201 9123 4567 8' }),
    ).toEqual({ name: 'Sonacop SA', ifu: '3201912345678' });
  });

  it('garde contact et adresse quand ils sont renseignés', () => {
    expect(
      cleanBuyer({ contact: '+229 97 00 00 00', address: 'Cotonou' }),
    ).toEqual({ contact: '+229 97 00 00 00', address: 'Cotonou' });
  });
});

describe('corps de POST /sales', () => {
  it('reprend les lignes du panier, remise comprise', () => {
    const body = payload({ lines: [matelas, oreiller] });

    expect(body.lines).toEqual([
      { variantId: 'variant-1', quantity: 2 },
      { variantId: 'variant-2', quantity: 1, discount: 500 },
    ]);
    expect(body.payments).toBe(payments);
  });

  it('n’envoie le client que s’il y en a un', () => {
    expect(payload({})).not.toHaveProperty('customerId');
    expect(payload({ customerId: 'client-1' }).customerId).toBe('client-1');
  });

  describe('mode désactivé', () => {
    it('ne parle pas de facture normalisée du tout', () => {
      const body = payload({ mode: 'DISABLED', invoiceRequested: true });

      expect(body).not.toHaveProperty('normalizedInvoice');
      expect(body).not.toHaveProperty('buyer');
    });
  });

  describe('mode systématique', () => {
    it('laisse le serveur décider : aucun normalizedInvoice envoyé', () => {
      // Envoyer `false` en mode systématique ressemblerait à un refus.
      const body = payload({ mode: 'ALWAYS' });

      expect(body).not.toHaveProperty('normalizedInvoice');
    });

    it('transmet tout de même l’acheteur entreprise', () => {
      const body = payload({
        mode: 'ALWAYS',
        buyer: { name: 'Sonacop SA', ifu: '3201912345678' },
      });

      expect(body.buyer).toEqual({
        name: 'Sonacop SA',
        ifu: '3201912345678',
      });
    });
  });

  describe('mode à la demande', () => {
    it('dit explicitement non quand la case n’est pas cochée', () => {
      const body = payload({ mode: 'ON_DEMAND', invoiceRequested: false });

      expect(body.normalizedInvoice).toBe(false);
    });

    it('dit oui et joint l’acheteur quand elle est cochée', () => {
      const body = payload({
        mode: 'ON_DEMAND',
        invoiceRequested: true,
        buyer: { name: 'Sonacop SA', ifu: '3201 9123 4567 8' },
      });

      expect(body.normalizedInvoice).toBe(true);
      expect(body.buyer).toEqual({
        name: 'Sonacop SA',
        ifu: '3201912345678',
      });
    });

    it('n’envoie pas l’acheteur saisi puis décoché', () => {
      // Le caissier a renseigné l’entreprise, puis décoché la case : la vente
      // n’est pas facturée, l’acheteur n’a rien à y faire.
      const body = payload({
        mode: 'ON_DEMAND',
        invoiceRequested: false,
        buyer: { name: 'Sonacop SA', ifu: '3201912345678' },
      });

      expect(body.normalizedInvoice).toBe(false);
      expect(body).not.toHaveProperty('buyer');
    });
  });
});
