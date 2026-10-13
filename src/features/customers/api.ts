import { api } from '../../shared/api/http';
import type {
  Customer,
  CustomerPurchase,
  Paginated,
} from '../../shared/api/types';

export interface CustomerPayload {
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export const customersApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<Customer>('/customers', { params }),

  get: (id: string) => api.get<Customer>(`/customers/${id}`),

  history: (id: string) =>
    api.get<CustomerPurchase[]>(`/customers/${id}/history`),

  create: (payload: CustomerPayload) =>
    api.post<Customer>('/customers', payload),

  update: (id: string, payload: CustomerPayload) =>
    api.patch<Customer>(`/customers/${id}`, payload),
};

export type { Paginated };
