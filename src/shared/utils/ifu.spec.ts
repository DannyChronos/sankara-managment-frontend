import { describe, expect, it } from 'vitest';
import {
  buyerIfuError,
  cleanIfu,
  formatIfu,
  isValidIfu,
  optionalIfuRule,
  requiredIfuRule,
} from './ifu';

describe('IFU', () => {
  it('groupe l’affichage par quatre, comme sur la carte d’IFU', () => {
    expect(formatIfu('3201912345678')).toBe('3201 9123 4567 8');
    expect(formatIfu('')).toBe('');
  });

  it('ne garde que les chiffres : coller depuis un courriel suffit', () => {
    expect(cleanIfu('3201 9123 4567 8')).toBe('3201912345678');
    expect(cleanIfu('IFU : 3201-9123-4567-8')).toBe('3201912345678');
    expect(cleanIfu('abc')).toBe('');
  });

  it('tronque au-delà de treize chiffres plutôt que d’accepter n’importe quoi', () => {
    expect(cleanIfu('32019123456789999')).toBe('3201912345678');
  });

  it('n’accepte que treize chiffres exactement', () => {
    expect(isValidIfu('3201912345678')).toBe(true);
    expect(isValidIfu('32019')).toBe(false);
    expect(isValidIfu('320191234567')).toBe(false);
    expect(isValidIfu('32019123456789')).toBe(false);
    expect(isValidIfu('3201 9123 4567 8')).toBe(false);
  });

  describe('acheteur d’une facture', () => {
    it('ne reproche rien à un particulier sans IFU', () => {
      expect(buyerIfuError({})).toBeNull();
      expect(buyerIfuError({ name: 'Afi Kodjo' })).toBeNull();
    });

    it('refuse un IFU mal formé : la DGI rejetterait la facture', () => {
      expect(buyerIfuError({ ifu: '32019' })).toBe(
        'L’IFU doit compter 13 chiffres.',
      );
    });

    it('accepte un IFU valide, espaces compris', () => {
      expect(buyerIfuError({ ifu: '3201 9123 4567 8' })).toBeNull();
    });
  });

  describe('règles de formulaire', () => {
    it('facultatif : vide passe, mal formé non', async () => {
      await expect(
        optionalIfuRule.validator(null, undefined),
      ).resolves.toBeUndefined();
      await expect(
        optionalIfuRule.validator(null, ''),
      ).resolves.toBeUndefined();
      await expect(optionalIfuRule.validator(null, '32019')).rejects.toThrow(
        /13 chiffres/,
      );
    });

    it('obligatoire : vide ne passe pas', async () => {
      await expect(requiredIfuRule.validator(null, '')).rejects.toThrow(
        /13 chiffres/,
      );
      await expect(
        requiredIfuRule.validator(null, '3201912345678'),
      ).resolves.toBeUndefined();
    });
  });
});
