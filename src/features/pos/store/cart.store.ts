import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, VariantSearchResult } from '../../../shared/api/types';

export interface CartLine {
  variantId: string;
  sku: string;
  label: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  /** Disponible connu au moment de l'ajout, pour le garde-fou de saisie. */
  available: number;
}

interface CartState {
  lines: CartLine[];
  customerId: string | null;
  customerLabel: string | null;
  /** Générée une fois par tentative de vente, réutilisée en cas de relance. */
  idempotencyKey: string | null;
  /**
   * Dernière vente encaissée. Elle survit au vidage du panier et à un
   * rechargement : au comptoir, le ticket se réimprime après coup — bourrage
   * papier, ou client qui revient deux minutes plus tard.
   */
  lastSale: Order | null;

  add: (variant: VariantSearchResult) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  setDiscount: (variantId: string, discount: number) => void;
  remove: (variantId: string) => void;
  setCustomer: (id: string | null, label: string | null) => void;
  setLastSale: (order: Order | null) => void;
  startAttempt: () => string;
  clear: () => void;
}

/**
 * Panier persistant (FRONTEND.md §9.1) : `sessionStorage` suffit — un panier
 * n'a pas à survivre à la fermeture du navigateur, mais il doit survivre à un
 * rechargement accidentel en pleine vente.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customerId: null,
      customerLabel: null,
      idempotencyKey: null,
      lastSale: null,

      add: (variant) =>
        set((state) => {
          const existing = state.lines.find(
            (line) => line.variantId === variant.id,
          );

          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.variantId === variant.id
                  ? { ...line, quantity: line.quantity + 1 }
                  : line,
              ),
              // Le panier change : la tentative précédente n'a plus cours.
              idempotencyKey: null,
            };
          }

          return {
            lines: [
              ...state.lines,
              {
                variantId: variant.id,
                sku: variant.sku,
                label: `${variant.productName} — ${variant.name}`,
                unitPrice: variant.price ?? 0,
                quantity: 1,
                discount: 0,
                available: variant.available,
              },
            ],
            idempotencyKey: null,
          };
        }),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((line) => line.variantId !== variantId)
              : state.lines.map((line) =>
                  line.variantId === variantId ? { ...line, quantity } : line,
                ),
          idempotencyKey: null,
        })),

      setDiscount: (variantId, discount) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.variantId === variantId
              ? { ...line, discount: Math.max(0, discount) }
              : line,
          ),
          idempotencyKey: null,
        })),

      remove: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.variantId !== variantId),
          idempotencyKey: null,
        })),

      setCustomer: (customerId, customerLabel) =>
        set({ customerId, customerLabel, idempotencyKey: null }),

      setLastSale: (lastSale) => set({ lastSale }),

      /**
       * Une clé par tentative : si le réseau coupe, la relance réutilise la
       * même et la vente n'est jamais comptée deux fois (FRONTEND.md §5.3).
       */
      startAttempt: () => {
        const existing = get().idempotencyKey;
        if (existing) return existing;

        const key = crypto.randomUUID();
        set({ idempotencyKey: key });
        return key;
      },

      // Appelé juste après une vente : le ticket, lui, reste accessible.
      clear: () =>
        set({
          lines: [],
          customerId: null,
          customerLabel: null,
          idempotencyKey: null,
        }),
    }),
    {
      name: 'sankara.cart',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  );
}

export function cartDiscount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.discount, 0);
}

export function cartTotal(lines: CartLine[]): number {
  return cartSubtotal(lines) - cartDiscount(lines);
}
