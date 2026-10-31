import { Input } from 'antd';
import type { InputProps } from 'antd';
import { cleanIfu, formatIfu } from '../utils/ifu';

interface Props extends Omit<InputProps, 'value' | 'onChange'> {
  value?: string;
  /** Reçoit toujours les 13 chiffres sans espace, jamais l'affichage. */
  onChange?: (value: string) => void;
}

/**
 * Saisie d'un IFU (identifiant fiscal unique, 13 chiffres au Bénin).
 *
 * L'affichage est groupé par quatre pour que l'œil puisse le comparer à la
 * carte d'IFU du client ; la valeur conservée, elle, reste la suite de
 * chiffres. Coller « 3201 9123 4567 8 » depuis un courriel fonctionne donc
 * sans que personne ait à retirer les espaces.
 */
export function IfuInput({ value = '', onChange, ...rest }: Props) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      placeholder="3201 9123 4567 8"
      // 13 chiffres + 3 espaces de groupement.
      maxLength={16}
      {...rest}
      value={formatIfu(value)}
      onChange={(event) => onChange?.(cleanIfu(event.target.value))}
    />
  );
}
