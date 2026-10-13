import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { ReturnModal } from './ReturnModal';
import type { Order } from '../../../shared/api/types';

const order: Order = {
  id: 'o1',
  number: 'MS-COT-2026-000003',
  channel: 'POS',
  status: 'PAID',
  site: { id: 's1', code: 'COT', name: 'Cotonou' },
  cashSessionId: 'cs1',
  cashier: { id: 'u1', fullName: 'Awa-Marie Recette' },
  customer: null,
  subtotal: 400000,
  discountTotal: 0,
  total: 400000,
  paidTotal: 400000,
  refundedTotal: 0,
  note: null,
  cancelledAt: null,
  cancelReason: null,
  createdAt: '2026-10-13T09:00:00.000Z',
  lines: [
    {
      id: 'l1',
      variantId: 'v1',
      skuSnapshot: 'MS-A',
      nameSnapshot: 'Matelas Deluxe 150×190',
      quantity: 2,
      unitPrice: 150000,
      discount: 0,
      lineTotal: 300000,
      returnedQty: 1,
    },
    {
      id: 'l2',
      variantId: 'v2',
      skuSnapshot: 'MS-B',
      nameSnapshot: 'Oreiller mousse',
      quantity: 1,
      unitPrice: 100000,
      discount: 0,
      lineTotal: 100000,
      returnedQty: 1,
    },
  ],
  payments: [],
  receiptUrl: '/api/v1/sales/o1/receipt',
};

function renderModal() {
  const onSubmit = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <ReturnModal
          order={order}
          open
          pending={false}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />
      </App>
    </ConfigProvider>,
  );

  return { onSubmit };
}

const submitButton = () =>
  screen.getByRole('button', { name: /enregistrer le retour/i });

describe('retour sur une vente', () => {
  it('ne propose que ce qui n’est pas déjà revenu', () => {
    renderModal();

    expect(screen.getByText('Matelas Deluxe 150×190')).toBeInTheDocument();
    // La deuxième ligne est entièrement retournée : elle n'a plus rien à rendre.
    expect(screen.queryByText('Oreiller mousse')).not.toBeInTheDocument();
  });

  it('refuse un retour sans article choisi', () => {
    renderModal();

    expect(submitButton()).toBeDisabled();
  });

  it('exige un motif même quand un article est choisi', async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();

    const quantity = screen.getByRole('spinbutton');
    await user.clear(quantity);
    await user.type(quantity, '1');

    expect(submitButton()).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/trop ferme/i), 'Trop ferme');

    expect(submitButton()).toBeEnabled();
  });

  it('calcule le remboursement sur le prix réellement payé', async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();

    const quantity = screen.getByRole('spinbutton');
    await user.clear(quantity);
    await user.type(quantity, '1');

    // 300 000 pour 2 articles → 150 000 l'unité, remise comprise.
    const refund = screen.getByText(/Montant remboursé/).textContent ?? '';
    expect(refund.replace(/\s/g, ' ')).toMatch(/150 000 FCFA/);
  });

  it('renvoie les lignes choisies, le motif et le mode de remboursement', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderModal();

    const quantity = screen.getByRole('spinbutton');
    await user.clear(quantity);
    await user.type(quantity, '1');
    await user.type(screen.getByPlaceholderText(/trop ferme/i), 'Trop ferme');
    await user.click(submitButton());

    expect(onSubmit).toHaveBeenCalledWith({
      lines: [{ orderLineId: 'l1', quantity: 1 }],
      reason: 'Trop ferme',
      restock: true,
      refundMethod: 'CASH',
    });
  });

  it('permet de ne pas remettre en stock un article abîmé', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderModal();

    const quantity = screen.getByRole('spinbutton');
    await user.clear(quantity);
    await user.type(quantity, '1');
    await user.type(
      screen.getByPlaceholderText(/trop ferme/i),
      'Housse déchirée',
    );
    await user.click(
      screen.getByRole('switch', { name: 'Remettre en stock vendable' }),
    );
    await user.click(submitButton());

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ restock: false }),
    );
  });
});
