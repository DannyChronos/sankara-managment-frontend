import { api } from '../../shared/api/http';
import type {
  CancelSalePayload,
  CreateReturnPayload,
  EinvoiceBuyer,
  Order,
  Paginated,
  SaleEinvoice,
} from '../../shared/api/types';

export const salesApi = {
  /** État de la facture normalisée d'une vente (§B12.2). */
  einvoice: (id: string) => api.get<SaleEinvoice>(`/sales/${id}/einvoice`),

  /** Le client revient le jour même réclamer sa facture (§B10.5). */
  normalizeLate: (id: string, buyer?: EinvoiceBuyer) =>
    api.post<SaleEinvoice>(`/sales/${id}/normalize`, buyer ? { buyer } : {}),

  list: (params: Record<string, unknown>) =>
    api.getPaged<Order>('/sales', { params }),

  get: (id: string) => api.get<Order>(`/sales/${id}`),

  cancel: (id: string, payload: CancelSalePayload) =>
    api.post<Order>(`/sales/${id}/cancel`, payload),

  createReturn: (id: string, payload: CreateReturnPayload) =>
    api.post<Order>(`/sales/${id}/returns`, payload),
};

/** Le ticket est protégé par le jeton : il se récupère en blob (`PdfButton`). */
export function receiptPath(id: string): string {
  return `/sales/${id}/receipt`;
}

export type { Paginated };
