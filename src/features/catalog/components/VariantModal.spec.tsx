import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { VariantModal } from './VariantModal';

function renderModal() {
  const onCreateOne = vi.fn();
  const onGenerate = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <VariantModal
          open
          pending={false}
          onCancel={vi.fn()}
          onCreateOne={onCreateOne}
          onGenerate={onGenerate}
        />
      </App>
    </ConfigProvider>,
  );

  return { onCreateOne, onGenerate };
}

const generateButton = () => screen.getByRole('button', { name: /générer/i });

describe('ajout de variantes', () => {
  it('refuse de générer tant qu’aucune dimension n’est choisie', () => {
    renderModal();

    expect(screen.getByText(/au moins une dimension/i)).toBeInTheDocument();
    expect(generateButton()).toBeDisabled();
  });

  it('croise les dimensions cochées avec les épaisseurs saisies', async () => {
    const user = userEvent.setup({ delay: null });
    const { onGenerate } = renderModal();

    await user.click(screen.getByText('140×190'));
    await user.click(screen.getByText('160×200'));

    expect(screen.getByText(/2 dimension\(s\)/)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('18, 22, 25'), '22, 30');
    await user.click(generateButton());

    expect(onGenerate).toHaveBeenCalledWith({
      dimensions: [
        { widthCm: 140, lengthCm: 190 },
        { widthCm: 160, lengthCm: 200 },
      ],
      thicknesses: [22, 30],
    });
  });

  it('décoche une dimension cliquée deux fois', async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();

    await user.click(screen.getByText('140×190'));
    await user.click(screen.getByText('140×190'));

    expect(generateButton()).toBeDisabled();
  });

  it('ignore les épaisseurs qui ne sont pas des entiers positifs', async () => {
    const user = userEvent.setup({ delay: null });
    const { onGenerate } = renderModal();

    await user.click(screen.getByText('90×190'));
    await user.type(
      screen.getByPlaceholderText('18, 22, 25'),
      '18; abc, -5 25',
    );
    await user.click(generateButton());

    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ thicknesses: [18, 25] }),
    );
  });

  it('exige au moins une épaisseur', async () => {
    const user = userEvent.setup({ delay: null });
    const { onGenerate } = renderModal();

    await user.click(screen.getByText('90×190'));
    await user.click(generateButton());

    expect(
      await screen.findByText(/au moins une épaisseur/i),
    ).toBeInTheDocument();
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('crée une variante seule sans passer par la série', async () => {
    const user = userEvent.setup({ delay: null });
    const { onCreateOne } = renderModal();

    await user.click(screen.getByText('Une seule'));

    const [width, length, thickness] = screen.getAllByRole('spinbutton');
    await user.type(width, '200');
    await user.type(length, '200');
    await user.type(thickness, '35');
    await user.click(screen.getByRole('button', { name: /^ajouter$/i }));

    expect(onCreateOne).toHaveBeenCalledWith(
      expect.objectContaining({ widthCm: 200, lengthCm: 200, thicknessCm: 35 }),
    );
  });
});
