import { api } from '../../shared/api/http';
import type {
  EinvoiceAttempt,
  EinvoiceDailySummary,
  NormalizedInvoiceDetail,
  NormalizedInvoiceRow,
  Paginated,
} from '../../shared/api/types';

export interface EinvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  kind?: string;
  env?: string;
  siteId?: string;
  from?: string;
  to?: string;
  /** Numéro de vente, code MECeF, IFU ou nom d'acheteur. */
  q?: string;
}

export const einvoicesApi = {
  list: (params: EinvoiceFilters) =>
    api.getPaged<NormalizedInvoiceRow>('/einvoices', { params }),

  get: (id: string) => api.get<NormalizedInvoiceDetail>(`/einvoices/${id}`),

  attempts: (id: string) =>
    api.get<EinvoiceAttempt[]>(`/einvoices/${id}/attempts`),

  retry: (id: string) =>
    api.post<NormalizedInvoiceDetail>(`/einvoices/${id}/retry`),

  /** Les mêmes nombres que le rapport envoyé à 23:45 (§16.2 du backend). */
  dailySummary: () => api.get<EinvoiceDailySummary>('/einvoices/daily-summary'),
};

export type { Paginated };
