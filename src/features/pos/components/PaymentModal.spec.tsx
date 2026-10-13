import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { PaymentModal } from './PaymentModal';

function renderModal(props: Partial<Parameters<typeof PaymentModal>[0]> = {}) {
  const onSubmit = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <PaymentModal
          open
          total={200000}
          pending={false}
          failure={null}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
          {...props}
        />
      </App>
    </ConfigProvider>,
  );

  return { onSubmit };
}

const validateButton = () => screen.getByRole('button', { name: /valider/i });

describe('fenêtre d’encaissement', () => {
  it('propose le montant exact en espèces à l’ouverture', () => {
    renderModal();

    expect(screen.getByText(/encaisser/i)).toBeInTheDocument();
    expect(screen.getByText('Montant exact')).toBeInTheDocument();
    expect(validateButton()).toBeEnabled();
  });

  it('bloque la validation tant que la somme ne couvre pas le total (RG-06)', async () => {
    const user = userEvent.setup();
    renderModal();

    const amount = screen.getAllByRole('spinbutton')[0];
    await user.clear(amount);
    await user.type(amount, '150000');

    expect(screen.getByText(/reste/i)).toBeInTheDocument();
    expect(validateButton()).toBeDisabled();
  });

  it('affiche le rendu monnaie dès que le montant remis dépasse le dû', async () => {
    const user = userEvent.setup();
    renderModal();

    const tendered = screen.getByPlaceholderText('Remis');
    await user.type(tendered, '250000');

    expect(screen.getByText('Rendu monnaie')).toBeInTheDocument();
    expect(screen.getByText(/50\s*000\s*FCFA/)).toBeInTheDocument();
  });

  it('exige une référence hors espèces', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /ajouter un mode/i }));
    // Le second paiement est électronique : sans référence, pas de validation.
    expect(screen.getByPlaceholderText('Référence')).toBeInTheDocument();
    expect(validateButton()).toBeDisabled();
  });

  it('propose de réessayer après une coupure réseau', () => {
    renderModal({ failure: 'Connexion perdue.' });

    expect(
      screen.getByText(/la vente n’est pas confirmée/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
  });

  it('renvoie les paiements saisis', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await user.type(screen.getByPlaceholderText('Remis'), '200000');
    await user.click(validateButton());

    expect(onSubmit).toHaveBeenCalledWith([
      { method: 'CASH', amount: 200000, amountTendered: 200000 },
    ]);
  });
});
