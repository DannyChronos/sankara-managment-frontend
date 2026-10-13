import { useMutation } from '@tanstack/react-query';
import { authApi } from '../auth/api';

/**
 * Changement de mot de passe. Le serveur vérifie l'ancien : un mot de passe
 * ne se remplace pas depuis une session déjà ouverte sans le prouver. Les
 * erreurs sont laissées à l'appelant, qui sait les poser sous le bon champ.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(payload),
  });
}
