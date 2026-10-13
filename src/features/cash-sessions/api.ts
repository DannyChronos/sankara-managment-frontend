import { api } from '../../shared/api/http';
import type {
  CashSession,
  CashSessionEvent,
  CloseSessionPayload,
  OpenSessionPayload,
  RegularizeSessionPayload,
  VerifySessionPayload,
} from '../../shared/api/types';

export const cashSessionsApi = {
  open: (payload: OpenSessionPayload) =>
    api.post<CashSession>('/cash-sessions/open', payload),

  current: () => api.get<CashSession>('/cash-sessions/current'),

  get: (id: string) => api.get<CashSession>(`/cash-sessions/${id}`),

  list: (params: Record<string, unknown>) =>
    api.getPaged<CashSession>('/cash-sessions', { params }),

  toVerify: (params: Record<string, unknown> = {}) =>
    api.getPaged<CashSession>('/cash-sessions/to-verify', { params }),

  events: (id: string) =>
    api.get<CashSessionEvent[]>(`/cash-sessions/${id}/events`),

  close: (id: string, payload: CloseSessionPayload) =>
    api.post<CashSession>(`/cash-sessions/${id}/close`, payload),

  verify: (id: string, payload: VerifySessionPayload) =>
    api.post<CashSession>(`/cash-sessions/${id}/verify`, payload),

  regularize: (id: string, payload: RegularizeSessionPayload) =>
    api.post<CashSession>(`/cash-sessions/${id}/regularize`, payload),
};

export function sessionReportUrl(id: string): string {
  return `/cash-sessions/${id}/report`;
}
