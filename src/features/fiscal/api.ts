import { api } from '../../shared/api/http';
import type {
  EmecefEnv,
  EmecefLiveStatus,
  EmecefTokenCheck,
  FiscalProfile,
  UpdateFiscalProfile,
  FiscalProfileSaved,
  InvoiceMode,
} from '../../shared/api/types';

/** Ce que la caisse a le droit de lire du paramétrage fiscal (§B pos-context). */
export interface PosFiscalContext {
  invoiceMode: InvoiceMode;
  env: EmecefEnv;
}

export const fiscalApi = {
  /** `null` tant que le profil n'a jamais été enregistré. */
  profile: () => api.get<FiscalProfile | null>('/fiscal/profile'),

  updateProfile: (payload: UpdateFiscalProfile) =>
    api.put<FiscalProfileSaved>('/fiscal/profile', payload),

  /** Enregistre **et** teste : la réponse est le résultat du test. */
  setToken: (token: string, env: EmecefEnv) =>
    api.put<EmecefTokenCheck>('/fiscal/emecef-token', { token, env }),

  testToken: () => api.post<EmecefTokenCheck>('/fiscal/emecef-token/test'),

  setInvoiceMode: (mode: InvoiceMode, acknowledgeLegalWarning?: boolean) =>
    api.put<FiscalProfile>('/fiscal/invoice-mode', {
      mode,
      ...(acknowledgeLegalWarning ? { acknowledgeLegalWarning: true } : {}),
    }),

  setEnvironment: (env: EmecefEnv, confirm?: string) =>
    api.put<FiscalProfile>('/fiscal/environment', {
      env,
      ...(confirm ? { confirm } : {}),
    }),

  liveStatus: () => api.get<EmecefLiveStatus>('/fiscal/emecef-status'),

  posContext: () => api.get<PosFiscalContext>('/fiscal/pos-context'),
};
