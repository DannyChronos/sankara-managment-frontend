/**
 * Contrat avec l'API.
 *
 * Les DTO viendront de `schema.d.ts`, généré depuis Swagger par `pnpm gen:api`
 * (FRONTEND.md §4) — aucun type d'API n'est écrit à la main. En attendant que
 * les endpoints existent, seules les formes transverses sont déclarées ici,
 * plus les quelques types d'authentification nécessaires à l'écran de
 * connexion. Ils seront remplacés par les alias générés :
 *
 *   import type { components } from './schema';
 *   export type Order = components['schemas']['OrderResponseDto'];
 */

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

export type PaymentMethod =
  'CASH' | 'MTN_MOMO' | 'MOOV_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';

export type CashSessionStatus =
  'OPEN' | 'CLOSED' | 'CONFORM' | 'NON_CONFORM' | 'REGULARIZED';

export type RoleCode =
  'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'STOREKEEPER' | 'CASHIER';

export interface SiteSummary {
  id: string;
  code: string;
  name: string;
  canSell: boolean;
  canStock: boolean;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roleCode: RoleCode;
  permissions: string[];
  sites: SiteSummary[];
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}
