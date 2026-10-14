import { useState } from 'react';
import { InputNumber, Segmented } from 'antd';

interface Props {
  /** Montant de la ligne avant remise : prix unitaire × quantité. */
  lineTotal: number;
  /** Remise en francs — la seule valeur conservée. */
  value: number;
  onChange: (discount: number) => void;
}

/**
 * Remise d'une ligne, saisissable en francs ou en pourcentage.
 *
 * Le plafond autorisé est un pourcentage (RG-08) et le serveur arbitre en
 * pourcentage : demander au caissier de calculer 10 % de trois matelas au
 * comptoir, de tête, est une source d'erreur inutile.
 *
 * Seul le montant est conservé. RG-07 fige le prix dans la ligne au moment
 * de la vente ; la remise doit y être un montant définitif, sinon le ticket,
 * les retours et la comptabilité reposeraient sur un calcul à rejouer. Un
 * remboursement partiel d'une ligne remisée en pourcentage rouvrirait
 * l'arrondi, et en francs CFA — sans décimale — ces écarts finissent dans
 * les écarts de caisse.
 *
 * Le pourcentage affiché est donc toujours celui que vaut réellement la
 * remise : si la quantité change après coup, il se recalcule plutôt que de
 * mentir sur une intention passée.
 */
export function DiscountInput({ lineTotal, value, onChange }: Props) {
  const [mode, setMode] = useState<'F' | '%'>('F');

  // Un article offert ne se remise pas d'un pourcentage : on ne divise pas
  // par zéro, et le mode est sans objet.
  const pourcentagePossible = lineTotal > 0;
  const enPourcent = mode === '%' && pourcentagePossible;

  const pourcentage = pourcentagePossible
    ? Math.round((value / lineTotal) * 10_000) / 100
    : 0;

  return (
    <>
      <Segmented
        size="small"
        value={pourcentagePossible ? mode : 'F'}
        onChange={(valeur) => setMode(valeur as 'F' | '%')}
        options={[
          { value: 'F', label: 'F' },
          { value: '%', label: '%', disabled: !pourcentagePossible },
        ]}
      />
      <InputNumber
        size="small"
        min={0}
        max={enPourcent ? 100 : lineTotal}
        // Deux décimales en pourcentage : 1 % de 185 000 ne tombe pas rond.
        precision={enPourcent ? 2 : 0}
        style={{ width: 110 }}
        value={enPourcent ? pourcentage : value}
        onChange={(saisi) => {
          const nombre = saisi ?? 0;
          if (!enPourcent) {
            onChange(Math.min(Math.max(0, nombre), lineTotal));
            return;
          }
          // La remise reste un entier de francs (RG-16).
          const borne = Math.min(Math.max(0, nombre), 100);
          onChange(Math.round((lineTotal * borne) / 100));
        }}
        addonAfter={enPourcent ? '%' : 'F'}
      />
    </>
  );
}
