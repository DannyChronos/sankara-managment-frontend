import { beforeEach, describe, expect, it } from 'vitest';
import {
  cartDiscount,
  cartSubtotal,
  cartTotal,
  useCartStore,
} from './cart.store';
import type { VariantSearchResult } from '../../../shared/api/types';

const matelas: VariantSearchResult = {
  id: 'variant-1',
  sku: 'MS-ORTHO-140190-25',
  barcode: null,
  name: '140×190 · 25 cm',
  productName: 'Matelas Ortho Confort',
  price: 185000,
  onHand: 4,
  reserved: 0,
  available: 4,
};

const oreiller: VariantSearchResult = {
  ...matelas,
  id: 'variant-2',
  sku: 'MS-OREILLER',
  name: 'Mémoire de forme',
  productName: 'Oreiller',
  price: 7500,
  onHand: 12,
  available: 12,
};

describe('panier du point de vente', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('ajoute un article puis incrémente la ligne existante', () => {
    const cart = useCartStore.getState();
    cart.add(matelas);
    cart.add(matelas);

    const lines = useCartStore.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
  });

  it('calcule sous-total, remise et total (RG-07)', () => {
    const cart = useCartStore.getState();
    cart.add(matelas);
    cart.add(oreiller);
    useCartStore.getState().setQuantity('variant-2', 2);
    useCartStore.getState().setDiscount('variant-2', 1000);

    const lines = useCartStore.getState().lines;
    expect(cartSubtotal(lines)).toBe(185000 + 7500 * 2);
    expect(cartDiscount(lines)).toBe(1000);
    expect(cartTotal(lines)).toBe(185000 + 15000 - 1000);
  });

  it('retire la ligne quand la quantité tombe à zéro', () => {
    const cart = useCartStore.getState();
    cart.add(matelas);
    useCartStore.getState().setQuantity('variant-1', 0);

    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it('refuse une remise négative', () => {
    const cart = useCartStore.getState();
    cart.add(matelas);
    useCartStore.getState().setDiscount('variant-1', -5000);

    expect(useCartStore.getState().lines[0].discount).toBe(0);
  });

  it('réutilise la clé d’idempotence tant que le panier ne change pas', () => {
    const cart = useCartStore.getState();
    cart.add(matelas);

    const first = useCartStore.getState().startAttempt();
    const second = useCartStore.getState().startAttempt();

    // C'est ce qui permet de relancer une vente après une coupure réseau sans
    // l'enregistrer deux fois.
    expect(second).toBe(first);
  });

  it('change de clé dès que le panier est modifié', () => {
    const cart = useCartStore.getState();
    cart.add(matelas);
    const first = useCartStore.getState().startAttempt();

    useCartStore.getState().setQuantity('variant-1', 3);
    const second = useCartStore.getState().startAttempt();

    expect(second).not.toBe(first);
  });

  it('repart à zéro après une vente', () => {
    const cart = useCartStore.getState();
    cart.add(matelas);
    cart.setCustomer('client-1', 'Afi Kodjo');
    useCartStore.getState().startAttempt();

    useCartStore.getState().clear();
    const state = useCartStore.getState();

    expect(state.lines).toHaveLength(0);
    expect(state.customerId).toBeNull();
    expect(state.idempotencyKey).toBeNull();
  });
});
