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
  resetPassword: (payload: { token: string; password: string }) =>
    api.post<null>('/auth/reset-password', payload),
};
