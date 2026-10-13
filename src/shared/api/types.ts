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
  address: string | null;
  city: string | null;
  notes: string | null;
  orderCount: number;
  createdAt: string;
}

/** Une ligne achetée, avec la garantie telle qu'elle courait à l'achat (F-33). */
export interface CustomerPurchaseLine {
  sku: string;
  name: string;
  productName: string;
  quantity: number;
  lineTotal: number;
  returnedQty: number;
  warrantyUntil: string | null;
  underWarranty: boolean;
}

export interface CustomerPurchase {
  id: string;
  number: string;
  channel: 'POS' | 'WEB';
  status: string;
  total: number;
  refundedTotal: number;
  createdAt: string;
  site: { code: string; name: string };
  lines: CustomerPurchaseLine[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
  isActive: boolean;
  productCount: number;
  children?: Category[];
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  warrantyMonths: number | null;
  isActive: boolean;
  isPublishedOnline: boolean;
  category: { id: string; name: string; slug: string };
  variantCount: number;
  priceRange: { min: number; max: number } | null;
  createdAt: string;
}

export interface ProductVariantView {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  widthCm: number | null;
  lengthCm: number | null;
  thicknessCm: number | null;
  densityKgM3: number | null;
  firmness: string | null;
  costPrice: number | null;
  isActive: boolean;
  prices: { POS: number | null; WEB: number | null };
}

export interface ProductDetail extends Omit<
  ProductListItem,
  'variantCount' | 'priceRange'
> {
  description: string | null;
  images: {
    id: string;
    url: string;
    alt: string | null;
    position: number;
    variantId: string | null;
  }[];
  variants: ProductVariantView[];
}

export interface StockLevelView {
  id: string;
  siteId: string;
  siteCode: string;
  variantId: string;
  sku: string;
  variantName: string;
  productName: string;
  onHand: number;
  reserved: number;
  available: number;
  inTransitIn: number;
  minThreshold: number;
  isLow: boolean;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorId: string | null;
  actorName: string | null;
  actorType: 'USER' | 'INTEGRATION' | 'SYSTEM';
  siteId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface StockMovementView {
  id: string;
  occurredAt: string;
  siteCode: string;
  sku: string;
  variantName: string;
  productName: string;
  type: string;
  direction: 'IN' | 'OUT';
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  sourceType: string;
  sourceId: string;
  performedBy: string | null;
}

export interface StockOperationLine {
  id: string;
  variantId: string;
  sku: string | null;
  variantName: string | null;
  productName: string | null;
  quantity: number;
  unitCost: number | null;
}

export interface StockOperation {
  id: string;
  number: string;
  type:
    | 'PRODUCTION_ENTRY'
    | 'PURCHASE_RECEIPT'
    | 'WRITE_OFF'
    | 'SAMPLE'
    | 'INTERNAL_USE';
  direction: 'IN' | 'OUT';
  status: 'DRAFT' | 'VALIDATED' | 'CANCELLED';
  reason: string | null;
  note: string | null;
  site: { id: string; code: string; name: string };
  supplier: { id: string; name: string } | null;
  validatedAt: string | null;
  createdAt: string;
  totalQuantity: number;
  lines: StockOperationLine[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export type TransferStatus =
  'DRAFT' | 'SHIPPED' | 'RECEIVED' | 'RECEIVED_WITH_GAP' | 'CANCELLED';

export interface TransferLine {
  id: string;
  variantId: string;
  sku: string | null;
  variantName: string | null;
  productName: string | null;
  quantitySent: number;
  /** `null` tant que le transfert n'est pas réceptionné. */
  quantityReceived: number | null;
  /** Reçu − expédié ; négatif quand il manque de la marchandise. */
  gap: number | null;
  gapReason: string | null;
}

export interface Transfer {
  id: string;
  number: string;
  status: TransferStatus;
  note: string | null;
  fromSite: { id: string; code: string; name: string };
  toSite: { id: string; code: string; name: string };
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  totalSent: number;
  totalReceived: number;
  lines: TransferLine[];
}

export type InventoryStatus =
  'IN_PROGRESS' | 'SUBMITTED' | 'VALIDATED' | 'CANCELLED';

export interface InventoryLine {
  id: string;
  variantId: string;
  sku: string | null;
  variantName: string | null;
  productName: string | null;
  /** Stock théorique figé à l'ouverture de l'inventaire. */
  expectedQty: number;
  countedQty: number | null;
  difference: number | null;
}

export interface Inventory {
  id: string;
  number: string;
  status: InventoryStatus;
  note: string | null;
  site: { id: string; code: string; name: string };
  submittedAt: string | null;
  validatedAt: string | null;
  createdAt: string;
  lineCount: number;
  countedCount: number;
  gapCount: number;
  lines: InventoryLine[];
}

export interface Site {
  id: string;
  code: string;
  name: string;
  type: 'WAREHOUSE' | 'SHOP' | 'MIXED';
  address: string | null;
  phone: string | null;
  canSell: boolean;
  isActive: boolean;
}

export type ReportType = 'sales' | 'stock' | 'movements' | 'cash-sessions';
export type ExportFormat = 'xlsx' | 'pdf';

export interface ReportColumn {
  key: string;
  label: string;
  /** Colonne monétaire : alignée à droite et formatée en FCFA. */
  money?: boolean;
}

export interface ReportResult {
  type: ReportType;
  title: string;
  generatedAt: string;
  filters: Record<string, string | undefined>;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  /** Sommes par clé de colonne ; seules certaines colonnes en ont une. */
  totals: Record<string, number>;
}

export interface ExportRecord {
  id: string;
  type: ReportType;
  format: ExportFormat;
  status: 'PENDING' | 'READY' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  rowCount?: number;
  fileName?: string;
  error?: string;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED';
  role: { id: string; code: RoleCode; name: string };
  sites: { id: string; code: string; name: string; isDefault: boolean }[];
  discountCapPercent: number | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED';

/** Renvoyé une seule fois, à la création, si le mot de passe a été généré. */
export interface CreatedUser extends UserSummary {
  temporaryPassword?: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  /** Rôle livré avec la plateforme : ni renommable, ni supprimable. */
  isSystem: boolean;
  userCount: number;
  permissions: string[];
}

export interface PermissionModule {
  id: string;
  code: string;
  name: string;
  permissions: { id: string; code: string; label: string }[];
}

export type SiteType = 'WAREHOUSE' | 'SHOP' | 'MIXED';

export interface SiteDetail {
  id: string;
  code: string;
  name: string;
  type: SiteType;
  address: string | null;
  phone: string | null;
  canSell: boolean;
  isEcommerceSource: boolean;
  isActive: boolean;
  managerId: string | null;
  userCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  /** Cible applicative, telle que le backend l'a écrite (`/transfers/:id`…). */
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

/** La liste porte le compteur de non lues : c'est lui qui alimente la cloche. */
export interface NotificationPage {
  data: Notification[];
  meta: PageMeta & { unread: number };
}
