import { InputNumber } from 'antd';

interface MoneyInputProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  autoFocus?: boolean;
  placeholder?: string;
}

/** Saisie d'un montant en FCFA : entiers seulement, séparateur de milliers. */
export function MoneyInput({
  value,
  onChange,
  disabled,
  min = 0,
  max,
  autoFocus,
  placeholder,
}: MoneyInputProps) {
  return (
    <InputNumber
      style={{ width: '100%' }}
      value={value ?? undefined}
      onChange={(next) => onChange?.(next ?? null)}
      disabled={disabled}
      min={min}
      max={max}
      autoFocus={autoFocus}
      placeholder={placeholder}
      step={100}
      precision={0}
      inputMode="numeric"
      addonAfter="FCFA"
      formatter={(raw) => `${raw ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
      parser={(display) => Number((display ?? '').replace(/\D/g, ''))}
    />
  );
}
