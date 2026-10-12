import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../auth/auth.store';
import { toApiError } from './errors';
import type { ApiEnvelope, Paginated } from './types';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/** Jeton d'accès et site courant sur chaque requête (FRONTEND.md §5.1). */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken, siteId } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (siteId) config.headers['X-Site-Id'] = siteId;
  return config;
});

/**
 * Un seul refresh en vol : les requêtes tombées en 401 attendent le nouveau
 * jeton puis sont rejouées une fois. Un deuxième échec déconnecte.
 */
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<ApiEnvelope<{ accessToken: string }>>(
      '/auth/refresh',
      undefined,
      { baseURL: import.meta.env.VITE_API_URL, withCredentials: true },
    );
    const token = data.data.accessToken;
    useAuthStore.getState().setAccessToken(token);
    return token;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

export function refreshSession(): Promise<string | null> {
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const config = error.config as RetriableConfig | undefined;
      const isAuthRoute = config?.url?.includes('/auth/');

      if (
        error.response?.status === 401 &&
        config &&
        !config._retried &&
        !isAuthRoute
      ) {
        config._retried = true;
        const token = await refreshSession();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return http.request(config);
        }
      }
    }
    throw toApiError(error);
  },
);

/**
 * Les appels applicatifs passent par ces helpers : l'enveloppe
 * `{ success, data, meta }` est dépliée une fois pour toutes, et le type
 * annoncé est celui de la donnée utile.
 */
export const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return http.get<ApiEnvelope<T>>(url, config).then((res) => res.data.data);
  },

  /** Variante paginée : conserve `meta` pour la pagination serveur. */
  getPaged<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
    return http.get<ApiEnvelope<T[]>>(url, config).then((res) => ({
      data: res.data.data,
      meta: res.data.meta ?? {
        page: 1,
        limit: res.data.data.length,
        total: res.data.data.length,
        totalPages: 1,
      },
    }));
  },

  post<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return http
      .post<ApiEnvelope<T>>(url, body, config)
      .then((res) => res.data.data);
  },

  patch<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return http
      .patch<ApiEnvelope<T>>(url, body, config)
      .then((res) => res.data.data);
  },

  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return http
      .put<ApiEnvelope<T>>(url, body, config)
      .then((res) => res.data.data);
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return http
      .delete<ApiEnvelope<T>>(url, config)
      .then((res) => res.data.data);
  },
};
