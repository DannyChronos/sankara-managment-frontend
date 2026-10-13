import { describe, expect, it } from 'vitest';
import { formatGap, formatXof, formatDate } from './format';

const plain = (value: string) => value.replace(/\s/g, ' ');

describe('formatXof', () => {
  it('formate un entier avec séparateur de milliers et sans décimales', () => {
    expect(plain(formatXof(185000))).toBe('185 000 FCFA');
    expect(plain(formatXof(0))).toBe('0 FCFA');
    expect(plain(formatXof(1000000))).toBe('1 000 000 FCFA');
  });

  it('arrondit : le franc CFA n’a pas de centimes', () => {
    expect(plain(formatXof(1500.4))).toBe('1 500 FCFA');
  });

  it('n’affiche jamais « -0 »', () => {
    expect(plain(formatXof(-0))).toBe('0 FCFA');
    expect(plain(formatXof(-0.2))).toBe('0 FCFA');
  });
});

describe('formatGap', () => {
  it('affiche le signe d’un écart de caisse (RG-12)', () => {
    expect(plain(formatGap(-5000))).toBe('-5 000 FCFA');
    expect(plain(formatGap(5000))).toBe('+5 000 FCFA');
    expect(plain(formatGap(0))).toBe('0 FCFA');
  });
});

describe('formatDate', () => {
  it('formate en JJ/MM/AAAA sur le fuseau Africa/Porto-Novo', () => {
    expect(formatDate('2026-10-12T15:30:00Z')).toBe('12/10/2026');
  });
});
