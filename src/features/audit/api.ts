import { api } from '../../shared/api/http';
import type { AuditLogEntry, Paginated } from '../../shared/api/types';

export const auditApi = {
  list: (params: Record<string, unknown>) =>
    api.getPaged<AuditLogEntry>('/audit-logs', { params }),
};

export type { Paginated };
