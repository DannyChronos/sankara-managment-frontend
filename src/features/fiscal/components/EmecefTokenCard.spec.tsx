import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  EmecefTokenCheck,
  FiscalProfile,
} from '../../../shared/api/types';

// Les vrais crochets sont exercés : c'est eux qui portent les messages que le
// paramétreur lira, et c'est là que la traduction des codes de la DGI se joue.
const setToken = vi.fn();
const testToken = vi.fn();
vi.mock('../api', () => ({ fiscalApi: { setToken, testToken } }));

const { EmecefTokenCard } = await import('./EmecefTokenCard');

const profile: FiscalProfile = {
  legalName: 'Matelas Sankara SARL',
  tradeName: 'Matelas Sankara',
  ifu: '3201912345678',
  rccm: 'RB/COT/26 A 1234',
  fiscalAddress: 'Akpakpa, Cotonou',
  fiscalPhone: '+229 97 00 00 00',
  fiscalEmail: null,
  taxRegime: 'TPS',
  invoiceMode: 'DISABLED',
  onDemandAckAt: null,
  onDemandAckById: null,
  emecefEnv: 'TEST',
  tokenLast4: '6789',
  tokenExpiresAt: null,
  verifiedAt: null,
  nim: null,
  receiptFooter: null,
  updatedAt: '2026-10-31T08:00:00.000Z',
};

const check: EmecefTokenCheck = {
  valid: true,
  ifu: '3201912345678',
  nim: 'AB1234567',
  tokenValid: '2026-12-31T00:00:00.000Z',
  serverDateTime: '2026-10-31T09:00:00.000Z',
  tokenLast4: '6789',
};

/** Jours avant expiration → date absolue, pour ne pas dépendre du calendrier. */
function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

/** Ce que renvoie l'API quand elle refuse : le code porte le message (§12). */
function refusal(code: string) {
  return Object.assign(new Error(code), {
    isAxiosError: true,
    response: {
      status: 400,
      data: { success: false, error: { code, message: '' } },
    },
  });
}

function renderCard(
  overrides: Partial<FiscalProfile> | null = {},
  props: { queuePaused?: boolean; disabled?: boolean } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={frFR}>
        <App>
          <EmecefTokenCard
            profile={overrides === null ? null : { ...profile, ...overrides }}
            {...props}
          />
        </App>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

const tokenField = () => screen.getByPlaceholderText(/collez ici le jeton/i);

beforeEach(() => {
  setToken.mockReset();
  testToken.mockReset();
});

describe('carte du jeton e-MECeF', () => {
  describe('le jeton ne se relit pas', () => {
    it('n’affiche que ses quatre derniers caractères', () => {
      renderCard({ verifiedAt: '2026-10-31T08:30:00.000Z' });

      expect(screen.getByText(/6789$/)).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(/collez ici le jeton/i),
      ).not.toBeInTheDocument();
    });

    it('ouvre un champ vide pour le remplacer, jamais prérempli', async () => {
      const user = userEvent.setup({ delay: null });
      renderCard();

      await user.click(
        screen.getByRole('button', { name: 'Remplacer le jeton' }),
      );

      expect(tokenField()).toHaveValue('');
    });
  });

  describe('sans profil fiscal', () => {
    it('explique pourquoi le jeton ne peut pas encore être vérifié', () => {
      renderCard(null, { disabled: true });

      expect(
        screen.getByText('Complétez d’abord le profil fiscal'),
      ).toBeInTheDocument();
      expect(tokenField()).toBeDisabled();
    });

    it('n’enregistre rien tant que l’IFU n’est pas connu', async () => {
      const user = userEvent.setup({ delay: null });
      renderCard(null, { disabled: true });

      expect(
        screen.getByRole('button', { name: /enregistrer et tester/i }),
      ).toBeDisabled();
      await user.click(
        screen.getByRole('button', { name: /enregistrer et tester/i }),
      );

      expect(setToken).not.toHaveBeenCalled();
    });
  });

  describe('enregistrement d’un jeton', () => {
    async function submit(token = '  jeton-dgi-6789  ') {
      const user = userEvent.setup({ delay: null });
      renderCard(null);

      await user.type(tokenField(), token);
      await user.click(
        screen.getByRole('button', { name: /enregistrer et tester/i }),
      );
      return user;
    }

    it('jeton valide : la DGI nomme l’IFU et l’échéance', async () => {
      setToken.mockResolvedValue(check);

      await submit();

      expect(setToken).toHaveBeenCalledWith('jeton-dgi-6789', 'TEST');
      expect(
        await screen.findByText(
          /Jeton valide pour l’IFU 3201912345678, jusqu’au/,
        ),
      ).toBeInTheDocument();
    });

    it('jeton refusé : le dire sans jargon et proposer la suite', async () => {
      setToken.mockRejectedValue(refusal('EMECEF_TOKEN_INVALID'));

      await submit();

      expect(
        await screen.findByText(
          'La DGI a refusé ce jeton. Vérifiez-le ou générez-en un nouveau.',
        ),
      ).toBeInTheDocument();
    });

    it('jeton d’un autre IFU : nommer la cause exacte', async () => {
      setToken.mockRejectedValue(refusal('EMECEF_IFU_MISMATCH'));

      await submit();

      expect(
        await screen.findByText(
          'Ce jeton appartient à un autre IFU que celui du profil fiscal.',
        ),
      ).toBeInTheDocument();
    });

    it('DGI injoignable : rien à corriger, il faut réessayer', async () => {
      setToken.mockRejectedValue(refusal('EMECEF_UNAVAILABLE'));

      await submit();

      expect(
        await screen.findByText(
          'La DGI ne répond pas. Réessayez dans quelques minutes.',
        ),
      ).toBeInTheDocument();
    });

    it('respecte l’environnement choisi', async () => {
      const user = userEvent.setup({ delay: null });
      setToken.mockResolvedValue(check);
      renderCard(null);

      await user.click(screen.getByRole('radio', { name: 'Production' }));
      await user.type(tokenField(), 'jeton-prod');
      await user.click(
        screen.getByRole('button', { name: /enregistrer et tester/i }),
      );

      expect(setToken).toHaveBeenCalledWith('jeton-prod', 'PROD');
    });
  });

  describe('test d’un jeton déjà enregistré', () => {
    it('annonce l’IFU et le NIM acceptés par la DGI', async () => {
      const user = userEvent.setup({ delay: null });
      testToken.mockResolvedValue(check);
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Tester' }));

      expect(
        await screen.findByText(
          'Jeton accepté par la DGI pour l’IFU 3201912345678 · NIM AB1234567.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('échéance du jeton', () => {
    it('prévient avant la panne', () => {
      renderCard({ tokenExpiresAt: inDays(5) });

      expect(screen.getByText(/expire dans 4 jour\(s\)/)).toBeInTheDocument();
    });

    it('ne prévient pas pour un jeton encore large', () => {
      renderCard({ tokenExpiresAt: inDays(90) });

      expect(screen.queryByText(/expire dans/)).not.toBeInTheDocument();
      expect(screen.queryByText('Jeton expiré')).not.toBeInTheDocument();
    });

    it('dit clairement qu’un jeton expiré bloque toute facture', () => {
      renderCard({ tokenExpiresAt: inDays(-1) });

      expect(screen.getByText('Jeton expiré')).toBeInTheDocument();
    });
  });

  describe('file suspendue', () => {
    it('explique que la file reprendra d’elle-même', () => {
      renderCard({}, { queuePaused: true });

      expect(
        screen.getByText('Envoi des factures suspendu'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/la file reprendra d’elle-même/),
      ).toBeInTheDocument();
    });
  });
});
