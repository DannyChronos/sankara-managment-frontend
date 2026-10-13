import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { CountSheet } from './CountSheet';
import type { InventoryLine } from '../../../shared/api/types';

const lines: InventoryLine[] = [
  {
    id: 'l1',
    variantId: 'v1',
    sku: 'MS-A',
    variantName: '140×190',
    productName: 'Matelas Éco',
    expectedQty: 7,
    countedQty: null,
    difference: null,
  },
  {
    id: 'l2',
    variantId: 'v2',
    sku: 'MS-B',
    variantName: '160×200',
    productName: 'Matelas Deluxe',
    expectedQty: 3,
    countedQty: 3,
    difference: 0,
  },
];

function renderSheet() {
  const onSave = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <CountSheet lines={lines} saving={false} onSave={onSave} />
      </App>
    </ConfigProvider>,
  );

  return { onSave };
}

const saveButton = () => screen.getByRole('button', { name: /enregistrer/i });

describe('feuille de comptage', () => {
  it('masque le théorique : voir le chiffre attendu, c’est le compter', async () => {
    const user = userEvent.setup();
    renderSheet();

    expect(screen.queryAllByText('Théorique')).toHaveLength(0);

    await user.click(
      screen.getByRole('switch', { name: 'Afficher le théorique' }),
    );

    expect(screen.queryAllByText('Théorique').length).toBeGreaterThan(0);
  });

  it('n’enregistre que ce qui a changé', async () => {
    const user = userEvent.setup();
    const { onSave } = renderSheet();

    expect(saveButton()).toBeDisabled();

    const [first] = screen.getAllByRole('spinbutton');
    await user.type(first, '5');
    await user.click(saveButton());

    expect(onSave).toHaveBeenCalledWith([{ variantId: 'v1', countedQty: 5 }]);
  });

  it('un bip de douchette ajoute une unité à la référence scannée', async () => {
    const user = userEvent.setup();
    const { onSave } = renderSheet();

    const scan = screen.getByPlaceholderText(/scanner ou saisir un sku/i);
    await user.type(scan, 'MS-A{Enter}');
    await user.type(scan, 'MS-A{Enter}');
    await user.click(saveButton());

    expect(onSave).toHaveBeenCalledWith([{ variantId: 'v1', countedQty: 2 }]);
  });

  it('signale un code inconnu au lieu de compter dans le vide', async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(
      screen.getByPlaceholderText(/scanner ou saisir un sku/i),
      'MS-INCONNU{Enter}',
    );

    expect(screen.getByText(/aucune ligne pour/i)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('le filtre « reste à compter » ne garde que les lignes vides', async () => {
    const user = userEvent.setup();
    renderSheet();

    expect(screen.getByText('Matelas Deluxe — 160×200')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Reste à compter' }));

    expect(
      screen.queryByText('Matelas Deluxe — 160×200'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Matelas Éco — 140×190')).toBeInTheDocument();
  });
});
