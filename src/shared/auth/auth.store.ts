import { create } from 'zustand';
import type { CurrentUser } from '../api/types';

const SITE_STORAGE_KEY = 'sankara.siteId';

interface AuthState {
  /** Jeton d'accès gardé en mémoire seulement — jamais dans localStorage. */
  accessToken: string | null;
  user: CurrentUser | null;
  siteId: string | null;
  /** Faux jusqu'à la fin du refresh silencieux du démarrage. */
  initialized: boolean;

  setSession: (accessToken: string, user: CurrentUser) => void;
  setAccessToken: (accessToken: string | null) => void;
  setSiteId: (siteId: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  clear: () => void;
}

function readStoredSiteId(): string | null {
  try {
    return localStorage.getItem(SITE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistSiteId(siteId: string | null): void {
  try {
    if (siteId) localStorage.setItem(SITE_STORAGE_KEY, siteId);
    else localStorage.removeItem(SITE_STORAGE_KEY);
  } catch {
    // Mode privé ou stockage refusé : le site courant reste en mémoire.
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  siteId: readStoredSiteId(),
  initialized: false,

  setSession: (accessToken, user) =>
    set((state) => {
      // Le site mémorisé n'est gardé que s'il fait partie des sites de
      // l'utilisateur ; sinon on prend le premier (cas du site unique).
      const allowed = user.sites.some((site) => site.id === state.siteId);
      const siteId = allowed ? state.siteId : (user.sites[0]?.id ?? null);
      persistSiteId(siteId);
      return { accessToken, user, siteId, initialized: true };
    }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setSiteId: (siteId) => {
    persistSiteId(siteId);
    set({ siteId });
  },

  setInitialized: (initialized) => set({ initialized }),

  clear: () => set({ accessToken: null, user: null, initialized: true }),
}));
