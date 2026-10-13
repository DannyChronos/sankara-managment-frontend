import type { components } from './schema';

/**
 * Contrat avec l'API.
 *
 * `schema.d.ts` est généré depuis Swagger par `pnpm gen:api` : **les corps de
 * requête et les énumérations viennent de là**, jamais écrits à la main.
 *
 * Les réponses, en revanche, ne sont pas encore décrites côté backend (les
 * contrôleurs renvoient des objets sans DTO de sortie). Les vues ci-dessous les
 * déclarent donc explicitement, en attendant que chaque module expose son
 * `@ApiOkResponse`. Elles sont regroupées ici pour qu'une divergence se corrige
 * en un seul endroit.
 */

// ─────────────────────────── corps de requête ────────────────────────────

export type LoginPayload = components['schemas']['LoginDto'];
export type CreatePosSale = components['schemas']['CreatePosSaleDto'];
export type SalePayment = components['schemas']['SalePaymentDto'];
export type SaleLine = components['schemas']['SaleLineDto'];
export type OpenSessionPayload = components['schemas']['OpenSessionDto'];
export type CloseSessionPayload = components['schemas']['CloseSessionDto'];
export type VerifySessionPayload = components['schemas']['VerifySessionDto'];
export type RegularizeSessionPayload =
  components['schemas']['RegularizeSessionDto'];
export type MethodAmount = components['schemas']['MethodAmountDto'];
export type CreateReturnPayload = components['schemas']['CreateReturnDto'];
export type CancelSalePayload = components['schemas']['CancelSaleDto'];

// ───────────────────────────── énumérations ──────────────────────────────

export type PaymentMethod = SalePayment['method'];
export type CashSessionStatus =
  'OPEN' | 'CLOSED' | 'CONFORM' | 'NON_CONFORM' | 'REGULARIZED';
export type RoleCode =
  | 'MAINTAINER'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'STOREKEEPER'
  | 'CASHIER';

// ───────────────────────────── enveloppe API ─────────────────────────────

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

// ──────────────────────── vues renvoyées par l'API ───────────────────────

export type CurrentUser = components['schemas']['CurrentUserDto'] & {
  roleCode: RoleCode;
};
export type SiteSummary = components['schemas']['SiteSummaryDto'];
export type LoginResponse = Omit<
  components['schemas']['LoginResponseDto'],
  'user'
> & { user: CurrentUser };

export interface VariantSearchResult {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  productName: string;
  price: number | null;
  onHand: number;
  reserved: number;
  available: number;
}

export interface SessionMethodTotal {
  method: PaymentMethod;
  openingFloat: number;
  salesIn: number;
  refundsOut: number;
  expectedAmount: number;
  declaredAmount: number | null;
  receivedAmount: number | null;
  gap: number | null;
}

export interface CashSession {
  id: string;
  number: string;
  status: CashSessionStatus;
  site: { id: string; code: string; name: string };
  cashier: { id: string | null; fullName: string };
  openingFloat: number;
  openedAt: string;
  closedAt: string | null;
  forceClosed: boolean;
  expectedTotal: number;
  declaredTotal: number | null;
  receivedTotal: number | null;
  gapTotal: number | null;
  totals: SessionMethodTotal[];
}

export interface CashSessionEvent {
  id: string;
  type: string;
  actorId: string | null;
  actorName: string | null;
  payload: Record<string, unknown>;
  attachmentId: string | null;
  createdAt: string;
}

export interface OrderLine {
  id: string;
  variantId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  returnedQty: number;
}

export interface OrderPayment {
  id: string;
  method: PaymentMethod;
  direction: 'IN' | 'OUT';
  amount: number;
  amountTendered: number | null;
  changeGiven: number | null;
  reference: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  number: string;
  channel: 'POS' | 'WEB';
  status: string;
  site: { id: string; code: string; name: string };
  cashSessionId: string | null;
  cashier: { id: string | null; fullName: string } | null;
  customer: { id: string; fullName: string; phone: string | null } | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  paidTotal: number;
  refundedTotal: number;
  note: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  lines: OrderLine[];
  payments: OrderPayment[];
  receiptUrl: string;
}

export interface RevenueSnapshot {
  revenue: number;
  salesCount: number;
  averageBasket: number;
}

export interface Dashboard {
  period: { name: 'day' | 'week' | 'month'; from: string; to: string };
  revenue: {
    day: RevenueSnapshot;
    week: RevenueSnapshot;
    month: RevenueSnapshot;
    selected: RevenueSnapshot;
  };
  salesTrend: { day: string; revenue: number; salesCount: number }[];
  topVariants: {
    variantId: string;
    sku: string | null;
    name: string | null;
    productName: string | null;
    quantity: number;
    revenue: number;
  }[];
  lowStock: {
    count: number;
    items: {
      stockLevelId: string;
      siteCode: string;
      variantId: string;
      sku: string;
      name: string;
      productName: string;
      available: number;
      minThreshold: number;
    }[];
  };
  sessionsToVerify: { count: number };
  gaps: {
    verifiedCount: number;
    nonConformCount: number;
    gapCount: number;
    gapTotal: number;
  };
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  city: string | null;
}
