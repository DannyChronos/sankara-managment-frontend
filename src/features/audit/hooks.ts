import { useQuery } from '@tanstack/react-query';
import { auditApi } from './api';

export function useAuditLogs(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditApi.list(filters),
    // Le journal est en insertion seule : rien ne change sous nos pieds.
    staleTime: 30_000,
  });
}
