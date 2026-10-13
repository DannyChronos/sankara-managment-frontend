import { Money } from '../../../shared/components';

/** Vert si l'écart est nul, rouge sinon (FRONTEND.md §10.4). */
export function GapCell({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: '#8a98a8' }}>—</span>;
  return <Money value={value} signed strong={value !== 0} />;
}
