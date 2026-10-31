import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { qk } from '../../shared/api/query-keys';
import { formatDate } from '../../shared/utils/format';
import { fiscalApi } from './api';
import type {
  EmecefEnv,
  UpdateFiscalProfile,
  InvoiceMode,
} from '../../shared/api/types';

export function useFiscalProfile() {
  return useQuery({
    queryKey: qk.fiscalProfile(),
    queryFn: () => fiscalApi.profile(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Le mode de facturation, pour la caisse. Lisible par un caissier, qui n'a
 * pas accès au profil fiscal complet.
 *
 * `staleTime` court et relecture au retour sur l'onglet : un administrateur
 * peut activer la facturation pendant qu'une caisse est ouverte, et la caisse
 * doit s'en apercevoir sans que le caissier recharge la page.
 */
export function usePosFiscalContext() {
  return useQuery({
    queryKey: ['fiscal', 'pos-context'],
    queryFn: () => fiscalApi.posContext(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useEmecefStatus(polling = true) {
  return useQuery({
    queryKey: qk.emecefStatus(),
    queryFn: () => fiscalApi.liveStatus(),
    staleTime: 0,
    refetchInterval: polling ? 30_000 : false,
  });
}

/** Le mode et l'environnement changent : la caisse doit les relire. */
function invalidateFiscal(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['fiscal'] });
}

export function useUpdateFiscalProfile() {
  const queryClient = useQueryClient();
  const { message, notification } = App.useApp();

  return useMutation({
    mutationFn: (payload: UpdateFiscalProfile) =>
      fiscalApi.updateProfile(payload),
    onSuccess: (result) => {
      invalidateFiscal(queryClient);
      // Le groupe de taxation des produits a pu basculer.
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });

      if (result.verificationCleared || result.invoiceModeReset) {
        // Changer d'IFU périme le jeton délivré pour l'ancien : le dire fort,
        // sinon la facturation s'arrête sans que personne comprenne pourquoi.
        notification.warning({
          message: 'Jeton e-MECeF à vérifier de nouveau',
          description: result.invoiceModeReset
            ? 'L’IFU a changé : la facturation normalisée est désactivée et le jeton doit être revérifié.'
            : 'L’IFU a changé : le jeton doit être revérifié auprès de la DGI.',
          duration: 0,
        });
        return;
      }

      if (result.productsSwitched > 0) {
        message.success(
          `Profil enregistré. ${result.productsSwitched} produit(s) ont changé de groupe de taxation.`,
        );
        return;
      }
      message.success('Profil fiscal enregistré.');
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSetEmecefToken() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ token, env }: { token: string; env: EmecefEnv }) =>
      fiscalApi.setToken(token, env),
    onSuccess: (check) => {
      invalidateFiscal(queryClient);
      message.success(
        check.tokenValid
          ? `Jeton valide pour l’IFU ${check.ifu}, jusqu’au ${formatDate(check.tokenValid)}.`
          : `Jeton valide pour l’IFU ${check.ifu}.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useTestEmecefToken() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: () => fiscalApi.testToken(),
    onSuccess: (check) => {
      invalidateFiscal(queryClient);
      // Un test réussi reprend la file si elle avait été suspendue : les
      // factures en attente repartent, le journal doit se relire.
      void queryClient.invalidateQueries({ queryKey: ['einvoices'] });
      message.success(
        `Jeton accepté par la DGI pour l’IFU ${check.ifu}${
          check.nim ? ` · NIM ${check.nim}` : ''
        }.`,
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSetInvoiceMode() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({
      mode,
      acknowledgeLegalWarning,
    }: {
      mode: InvoiceMode;
      acknowledgeLegalWarning?: boolean;
    }) => fiscalApi.setInvoiceMode(mode, acknowledgeLegalWarning),
    onSuccess: (profile) => {
      invalidateFiscal(queryClient);
      message.success(
        profile.invoiceMode === 'DISABLED'
          ? 'Facturation normalisée désactivée.'
          : 'Mode de facturation enregistré.',
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}

export function useSetEnvironment() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: ({ env, confirm }: { env: EmecefEnv; confirm?: string }) =>
      fiscalApi.setEnvironment(env, confirm),
    onSuccess: (profile) => {
      invalidateFiscal(queryClient);
      message.success(
        profile.emecefEnv === 'PROD'
          ? 'Environnement de production : les factures émises sont réelles.'
          : 'Retour en environnement de test.',
      );
    },
    onError: (error) => message.error(errorMessage(error)),
  });
}
