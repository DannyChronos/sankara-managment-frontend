import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { SupplierForm } from './SupplierForm';
import type { Supplier } from '../../../shared/api/types';

const supplier: Supplier = {
  id: 's1',
  name: 'Mousse du Bénin SARL',
  phone: '+22921300000',
  email: 'contact@mousse.bj',
  address: 'Zone industrielle, Cotonou',
  isActive: true,
  operationCount: 4,
  createdAt: '2026-01-12T09:00:00.000Z',
  updatedAt: '2026-10-13T09:00:00.000Z',
};

function renderForm(existing?: Supplier) {
  const onSubmit = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <SupplierForm
          supplier={existing}
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

const submit = () => screen.getByRole('button', { name: /créer|enregistrer/i });

describe('fiche fournisseur', () => {
  it('exige une raison sociale', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderForm();

    await user.click(submit());

    expect(await screen.findByText(/nom est obligatoire/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuse un email mal formé avant d’appeler le serveur', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderForm();

    await user.type(screen.getByPlaceholderText(/Mousse du Bénin/), 'Textile');
    await user.type(screen.getByPlaceholderText(/contact@/), 'pas-un-email');
    await user.click(submit());

    expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('n’envoie pas les champs laissés vides', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderForm();

    await user.type(
      screen.getByPlaceholderText(/Mousse du Bénin/),
      'Textile Atlantique',
    );
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Textile Atlantique' });
  });

  it('ne propose pas de désactiver une fiche qui n’existe pas encore', () => {
    renderForm();

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('permet de désactiver une fiche existante', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSubmit } = renderForm(supplier);

    // Les valeurs sont posées à l'ouverture de la modale, pas au montage.
    await screen.findByDisplayValue('Mousse du Bénin SARL');
    expect(screen.getByRole('switch')).toBeChecked();

    await user.click(screen.getByRole('switch'));
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mousse du Bénin SARL',
        isActive: false,
      }),
    );
  });
});
