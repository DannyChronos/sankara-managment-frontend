import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { SUPPORTED_TAX_GROUPS, taxGroupLabel } from '../constants/labels';
import type { TaxGroup } from '../api/types';

type Props = Omit<SelectProps<TaxGroup>, 'options'>;

/**
 * Groupe de taxation d'un produit. Seuls A, B et E sont proposés : ce sont
 * les seuls que la plateforme déclare prendre en charge (§B1). Un produit
 * ancien rangé dans un autre groupe garde sa valeur — elle s'affiche, elle
 * ne se propose pas.
 */
export function TaxGroupSelect({ value, ...rest }: Props) {
  const options = SUPPORTED_TAX_GROUPS.map((group) => ({
    value: group,
    label: taxGroupLabel[group],
  }));

  if (value && !SUPPORTED_TAX_GROUPS.includes(value)) {
    options.push({ value, label: taxGroupLabel[value] });
  }

  return <Select<TaxGroup> value={value} options={options} {...rest} />;
}
