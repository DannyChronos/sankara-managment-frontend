import { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { refreshSession } from '../../shared/api/http';
import { useAuthStore } from '../../shared/auth/auth.store';
import type { LoginPayload } from '../../shared/api/types';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => setSession(data.accessToken, data.user),
  });
}

export function useLogout() {
  const clear = useAuthStore((state) => state.clear);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(() => {
    void authApi.logout().catch(() => {
      // Le refresh token est déjà inutilisable côté client : on sort quand
      // même, même si l'appel réseau échoue.
    });
    clear();
    queryClient.clear();
    void navigate('/login', { replace: true });
  }, [clear, queryClient, navigate]);
}

/**
 * Au chargement de l'application : refresh silencieux puis `GET /auth/me`
 * (FRONTEND.md §6). Tant que ce n'est pas terminé, `initialized` est faux et
 * les routes protégées affichent un chargement au lieu de rediriger.
 */
export function useRestoreSession(): void {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = await refreshSession();
      if (cancelled) return;

      if (!token) {
        setInitialized(true);
        return;
      }

      try {
        const user = await authApi.me();
        if (!cancelled) setSession(token, user);
      } catch {
        if (!cancelled) setInitialized(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, setInitialized]);
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (identifier: string) => authApi.forgotPassword(identifier),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: {
      identifier: string;
      code: string;
      password: string;
    }) => authApi.resetPassword(payload),
  });
}
