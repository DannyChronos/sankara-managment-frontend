import { api } from '../../shared/api/http';
import type {
  CurrentUser,
  LoginPayload,
  LoginResponse,
} from '../../shared/api/types';

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload),
  me: () => api.get<CurrentUser>('/auth/me'),
  logout: () => api.post<null>('/auth/logout'),
  forgotPassword: (identifier: string) =>
    api.post<null>('/auth/forgot-password', { identifier }),
  // Le serveur envoie un code à 6 chiffres, pas un lien : il faut donc lui
  // redonner l'identifiant avec le code.
  resetPassword: (payload: {
    identifier: string;
    code: string;
    password: string;
  }) => api.post<null>('/auth/reset-password', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.post<null>('/auth/change-password', payload),
};
