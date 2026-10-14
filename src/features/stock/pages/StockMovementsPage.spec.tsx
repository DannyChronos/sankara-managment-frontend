import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import type { VariantSearchResult } from '../../../shared/api/types';

/** Dernier jeu de filtres transmis à l'API : c'est ce qu'on vérifie. */
const appels: Record<string, unknown>[] = [];

vi.mock('../hooks', () => ({
  useStockMovements: (filtres: Record<string, unknown>) => {
    appels.push(filtres);
    return {
      data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  },
}));

vi.mock('../../../shared/auth/useAuth', () => ({
  useAuth: () => ({ siteId: 'site-1', currentSite: { name: 'Cotonou' } }),
}));

vi.mock('../../../shared/auth/usePermission', () => ({
  usePermission: () => ({ can: () => true }),
}));

vi.mock('../../users/hooks', () => ({
  useUsers: () => ({
    data: { data: [{ id: 'u1', fullName: 'Abdou Moussa' }] },
    isFetching: false,
  }),
}));

const variant: VariantSearchResult = {
  id: 'v1',
  sku: 'MS-MATELASO-90190-25',
  barcode: null,
  name: '90×190 · 25 cm',
  productName: 'Matelas Ortho Confort',
  price: 120000,
  onHand: 20,
  reserved: 0,
  available: 20,
};

// Le sélecteur d'articles est testé ailleurs : ici il se réduit à un bouton.
vi.mock('../../../shared/components', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  VariantPicker: ({ onPick }: { onPick: (v: VariantSearchResult) => void }) => (
    <button type="button" onClick={() => onPick(variant)}>
      choisir l’article de test
    </button>
  ),
}));

const { StockMovementsPage } = await import('./StockMovementsPage');

function renderPage() {
  appels.length = 0;
  render(
    <ConfigProvider locale={frFR}>
      <App>
        <StockMovementsPage />
      </App>
    </ConfigProvider>,
  );
}

/** Les filtres du dernier rendu. */
const derniersFiltres = () => appels[appels.length - 1];

describe('filtres de l’historique des mouvements', () => {
  it('n’envoie que le site tant qu’aucun filtre n’est posé', () => {
    renderPage();

    expect(derniersFiltres()).toMatchObject({ siteId: 'site-1', page: 1 });
    expect(derniersFiltres()).not.toHaveProperty('type');
    expect(derniersFiltres()).not.toHaveProperty('variantId');
    expect(derniersFiltres()).not.toHaveProperty('performedById');
  });

  it('transmet le type choisi', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();

    await user.click(screen.getByText('Tous les types'));
    await user.click(await screen.findByTitle('Réception'));

    expect(derniersFiltres()).toMatchObject({ type: 'PURCHASE_IN' });
  });

  it('transmet l’article choisi et l’affiche en étiquette refermable', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();

    await user.click(screen.getByText('choisir l’article de test'));
    expect(derniersFiltres()).toMatchObject({ variantId: 'v1' });

    // L'étiquette porte le SKU, et la refermer retire le filtre.
    expect(screen.getByText(/MS-MATELASO-90190-25/)).toBeInTheDocument();
    const fermer = document.querySelector('.ant-tag-close-icon');
    if (!fermer) throw new Error('étiquette non refermable');
    await user.click(fermer);
    expect(derniersFiltres()).not.toHaveProperty('variantId');
  });

  it('transmet l’utilisateur choisi', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();

    await user.click(screen.getByText('Tous les utilisateurs'));
    await user.click(await screen.findByTitle('Abdou Moussa'));

    expect(derniersFiltres()).toMatchObject({ performedById: 'u1' });
  });

  it('transmet la période saisie, bornes comprises', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();

    const [debut, fin] = screen.getAllByPlaceholderText(/Date de/);
    await user.type(debut, '01/03/2026{Enter}');
    await user.type(fin, '31/03/2026{Enter}');

    expect(derniersFiltres()).toMatchObject({
      from: '2026-03-01',
      to: '2026-03-31',
    });
  });

  it('combine les filtres plutôt que de les remplacer', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();

    await user.click(screen.getByText('Tous les types'));
    await user.click(await screen.findByTitle('Réception'));
    await user.click(screen.getByText('choisir l’article de test'));

    expect(derniersFiltres()).toMatchObject({
      siteId: 'site-1',
      type: 'PURCHASE_IN',
      variantId: 'v1',
    });
  });

  it('revient à la première page dès qu’un filtre change', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();

    await user.click(screen.getByText('Tous les types'));
    await user.click(await screen.findByTitle('Réception'));

    expect(derniersFiltres()).toMatchObject({ page: 1 });
  });
});
