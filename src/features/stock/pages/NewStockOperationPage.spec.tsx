import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { MemoryRouter } from 'react-router-dom';
import type { VariantSearchResult } from '../../../shared/api/types';

const mutate = vi.fn();

vi.mock('../hooks', () => ({
  useCreateOperation: () => ({ mutate, isPending: false }),
  useSuppliers: () => ({ data: { data: [] }, isPending: false }),
}));

// La recherche d'articles est testée ailleurs : ici on vérifie les règles du
// bon lui-même, donc le sélecteur est réduit à un bouton qui ajoute la ligne.
const variant: VariantSearchResult = {
  id: 'v1',
  sku: 'MAT-160-DELUXE',
  barcode: null,
  name: '160x200',
  productName: 'Matelas Deluxe',
  price: 185000,
  onHand: 5,
  reserved: 0,
  available: 5,
};

vi.mock('../components/VariantPicker', () => ({
  VariantPicker: ({ onPick }: { onPick: (v: VariantSearchResult) => void }) => (
    <button type="button" onClick={() => onPick(variant)}>
      ajouter l’article de test
    </button>
  ),
}));

const { NewStockOperationPage } = await import('./NewStockOperationPage');

function renderPage(search = '') {
  return render(
    <ConfigProvider locale={frFR}>
      <App>
        <MemoryRouter initialEntries={[`/stock/operations/new${search}`]}>
          <NewStockOperationPage />
        </MemoryRouter>
      </App>
    </ConfigProvider>,
  );
}

const submitButton = () =>
  screen.getByRole('button', { name: /créer le brouillon/i });
const addLine = () =>
  screen.getByRole('button', { name: /ajouter l’article de test/i });

describe('nouveau bon de stock', () => {
  it('refuse la création d’un bon sans ligne', () => {
    renderPage();

    expect(submitButton()).toBeDisabled();
  });

  it('crée un bon d’entrée dès qu’une ligne est saisie', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(addLine());
    expect(submitButton()).toBeEnabled();

    await user.click(submitButton());

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PRODUCTION_ENTRY',
        lines: [{ variantId: 'v1', quantity: 1 }],
      }),
      expect.anything(),
    );
  });

  it('exige un motif pour une sortie (F-14)', async () => {
    const user = userEvent.setup();
    renderPage('?type=WRITE_OFF');

    await user.click(addLine());
    expect(submitButton()).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(/mousse déchirée/i),
      'Mousse déchirée au stockage',
    );

    expect(submitButton()).toBeEnabled();
  });

  it('ne propose le prix de revient que sur une entrée', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPage();

    await user.click(addLine());
    expect(screen.getByText('Prix de revient')).toBeInTheDocument();
    unmount();

    renderPage('?type=SAMPLE');
    await user.click(addLine());
    expect(screen.queryByText('Prix de revient')).not.toBeInTheDocument();
  });

  it('alerte quand la quantité sortie dépasse le disponible', async () => {
    const user = userEvent.setup();
    renderPage('?type=INTERNAL_USE');

    await user.click(addLine());
    const quantity = screen.getByRole('spinbutton');
    await user.clear(quantity);
    await user.type(quantity, '9');

    expect(
      screen.getByText(/quantité supérieure au disponible/i),
    ).toBeInTheDocument();
  });
});
