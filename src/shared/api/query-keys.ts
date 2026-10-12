/** Fabrique de clés TanStack Query (FRONTEND.md §5.2). */
export const qk = {
  me: () => ['auth', 'me'] as const,
  dashboard: (siteId: string, period: string) =>
    ['dashboard', siteId, period] as const,
  stockLevels: (siteId: string, filters?: object) =>
    ['stock', 'levels', siteId, filters] as const,
  stockMovements: (siteId: string, filters?: object) =>
    ['stock', 'movements', siteId, filters] as const,
  variantSearch: (siteId: string, q: string) =>
    ['catalog', 'search', siteId, q] as const,
  currentSession: (siteId: string) =>
    ['cash-sessions', 'current', siteId] as const,
  sessionsToVerify: () => ['cash-sessions', 'to-verify'] as const,
  session: (id: string) => ['cash-sessions', id] as const,
  sales: (filters?: object) => ['sales', filters] as const,
  notifications: () => ['notifications'] as const,
};
