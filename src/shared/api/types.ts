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
  /** Groupe de taxation figé au moment de la vente (§B7.3). */
  taxGroup: TaxGroup;
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
  /** Le client a-t-il demandé une facture normalisée ? */
  invoiceRequested: boolean;
  einvoiceStatus: EinvoiceStatus;
  buyer: { name: string | null; ifu: string | null } | null;
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
  /** Renseignée pour une entreprise : c'est elle qui figure sur la facture. */
  companyName: string | null;
  ifu: string | null;
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

export type Firmness = 'SOFT' | 'MEDIUM' | 'FIRM' | 'EXTRA_FIRM';

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  /** Imprimé sur la facture normalisée (§B7.3). */
  taxGroup: TaxGroup;
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
  images: ProductImage[];
  variants: ProductVariantView[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  variantId: string | null;
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
  address: string | null;
  isActive: boolean;
  operationCount: number;
  createdAt: string;
  updatedAt: string;
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

export type ReportType =
  | 'sales'
  | 'stock'
  | 'movements'
  | 'cash-sessions'
  /** Factures normalisées, pour le rapprochement avec le portail de la DGI. */
  | 'einvoices';
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
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED';
  role: { id: string; code: RoleCode; name: string };
  sites: { id: string; code: string; name: string; isDefault: boolean }[];
  discountCapPercent: number | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED';

export interface CreatedUser extends UserSummary {
  /** Vrai quand un code d'activation vient de partir par email. */
  activationSent: boolean;
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

/** Arborescence : `children` n'est présent que si on l'a demandée en arbre. */
export interface CategoryNode extends Category {
  children?: CategoryNode[];
}

// ──────────────────── facture normalisée e-MECeF (DGI) ───────────────────
//
// Comme les vues ci-dessus, ces types sont écrits à la main : les
// contrôleurs de la facture normalisée renvoient des objets sans DTO de
// sortie, `schema.d.ts` ne les décrit donc pas. Ils suivent exactement les
// présentateurs du backend (`FiscalProfileService.present`,
// `NormalizedInvoicesService.present`, `forOrder`, `EmecefStatusService`).

export type UpdateFiscalProfile =
  components['schemas']['UpdateFiscalProfileDto'];
export type SetEmecefTokenPayload = components['schemas']['SetEmecefTokenDto'];
export type SetInvoiceModePayload = components['schemas']['SetInvoiceModeDto'];
export type SetEnvironmentPayload = components['schemas']['SetEnvironmentDto'];
/** Acheteur d'une facture normalisée : tout est facultatif (§B7.2). */
export type EinvoiceBuyer = components['schemas']['BuyerDto'];

/** Groupes complets : la saisie n'en propose que trois, l'affichage les connaît tous. */
export type TaxGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type TaxRegime = UpdateFiscalProfile['taxRegime'];
export type InvoiceMode = SetInvoiceModePayload['mode'];
export type EmecefEnv = SetEmecefTokenPayload['env'];
/** Statut porté par la vente — ce que le caissier voit. */
export type EinvoiceStatus =
  'NOT_REQUESTED' | 'PENDING' | 'CONFIRMED' | 'REJECTED';
/** Statut de la facture elle-même — ce que le journal suit. */
export type NormalizedInvoiceStatus =
  'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
export type NormalizedInvoiceKind = 'SALE' | 'CREDIT_NOTE';

export interface FiscalProfile {
  legalName: string;
  tradeName: string | null;
  ifu: string;
  rccm: string | null;
  fiscalAddress: string;
  fiscalPhone: string;
  fiscalEmail: string | null;
  taxRegime: TaxRegime;
  invoiceMode: InvoiceMode;
  onDemandAckAt: string | null;
  onDemandAckById: string | null;
  emecefEnv: EmecefEnv;
  /** Les 4 derniers caractères du jeton : il n'est jamais renvoyé entier. */
  tokenLast4: string | null;
  tokenExpiresAt: string | null;
  verifiedAt: string | null;
  nim: string | null;
  receiptFooter: string | null;
  updatedAt: string;
}

export interface FiscalProfileSaved {
  profile: FiscalProfile;
  /** Produits concernés par un changement de régime, s'il a eu lieu. */
  productsToSwitch: number;
  productsSwitched: number;
  /** Changer l'IFU périme le jeton : la vérification a été retirée. */
  verificationCleared: boolean;
  /** …et la facturation a été coupée si elle était active. */
  invoiceModeReset: boolean;
}

/** Réponse du test du jeton (`PUT /fiscal/emecef-token`, `POST …/test`). */
export interface EmecefTokenCheck {
  valid: boolean;
  ifu: string;
  nim: string | null;
  tokenValid: string | null;
  serverDateTime: string | null;
  tokenLast4: string | null;
}

export interface EmecefLiveStatus {
  configured: boolean;
  env: EmecefEnv | null;
  invoiceMode: InvoiceMode | null;
  tokenLast4: string | null;
  tokenValidUntil: string | null;
  verifiedAt: string | null;
  nim: string | null;
  reachable: boolean;
  serverDateTime?: string | null;
  /** Factures en attente chez la DGI ; `null` si elle est injoignable. */
  dgiPendingCount: number | null;
  localPending: number;
  localRetrying: number;
  rejected: number;
  queuePaused: boolean;
  checkedAt: string;
  error?: string;
}

/** Récapitulatif par groupe renvoyé par la DGI (`ta`…`tf`, `vta`…). */
export type DgiTotals = Record<string, unknown>;

export interface NormalizedInvoice {
  id: string;
  kind: NormalizedInvoiceKind;
  status: NormalizedInvoiceStatus;
  env: EmecefEnv;
  orderId: string;
  orderReturnId: string | null;
  originalInvoiceId: string | null;
  sellerIfu: string;
  operator: { code: string; name: string };
  buyerName: string | null;
  buyerIfu: string | null;
  /** Ce que la vente a encaissé : la facture ne doit jamais s'en écarter. */
  expectedTotal: number;
  dgiUid: string | null;
  dgiTotal: number | null;
  dgiTotals: DgiTotals | null;
  mecefCode: string | null;
  nim: string | null;
  counters: string | null;
  qrCode: string | null;
  dgiDateTime: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  requestedAfterSale: boolean;
  attemptCount: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  rejectionCode: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

/** Ligne du journal : la facture, plus sa vente et son nombre d'appels. */
export interface NormalizedInvoiceRow extends NormalizedInvoice {
  order: { id: string; number: string; siteId: string; createdAt: string };
  attempts: number;
}

export interface NormalizedInvoiceDetail extends NormalizedInvoice {
  order: {
    id: string;
    number: string;
    siteId: string;
    total: number;
    createdAt: string;
  };
  orderReturn: { id: string; number: string; refundAmount: number } | null;
  originalInvoice: {
    id: string;
    mecefCode: string | null;
    dgiDateTime: string | null;
  } | null;
  creditNotes: NormalizedInvoice[];
  /** Corps figé envoyé à la DGI, tel quel. */
  requestPayload: unknown;
}

export type EinvoiceStep =
  'SUBMIT' | 'CONFIRM' | 'CANCEL' | 'STATUS' | 'TOKEN_CHECK';

export interface EinvoiceAttempt {
  id: string;
  step: EinvoiceStep;
  httpStatus: number | null;
  errorCode: string | null;
  durationMs: number | null;
  error: string | null;
  response: unknown;
  createdAt: string;
}

/** `GET /sales/:id/einvoice` — ce que la caisse interroge après l'encaissement. */
/** Compte des factures du jour : carte du tableau de bord (§10). */
export interface EinvoiceDailySummary {
  day: string;
  total: number;
  confirmed: number;
  rejected: number;
  pending: number;
  confirmedTotal: number;
}

export interface SaleEinvoice {
  status: EinvoiceStatus;
  invoiceRequested: boolean;
  kind: NormalizedInvoiceKind | null;
  invoice: NormalizedInvoice | null;
  creditNotes: NormalizedInvoice[];
  receiptUrl: string;
}
