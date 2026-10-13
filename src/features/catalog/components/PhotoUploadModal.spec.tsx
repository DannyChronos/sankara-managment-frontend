import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { PhotoUploadModal } from './PhotoUploadModal';
import { MAX_IMAGE_BYTES } from '../labels';
import type { ProductVariantView } from '../../../shared/api/types';
import type { ProductImagePayload } from '../api';

const variant = {
  id: 'v1',
  sku: 'MS-ORTHO-140190-22',
  barcode: null,
  name: '140×190 · 22 cm',
  widthCm: 140,
  lengthCm: 190,
  thicknessCm: 22,
  densityKgM3: null,
  firmness: null,
  costPrice: null,
  isActive: true,
  prices: { POS: 250000, WEB: null },
} satisfies ProductVariantView;

// jsdom ne fabrique pas d'URL d'objet : l'aperçu en a besoin.
URL.createObjectURL = vi.fn(() => 'blob:apercu');
URL.revokeObjectURL = vi.fn();

function renderModal() {
  const onSubmit = vi.fn();

  render(
    <ConfigProvider locale={frFR}>
      <App>
        <PhotoUploadModal
          open
          pending={false}
          variants={[variant]}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />
      </App>
    </ConfigProvider>,
  );

  // La modale est rendue dans un portail, et le champ fichier d'AntD n'a
  // ni libellé ni rôle : on le prend par son type.
  const input = document.querySelector<HTMLInputElement>('input[type=file]');
  if (!input) throw new Error('champ fichier introuvable');

  return { onSubmit, input };
}

const sendButton = () => screen.getByRole('button', { name: /envoyer/i });

const png = (name = 'photo.png', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });

describe('ajout d’une photo produit', () => {
  it('n’envoie rien tant qu’aucun fichier n’est choisi', () => {
    renderModal();

    expect(sendButton()).toBeDisabled();
  });

  it('refuse un fichier qui n’est pas une image', async () => {
    const user = userEvent.setup({ delay: null });
    const { input } = renderModal();

    await user.upload(
      input,
      new File(['%PDF-'], 'facture.pdf', { type: 'application/pdf' }),
    );

    expect(screen.getByText(/JPEG, PNG, WebP ou AVIF/)).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  it('refuse une photo plus lourde que la limite du serveur', async () => {
    const user = userEvent.setup({ delay: null });
    const { input } = renderModal();

    await user.upload(input, png('enorme.png', MAX_IMAGE_BYTES + 1));

    expect(screen.getByText(/dépasse 5 Mo/)).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();
  });

  it('envoie le fichier avec son texte alternatif', async () => {
    const user = userEvent.setup({ delay: null });
    const { input, onSubmit } = renderModal();

    await user.upload(input, png());
    await user.type(
      screen.getByPlaceholderText(/trois quarts/i),
      'Vue de face',
    );
    await user.click(sendButton());

    const [payload] = onSubmit.mock.calls[0] as [ProductImagePayload];
    expect(payload.file.name).toBe('photo.png');
    expect(payload.alt).toBe('Vue de face');
  });

  it('n’envoie pas de variante quand la photo vaut pour tout le produit', async () => {
    const user = userEvent.setup({ delay: null });
    const { input, onSubmit } = renderModal();

    await user.upload(input, png());
    await user.click(sendButton());

    const [payload] = onSubmit.mock.calls[0] as [ProductImagePayload];
    expect(payload.file).toBeInstanceOf(File);
    expect(payload.variantId).toBeUndefined();
  });
});
