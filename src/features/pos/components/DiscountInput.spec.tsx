import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { DiscountInput } from './DiscountInput';
import { CartPanel } from './CartPanel';

/**
 * Le champ est contrôlé : sans réinjecter la valeur, chaque frappe
 * repartirait de zéro et le test ne refléterait pas l'usage réel.
 */
function Banc({
  lineTotal,
  initial,
  onChange,
}: {
  lineTotal: number;
  initial: number;
  onChange: (valeur: number) => void;
}) {
  const [valeur, setValeur] = useState(initial);
  return (
    <DiscountInput
      lineTotal={lineTotal}
      value={valeur}
      onChange={(v) => {
        setValeur(v);
        onChange(v);
      }}
    />
  );
}

function renderInput(lineTotal = 185_000, value = 0) {
  const onChange = vi.fn();
  render(
    <ConfigProvider locale={frFR}>
      <Banc lineTotal={lineTotal} initial={value} onChange={onChange} />
    </ConfigProvider>,
  );
  return { onChange };
}

const champ = () => screen.getByRole('spinbutton');
const basculerEnPourcent = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByText('%'));

describe('remise d’une ligne', () => {
  it('saisit un montant en francs par défaut', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onChange } = renderInput();

    await user.clear(champ());
    await user.type(champ(), '5000');

    expect(onChange).toHaveBeenLastCalledWith(5000);
  });

  it('convertit un pourcentage en francs', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onChange } = renderInput(185_000);

    await basculerEnPourcent(user);
    await user.clear(champ());
    await user.type(champ(), '10');

    // 10 % de 185 000, et non « 10 francs ».
    expect(onChange).toHaveBeenLastCalledWith(18_500);
  });

  it('arrondit au franc entier', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onChange } = renderInput(185_000);

    await basculerEnPourcent(user);
    await user.clear(champ());
    await user.type(champ(), '7');

    // 12 950 exactement ; aucune décimale ne doit sortir (RG-16).
    const dernier = onChange.mock.calls.at(-1)?.[0] as number;
    expect(Number.isInteger(dernier)).toBe(true);
    expect(dernier).toBe(12_950);
  });

  it('affiche le pourcentage que vaut réellement la remise', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    // 18 500 sur 185 000 = 10 %
    renderInput(185_000, 18_500);

    await basculerEnPourcent(user);

    expect(champ()).toHaveValue('10.00');
  });

  it('ne laisse pas la remise dépasser le montant de la ligne', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const { onChange } = renderInput(10_000);

    await user.clear(champ());
    await user.type(champ(), '99999');

    const dernier = onChange.mock.calls.at(-1)?.[0] as number;
    expect(dernier).toBeLessThanOrEqual(10_000);
  });

  it('refuse le pourcentage sur une ligne à zéro plutôt que de diviser par zéro', () => {
    renderInput(0, 0);

    // Le mode reste en francs, et l'option est hors d'usage.
    expect(screen.getByText('%').closest('label')).toHaveClass(
      'ant-segmented-item-disabled',
    );
  });
});

describe('remise dans le panier', () => {
  it('calcule le pourcentage sur la ligne entière, pas sur le prix unitaire', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    const onDiscount = vi.fn();

    render(
      <ConfigProvider locale={frFR}>
        <CartPanel
          lines={[
            {
              variantId: 'v1',
              sku: 'MS-ORTHO-160200-25',
              label: 'Matelas Ortho Confort — 160×200',
              unitPrice: 185_000,
              quantity: 3,
              discount: 0,
              available: 10,
            },
          ]}
          subtotal={555_000}
          discount={0}
          total={555_000}
          customerLabel={null}
          onQuantity={vi.fn()}
          onDiscount={onDiscount}
          onRemove={vi.fn()}
          onPickCustomer={vi.fn()}
          onCheckout={vi.fn()}
        />
      </ConfigProvider>,
    );

    await user.click(screen.getByText('%'));
    const remise = screen.getAllByRole('spinbutton').at(-1)!;
    await user.clear(remise);
    await user.type(remise, '10');

    // 10 % de 555 000 — trois matelas — et non 10 % de 185 000.
    expect(onDiscount).toHaveBeenLastCalledWith('v1', 55_500);
  });
});
