import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { NormalizeLateModal } from './NormalizeLateModal';
import type { EinvoiceBuyer } from '../../../shared/api/types';

function renderModal(defaultBuyer?: EinvoiceBuyer) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <NormalizeLateModal
          open
          saleNumber="MS-COT-2026-000012"
          pending={false}
          defaultBuyer={defaultBuyer}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      </App>
    </ConfigProvider>,
  );

  return { onSubmit, onCancel };
}

const submitButton = () =>
  screen.getByRole('button', { name: 'Émettre la facture' });
const ifuField = () => screen.getByPlaceholderText('3201 9123 4567 8');

describe('émission tardive d’une facture normalisée', () => {
  it('nomme la vente concernée : le caissier en a plusieurs à l’esprit', () => {
    renderModal();

    expect(screen.getByText(/MS-COT-2026-000012/)).toBeInTheDocument();
  });

  it('émet pour un particulier sans rien demander', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderModal();

    expect(
      screen.getByText('Les deux champs sont facultatifs.'),
    ).toBeInTheDocument();
    await user.click(submitButton());

    // Aucun acheteur : la facture sort au nom d'un client non identifié.
    expect(onSubmit).toHaveBeenCalledWith(undefined);
  });

  it('transmet la raison sociale et l’IFU d’une entreprise', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderModal();

    await user.type(
      screen.getByPlaceholderText('Nom de l’acheteur'),
      'Sonacop SA',
    );
    await user.click(ifuField());
    await user.paste('3201 9123 4567 8');
    await user.click(submitButton());

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Sonacop SA',
      ifu: '3201912345678',
    });
  });

  it('refuse d’émettre sur un IFU incomplet que la DGI rejetterait', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderModal();

    await user.click(ifuField());
    await user.paste('32019');

    expect(
      screen.getByText('L’IFU doit compter 13 chiffres.'),
    ).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    await user.click(submitButton());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('part de l’acheteur déjà connu de la fiche client', () => {
    renderModal({ name: 'Sonacop SA', ifu: '3201912345678' });

    expect(screen.getByPlaceholderText('Nom de l’acheteur')).toHaveValue(
      'Sonacop SA',
    );
    expect(ifuField()).toHaveValue('3201 9123 4567 8');
  });
});
