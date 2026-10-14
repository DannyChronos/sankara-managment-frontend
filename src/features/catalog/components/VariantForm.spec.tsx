import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { VariantForm } from './VariantForm';
import type { ProductVariantView } from '../../../shared/api/types';
import type { UpdateVariantPayload } from '../api';

const variant: ProductVariantView = {
  id: 'v1',
  sku: 'MS-ORTHO-140190-22',
  barcode: '6001234567890',
  name: '140×190 · 22 cm',
  widthCm: 140,
  lengthCm: 190,
  thicknessCm: 22,
  densityKgM3: 35,
  firmness: 'FIRM',
  costPrice: 90000,
  isActive: true,
  prices: { POS: 250000, WEB: null },
};

function renderForm(sur: ProductVariantView = variant) {
  const onSubmit = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <VariantForm
          variant={sur}
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

const enregistrer = () => screen.getByRole('button', { name: /enregistrer/i });
const envoi = (onSubmit: ReturnType<typeof vi.fn>): UpdateVariantPayload =>
  onSubmit.mock.calls[0][0] as UpdateVariantPayload;

describe('modification d’une variante', () => {
  it('reprend les valeurs existantes', async () => {
    renderForm();

    expect(
      await screen.findByDisplayValue('140×190 · 22 cm'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('6001234567890')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('montre le SKU sans permettre de le changer', () => {
    renderForm();

    // Affiché pour situer la variante — dans le titre et le bandeau…
    expect(screen.getAllByText(/MS-ORTHO-140190-22/).length).toBeGreaterThan(0);
    // …mais aucun champ ne le porte.
    expect(
      screen.queryByDisplayValue('MS-ORTHO-140190-22'),
    ).not.toBeInTheDocument();
  });

  it('n’envoie jamais le SKU au serveur', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onSubmit } = renderForm();

    await screen.findByDisplayValue('140×190 · 22 cm');
    await user.click(enregistrer());

    expect(envoi(onSubmit)).not.toHaveProperty('sku');
  });

  it('exige un libellé', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onSubmit } = renderForm();

    const libelle = await screen.findByDisplayValue('140×190 · 22 cm');
    await user.clear(libelle);
    await user.click(enregistrer());

    expect(
      await screen.findByText(/libellé est obligatoire/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('transmet le code-barres corrigé', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onSubmit } = renderForm();

    const code = await screen.findByDisplayValue('6001234567890');
    await user.clear(code);
    await user.type(code, '6009876543210');
    await user.click(enregistrer());

    expect(envoi(onSubmit).barcode).toBe('6009876543210');
  });

  it('omet le code-barres vidé plutôt que d’envoyer une chaîne vide', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onSubmit } = renderForm();

    const code = await screen.findByDisplayValue('6001234567890');
    await user.clear(code);
    await user.click(enregistrer());

    expect(envoi(onSubmit)).not.toHaveProperty('barcode');
  });

  it('permet de désactiver une variante', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onSubmit } = renderForm();

    await screen.findByDisplayValue('140×190 · 22 cm');
    await user.click(screen.getByRole('switch'));
    await user.click(enregistrer());

    expect(envoi(onSubmit).isActive).toBe(false);
  });
});
