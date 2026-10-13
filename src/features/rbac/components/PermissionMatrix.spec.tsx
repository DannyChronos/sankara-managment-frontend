import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { PermissionMatrix } from './PermissionMatrix';
import type { PermissionModule } from '../../../shared/api/types';

const modules: PermissionModule[] = [
  {
    id: 'm1',
    code: 'stock',
    name: 'Stock',
    permissions: [
      { id: 'p1', code: 'stock:read', label: 'Consulter le stock' },
      { id: 'p2', code: 'stock:entry', label: 'Enregistrer une entrée' },
    ],
  },
  {
    id: 'm2',
    code: 'reports',
    name: 'Rapports',
    permissions: [
      { id: 'p3', code: 'reports:read', label: 'Consulter les rapports' },
    ],
  },
];

function renderMatrix(value: string[]) {
  const onChange = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <PermissionMatrix modules={modules} value={value} onChange={onChange} />
    </ConfigProvider>,
  );

  return { onChange };
}

const moduleBox = (name: string) =>
  screen.getByRole('checkbox', { name: new RegExp(name, 'i') });

describe('matrice des permissions', () => {
  it('compte ce qui est accordé par module', () => {
    renderMatrix(['stock:read']);

    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('coche le module entier d’un seul geste', async () => {
    const user = userEvent.setup();
    const { onChange } = renderMatrix(['stock:read']);

    await user.click(moduleBox('Stock'));

    expect(onChange).toHaveBeenCalledWith(['stock:read', 'stock:entry']);
  });

  it('décocher le module retire ses permissions et garde les autres', async () => {
    const user = userEvent.setup();
    const { onChange } = renderMatrix([
      'stock:read',
      'stock:entry',
      'reports:read',
    ]);

    await user.click(moduleBox('Stock'));

    expect(onChange).toHaveBeenCalledWith(['reports:read']);
  });

  it('montre un module partiellement accordé comme indéterminé', () => {
    renderMatrix(['stock:read']);

    expect(moduleBox('Stock')).toBePartiallyChecked();
    expect(moduleBox('Rapports')).not.toBeChecked();
  });

  it('déplie un module pour cocher ligne à ligne', async () => {
    const user = userEvent.setup();
    const { onChange } = renderMatrix([]);

    await user.click(screen.getByText('Stock'));
    await user.click(
      screen.getByRole('checkbox', { name: /enregistrer une entrée/i }),
    );

    expect(onChange).toHaveBeenCalledWith(['stock:entry']);
  });
});
