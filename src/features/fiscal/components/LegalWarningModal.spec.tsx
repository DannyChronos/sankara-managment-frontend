import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { LegalWarningModal } from './LegalWarningModal';

function renderModal(pending = false) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <LegalWarningModal
          open
          pending={pending}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </App>
    </ConfigProvider>,
  );

  return { onCancel, onConfirm };
}

const confirmButton = () =>
  screen.getByRole('button', { name: 'Choisir ce mode' });

describe('avertissement du mode « à la demande »', () => {
  it('dit ce que la DGI attend et ce que l’entreprise risque', () => {
    renderModal();

    expect(
      screen.getByText(/toute vente d’une entreprise assujettie/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/expose l’entreprise à des amendes/i),
    ).toBeInTheDocument();
  });

  it('prévient que le choix est enregistré avec son auteur', () => {
    renderModal();

    expect(screen.getByText(/avec votre nom et la date/i)).toBeInTheDocument();
  });

  it('n’engage personne sans case cochée', () => {
    renderModal();

    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(confirmButton()).toBeDisabled();
  });

  it('ne confirme qu’en connaissance de cause', async () => {
    const user = userEvent.setup({ delay: null });
    const { onConfirm } = renderModal();

    await user.click(screen.getByRole('checkbox'));
    expect(confirmButton()).toBeEnabled();

    await user.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('oublie la case cochée quand on renonce : la prochaine fois se relit', async () => {
    const user = userEvent.setup({ delay: null });
    const { onCancel } = renderModal();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
