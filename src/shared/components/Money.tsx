import { formatXof, formatGap } from '../utils/format';

interface MoneyProps {
  value: number;
  /** Affiche le signe et colore selon le signe — écarts de caisse. */
  signed?: boolean;
  strong?: boolean;
}

/** Montant XOF : `185 000 FCFA`, sans décimales (FRONTEND.md §11). */
export function Money({ value, signed = false, strong = false }: MoneyProps) {
  const color = signed
    ? value === 0
      ? undefined
      : value > 0
        ? 'var(--sankara-success)'
        : 'var(--sankara-danger)'
    : undefined;

  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        fontWeight: strong ? 600 : undefined,
        color,
      }}
    >
      {signed ? formatGap(value) : formatXof(value)}
    </span>
  );
}
