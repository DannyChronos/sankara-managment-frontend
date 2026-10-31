import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { InvoiceToggle } from './InvoiceToggle';
import type {
  EinvoiceBuyer,
  EmecefEnv,
  InvoiceMode,
} from '../../../shared/api/types';

function renderToggle({
  mode,
  env = 'TEST',
  requested = false,
  buyer = {},
}: {
  mode: InvoiceMode;
  env?: EmecefEnv;
  requested?: boolean;
  buyer?: EinvoiceBuyer;
}) {
  const onRequestedChange = vi.fn();
  const onBuyerChange = vi.fn();

  const result = render(
    <ConfigProvider locale={frFR}>
      <App>
        <InvoiceToggle
          mode={mode}
          env={env}
          requested={requested}
          buyer={buyer}
          onRequestedChange={onRequestedChange}
          onBuyerChange={onBuyerChange}
        />
      </App>
    </ConfigProvider>,
  );

  return { ...result, onRequestedChange, onBuyerChange };
}

const nameField = () => screen.getByPlaceholderText(/nom de l’acheteur/i);
const ifuField = () => screen.getByPlaceholderText('3201 9123 4567 8');

describe('case facture normalisée en caisse', () => {
  describe('facturation désactivée', () => {
    it('n’affiche rien : la caisse n’a pas à savoir que ça existe', () => {
      renderToggle({ mode: 'DISABLED' });

      expect(screen.queryByText(/facture normalisée/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(/nom de l’acheteur/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('mode systématique', () => {
    it('affiche une mention fixe, sans case à cocher', () => {
      renderToggle({ mode: 'ALWAYS' });

      expect(screen.getByText('Facture normalisée')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('ouvre tout de même les champs acheteur pour un client entreprise', () => {
      renderToggle({ mode: 'ALWAYS' });

      expect(nameField()).toBeInTheDocument();
      expect(ifuField()).toBeInTheDocument();
    });

    it('signale l’environnement de test, sans valeur fiscale', () => {
      renderToggle({ mode: 'ALWAYS', env: 'TEST' });

      expect(screen.getByText('TEST')).toBeInTheDocument();
    });

    it('ne met aucune mention TEST en production', () => {
      renderToggle({ mode: 'ALWAYS', env: 'PROD' });

      expect(screen.queryByText('TEST')).not.toBeInTheDocument();
    });
  });

  describe('mode à la demande', () => {
    it('propose la case, et rien d’autre tant qu’elle n’est pas cochée', () => {
      renderToggle({ mode: 'ON_DEMAND' });

      expect(
        screen.getByRole('checkbox', { name: /facture normalisée \(F6\)/i }),
      ).not.toBeChecked();
      expect(
        screen.queryByPlaceholderText(/nom de l’acheteur/i),
      ).not.toBeInTheDocument();
    });

    it('remonte le choix du caissier', async () => {
      const user = userEvent.setup({ delay: null });
      const { onRequestedChange } = renderToggle({ mode: 'ON_DEMAND' });

      await user.click(screen.getByRole('checkbox'));

      expect(onRequestedChange).toHaveBeenCalledWith(true);
    });

    it('ouvre les champs acheteur une fois cochée', () => {
      renderToggle({ mode: 'ON_DEMAND', requested: true });

      expect(nameField()).toBeInTheDocument();
    });
  });

  describe('saisie de l’acheteur', () => {
    it('préremplit ce que le client entreprise a déjà donné', () => {
      renderToggle({
        mode: 'ALWAYS',
        buyer: { name: 'Sonacop SA', ifu: '3201912345678' },
      });

      expect(nameField()).toHaveValue('Sonacop SA');
      // Groupé par quatre à l'écran, comme sur la carte d'IFU.
      expect(ifuField()).toHaveValue('3201 9123 4567 8');
    });

    it('remonte l’IFU sans ses espaces : coller depuis un courriel suffit', async () => {
      const user = userEvent.setup({ delay: null });
      const { onBuyerChange } = renderToggle({ mode: 'ALWAYS' });

      await user.click(ifuField());
      await user.paste('3201 9123 4567 8');

      expect(onBuyerChange).toHaveBeenLastCalledWith({
        ifu: '3201912345678',
      });
    });

    it('signale un IFU incomplet une seule fois', () => {
      renderToggle({ mode: 'ALWAYS', buyer: { ifu: '32019' } });

      expect(
        screen.getAllByText('L’IFU doit compter 13 chiffres.'),
      ).toHaveLength(1);
      // Le champ est marqué en erreur, le message ne flotte pas tout seul.
      expect(ifuField().className).toContain('status-error');
    });

    it('ne reproche rien à un particulier', () => {
      renderToggle({ mode: 'ALWAYS' });

      expect(
        screen.queryByText('L’IFU doit compter 13 chiffres.'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('Un particulier n’a rien à remplir.'),
      ).toBeInTheDocument();
    });
  });
});
