import { useAuthStore } from './auth.store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const initialized = useAuthStore((state) => state.initialized);
  const siteId = useAuthStore((state) => state.siteId);
  const setSiteId = useAuthStore((state) => state.setSiteId);

  return {
    user,
    siteId,
    setSiteId,
    initialized,
    isAuthenticated: Boolean(accessToken && user),
    currentSite: user?.sites.find((site) => site.id === siteId) ?? null,
  };
}
