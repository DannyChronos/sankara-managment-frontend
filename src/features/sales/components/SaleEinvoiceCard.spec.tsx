import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../../shared/auth/auth.store';
import type {
  CurrentUser,
  NormalizedInvoice,
  Order,
  SaleEinvoice,
} from '../../../shared/api/types';

// Le PDF est protégé par le jeton : la requête ne doit pas partir en test.
vi.mock('../../../shared/api/http', () => ({
  http: { get: vi.fn(() => new Promise(() => {})) },
}));

const { SaleEinvoiceCard } = await import('./SaleEinvoiceCard');

const sale: Order = {
  id: 'o1',
  number: 'MS-COT-2026-000012',
  channel: 'POS',
  status: 'PAID',
  site: { id: 's1', code: 'COT', name: 'Cotonou' },
  cashSessionId: 'cs1',
  cashier: { id: 'u1', fullName: 'Awa-Marie Recette' },
  customer: null,
  subtotal: 185000,
  discountTotal: 0,
  total: 185000,
  paidTotal: 185000,
  refundedTotal: 0,
  note: null,
  cancelledAt: null,
  cancelReason: null,
  createdAt: '2026-10-31T09:00:00.000Z',
  invoiceRequested: true,
  einvoiceStatus: 'CONFIRMED',
  buyer: null,
  lines: [],
  payments: [],
  receiptUrl: '/api/v1/sales/o1/receipt',
};

const invoice: NormalizedInvoice = {
  id: 'inv1',
  kind: 'SALE',
  status: 'CONFIRMED',
  env: 'PROD',
  orderId: 'o1',
  orderReturnId: null,
  originalInvoiceId: null,
  sellerIfu: '3201912345678',
  operator: { code: 'CAISSE1', name: 'Awa-Marie Recette' },
  buyerName: null,
  buyerIfu: null,
  expectedTotal: 185000,
  dgiUid: 'uid-1',
  dgiTotal: 185000,
  dgiTotals: null,
  mecefCode: 'ME6FAM9V4H453ANJ',
  nim: 'AB1234567',
  counters: '1/1 FV',
  qrCode: 'https://developper.impots.bj/check/ME6FAM9V4H453ANJ',
  dgiDateTime: '2026-10-31T09:00:03.000Z',
  submittedAt: '2026-10-31T09:00:01.000Z',
  confirmedAt: '2026-10-31T09:00:03.000Z',
  requestedAfterSale: false,
  attemptCount: 1,
  nextAttemptAt: null,
  lastError: null,
  rejectionCode: null,
  rejectionReason: null,
  createdAt: '2026-10-31T09:00:00.000Z',
};

const einvoice: SaleEinvoice = {
  status: 'CONFIRMED',
  invoiceRequested: true,
  kind: 'SALE',
  invoice,
  creditNotes: [],
  receiptUrl: '/api/v1/sales/o1/receipt',
};

function signIn(...permissions: string[]) {
  const user: CurrentUser = {
    id: 'u1',
    fullName: 'Awa-Marie Recette',
    email: 'awa@example.bj',
    phone: null,
    roleCode: 'CASHIER',
    roleName: 'Caissier',
    permissions,
    sites: [],
    discountCapPercent: null,
  };
  useAuthStore.setState({ user, accessToken: 'jeton', initialized: true });
}

function renderCard({
  state,
  sameDay = true,
  loading = false,
}: {
  state?: Partial<SaleEinvoice> | null;
  sameDay?: boolean;
  loading?: boolean;
}) {
  const onNormalizeLate = vi.fn();
  const onRetry = vi.fn();
  const value = state === null ? undefined : { ...einvoice, ...state };

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <MemoryRouter>
          <SaleEinvoiceCard
            sale={{ ...sale, einvoiceStatus: value?.status ?? 'NOT_REQUESTED' }}
            einvoice={value}
            loading={loading}
            sameDay={sameDay}
            retrying={false}
            onNormalizeLate={onNormalizeLate}
            onRetry={onRetry}
          />
        </MemoryRouter>
      </App>
    </ConfigProvider>,
  );

  return { onNormalizeLate, onRetry };
}

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null });
});

describe('bloc facture normalisée d’une vente', () => {
  describe('aucune facture demandée', () => {
    it('le dit sans alarmer : la vente a eu son reçu', () => {
      signIn();
      renderCard({ state: { status: 'NOT_REQUESTED', invoice: null } });

      expect(
        screen.getByText(/a donné lieu à un reçu simple/),
      ).toBeInTheDocument();
    });

    it('propose l’émission tardive à qui en a le droit, le jour même', () => {
      signIn('einvoice:normalize-late');
      const { onNormalizeLate } = renderCard({
        state: { status: 'NOT_REQUESTED', invoice: null },
      });

      expect(
        screen.getByRole('button', { name: 'Émettre la facture normalisée' }),
      ).toBeInTheDocument();
      expect(onNormalizeLate).not.toHaveBeenCalled();
    });

    it('explique le refus passé minuit plutôt que d’offrir un bouton inerte', () => {
      signIn('einvoice:normalize-late');
      renderCard({
        state: { status: 'NOT_REQUESTED', invoice: null },
        sameDay: false,
      });

      expect(
        screen.queryByRole('button', { name: 'Émettre la facture normalisée' }),
      ).toBeNull();
      expect(screen.getByText(/que le jour de la vente/)).toBeInTheDocument();
    });

    it('ne montre rien à qui n’a pas la permission', () => {
      signIn();
      renderCard({ state: { status: 'NOT_REQUESTED', invoice: null } });

      expect(
        screen.queryByRole('button', { name: 'Émettre la facture normalisée' }),
      ).toBeNull();
    });
  });

  describe('facture en cours', () => {
    it('dit où en est l’envoi, et n’offre aucune action', () => {
      signIn('einvoice:retry', 'einvoice:normalize-late');
      renderCard({
        state: {
          status: 'PENDING',
          invoice: { ...invoice, status: 'PENDING', mecefCode: null },
        },
      });

      expect(
        screen.getByText('Facture en cours de traitement'),
      ).toBeInTheDocument();
      // Pendant le traitement, rien n'est à relancer ni à réémettre.
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('indique la prochaine tentative quand il y en a une', () => {
      signIn();
      renderCard({
        state: {
          status: 'PENDING',
          invoice: {
            ...invoice,
            status: 'PENDING',
            nextAttemptAt: '2026-10-31T09:05:00.000Z',
          },
        },
      });

      expect(screen.getByText(/prochaine tentative à/)).toBeInTheDocument();
    });
  });

  describe('facture refusée', () => {
    const rejected = {
      status: 'REJECTED' as const,
      invoice: {
        ...invoice,
        status: 'REJECTED' as const,
        mecefCode: null,
        rejectionCode: 'DGI_1',
        rejectionReason: 'errorCode 1',
      },
    };

    it('traduit le motif et garde la réponse brute pour le support', () => {
      signIn();
      renderCard({ state: rejected });

      expect(
        screen.getByText('Trop de factures en attente chez la DGI.'),
      ).toBeInTheDocument();
      expect(screen.getByText(/errorCode 1/)).toBeInTheDocument();
      expect(
        screen.getByText(/elle n’a pas à être refaite/),
      ).toBeInTheDocument();
    });

    it('permet de relancer à qui en a le droit', async () => {
      const user = userEvent.setup({ delay: null });
      signIn('einvoice:retry');
      const { onRetry } = renderCard({ state: rejected });

      await user.click(
        screen.getByRole('button', { name: 'Relancer la facture' }),
      );

      expect(onRetry).toHaveBeenCalledWith('inv1');
    });

    it('cache la relance à qui ne l’a pas', () => {
      signIn();
      renderCard({ state: rejected });

      expect(
        screen.queryByRole('button', { name: 'Relancer la facture' }),
      ).toBeNull();
    });
  });

  describe('facture confirmée', () => {
    it('montre les éléments de sécurité de la DGI', () => {
      signIn();
      renderCard({ state: {} });

      expect(screen.getByText('ME6F-AM9V-4H45-3ANJ')).toBeInTheDocument();
      expect(screen.getByText('AB1234567')).toBeInTheDocument();
      expect(screen.getByText('1/1 FV')).toBeInTheDocument();
    });

    it('offre le ticket et la facture A4', () => {
      signIn();
      renderCard({ state: {} });

      expect(
        screen.getByRole('button', { name: /ticket/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /facture a4/i }),
      ).toBeInTheDocument();
    });

    it('avertit quand la facture vient du test, sans valeur fiscale', () => {
      signIn();
      renderCard({ state: { invoice: { ...invoice, env: 'TEST' } } });

      expect(
        screen.getByText(/Émise en environnement de test/),
      ).toBeInTheDocument();
    });

    it('ne parle pas de test pour une facture réelle', () => {
      signIn();
      renderCard({ state: {} });

      expect(
        screen.queryByText(/environnement de test/),
      ).not.toBeInTheDocument();
    });
  });

  describe('avoirs liés', () => {
    it('les liste sans faire croire que la facture est annulée', () => {
      signIn('einvoice:read');
      renderCard({
        state: {
          creditNotes: [
            {
              ...invoice,
              id: 'inv2',
              kind: 'CREDIT_NOTE',
              mecefCode: 'AV1FAM9V4H453ANJ',
              expectedTotal: 50000,
            },
          ],
        },
      });

      expect(screen.getByText('Avoirs liés')).toBeInTheDocument();
      expect(screen.getByText('AV1FAM9V4H453ANJ')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Détail' })).toHaveAttribute(
        'href',
        '/einvoices/inv2',
      );
    });
  });

  it('patiente pendant le chargement plutôt que d’affirmer l’absence', () => {
    signIn();
    renderCard({ state: null, loading: true });

    expect(
      screen.queryByText(/a donné lieu à un reçu simple/),
    ).not.toBeInTheDocument();
  });
});
