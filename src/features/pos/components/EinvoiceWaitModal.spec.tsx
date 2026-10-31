import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import type {
  NormalizedInvoice,
  Order,
  SaleEinvoice,
} from '../../../shared/api/types';

// Le bouton PDF va chercher le document derrière le jeton : la requête ne
// doit jamais partir en test, mais le bouton doit rester le vrai bouton —
// c'est lui que la touche Entrée est censée actionner.
const get = vi.fn(() => new Promise(() => {}));
vi.mock('../../../shared/api/http', () => ({ http: { get } }));

const { EinvoiceWaitModal } = await import('./EinvoiceWaitModal');

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
  einvoiceStatus: 'PENDING',
  buyer: null,
  lines: [],
  payments: [
    {
      id: 'p1',
      method: 'CASH',
      direction: 'IN',
      amount: 185000,
      amountTendered: 200000,
      changeGiven: 15000,
      reference: null,
      createdAt: '2026-10-31T09:00:00.000Z',
    },
  ],
  receiptUrl: '/api/v1/sales/o1/receipt',
};

const invoice: NormalizedInvoice = {
  id: 'inv1',
  kind: 'SALE',
  status: 'CONFIRMED',
  env: 'TEST',
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

const confirmed: SaleEinvoice = {
  status: 'CONFIRMED',
  invoiceRequested: true,
  kind: 'SALE',
  invoice,
  creditNotes: [],
  receiptUrl: '/api/v1/sales/o1/receipt',
};

const rejected: SaleEinvoice = {
  ...confirmed,
  status: 'REJECTED',
  invoice: {
    ...invoice,
    status: 'REJECTED',
    mecefCode: null,
    nim: null,
    counters: null,
    qrCode: null,
    confirmedAt: null,
    rejectionCode: 'DGI_8',
    rejectionReason: 'errorCode 8',
  },
};

function renderModal({
  einvoice,
  timedOut = false,
}: {
  einvoice?: SaleEinvoice;
  timedOut?: boolean;
}) {
  const onWaitMore = vi.fn();
  const onClose = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <EinvoiceWaitModal
          open
          sale={sale}
          einvoice={einvoice}
          timedOut={timedOut}
          onWaitMore={onWaitMore}
          onClose={onClose}
        />
      </App>
    </ConfigProvider>,
  );

  return { onWaitMore, onClose };
}

describe('attente de la facture après encaissement', () => {
  it('annonce le rendu avant tout : le client attend sa monnaie', () => {
    renderModal({});

    expect(screen.getByText(/Rendu/)).toBeInTheDocument();
    expect(screen.getByText(/15 000/)).toBeInTheDocument();
  });

  it('laisse toujours passer à la vente suivante', () => {
    renderModal({});

    expect(
      screen.getByRole('button', { name: /vente suivante/i }),
    ).toBeEnabled();
  });

  describe('facture en cours', () => {
    it('fait patienter sans proposer d’impression', () => {
      renderModal({});

      expect(
        screen.getByText('Facture normalisée en cours…'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /imprimer/i })).toBeNull();
    });
  });

  describe('facture confirmée', () => {
    it('montre les éléments de sécurité de la DGI', () => {
      renderModal({ einvoice: confirmed });

      expect(
        screen.getByText('Facture normalisée enregistrée par la DGI'),
      ).toBeInTheDocument();
      // Groupé par quatre, comme sur le ticket.
      expect(screen.getByText('ME6F-AM9V-4H45-3ANJ')).toBeInTheDocument();
      expect(screen.getByText('AB1234567')).toBeInTheDocument();
    });

    it('propose d’imprimer la facture', () => {
      renderModal({ einvoice: confirmed });

      expect(
        screen.getByRole('button', { name: /imprimer la facture/i }),
      ).toBeInTheDocument();
    });
  });

  describe('facture refusée', () => {
    it('traduit le motif et rassure sur la vente', () => {
      renderModal({ einvoice: rejected });

      expect(
        screen.getByText('La DGI a refusé la facture'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Facture sans article/)).toBeInTheDocument();
      expect(
        screen.getByText('La vente est bien enregistrée'),
      ).toBeInTheDocument();
    });

    it('fait imprimer un reçu, pas une facture qui n’existe pas', () => {
      renderModal({ einvoice: rejected });

      expect(
        screen.getByRole('button', { name: /imprimer le reçu/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /imprimer la facture/i }),
      ).toBeNull();
    });
  });

  describe('dix secondes écoulées', () => {
    it('offre un reçu provisoire sans fermer la porte à la facture', () => {
      renderModal({ timedOut: true });

      expect(
        screen.getByText('La facture n’est pas encore prête.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /imprimer un reçu provisoire/i }),
      ).toBeInTheDocument();
    });

    it('permet de patienter encore', async () => {
      const user = userEvent.setup({ delay: null });
      const { onWaitMore } = renderModal({ timedOut: true });

      await user.click(
        screen.getByRole('button', { name: /attendre encore/i }),
      );

      expect(onWaitMore).toHaveBeenCalledTimes(1);
    });
  });

  describe('clavier du comptoir', () => {
    it('Entrée imprime le document du moment', async () => {
      const user = userEvent.setup({ delay: null });
      get.mockClear();
      renderModal({ einvoice: confirmed });

      await user.keyboard('{Enter}');

      expect(get).toHaveBeenCalledWith(
        '/sales/o1/receipt',
        expect.objectContaining({ responseType: 'blob' }),
      );
    });

    it('Entrée n’imprime rien tant qu’il n’y a rien à imprimer', async () => {
      const user = userEvent.setup({ delay: null });
      get.mockClear();
      renderModal({});

      await user.keyboard('{Enter}');

      expect(get).not.toHaveBeenCalled();
    });

    it('Échap passe à la vente suivante', async () => {
      const user = userEvent.setup({ delay: null });
      const { onClose } = renderModal({ einvoice: confirmed });

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
