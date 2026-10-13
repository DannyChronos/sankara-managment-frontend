import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { ReceiveTransferModal } from './ReceiveTransferModal';
import type { Transfer } from '../../../shared/api/types';

const transfer: Transfer = {
  id: 't1',
  number: 'TR-2026-00007',
  status: 'SHIPPED',
  note: null,
  fromSite: { id: 's1', code: 'COT', name: 'Cotonou' },
  toSite: { id: 's2', code: 'PNV', name: 'Porto-Novo' },
  shippedAt: '2026-10-13T08:00:00.000Z',
  receivedAt: null,
  createdAt: '2026-10-13T07:00:00.000Z',
  totalSent: 5,
  totalReceived: 0,
  lines: [
    {
      id: 'l1',
      variantId: 'v1',
      sku: 'MS-MATELASD-150190-22',
      variantName: '150×190 · 22 cm',
      productName: 'Matelas Deluxe',
      quantitySent: 5,
      quantityReceived: null,
      gap: null,
      gapReason: null,
    },
  ],
};

function renderModal() {
  const onSubmit = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <ReceiveTransferModal
          transfer={transfer}
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

const confirmButton = () =>
  screen.getByRole('button', { name: /confirmer la réception/i });

describe('réception d’un transfert', () => {
  it('pré-remplit la quantité attendue : le cas courant est « tout est arrivé »', () => {
    renderModal();

    expect(screen.getByRole('spinbutton')).toHaveValue('5');
    expect(screen.getByText('conforme')).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it('bloque la confirmation tant qu’un écart n’est pas justifié', async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();

    const received = screen.getByRole('spinbutton');
    await user.clear(received);
    await user.type(received, '3');

    expect(screen.getByText(/1 ligne\(s\) en écart/i)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/carton manquant/i),
      'Carton manquant à l’arrivée',
    );

    expect(confirmButton()).toBeEnabled();
  });

  it('renvoie le motif seulement sur les lignes en écart', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderModal();

    const received = screen.getByRole('spinbutton');
    await user.clear(received);
    await user.type(received, '3');
    await user.type(
      screen.getByPlaceholderText(/carton manquant/i),
      'Carton perdu',
    );
    await user.click(confirmButton());

    expect(onSubmit).toHaveBeenCalledWith([
      { lineId: 'l1', quantityReceived: 3, gapReason: 'Carton perdu' },
    ]);
  });

  it('ne laisse pas recevoir plus qu’il n’a été expédié', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderModal();

    const received = screen.getByRole('spinbutton');
    await user.clear(received);
    await user.type(received, '9');
    await user.click(confirmButton());

    // Le champ est borné à l'expédié : la valeur remontée reste 5.
    expect(onSubmit).toHaveBeenCalledWith([
      { lineId: 'l1', quantityReceived: 5 },
    ]);
  });
});
