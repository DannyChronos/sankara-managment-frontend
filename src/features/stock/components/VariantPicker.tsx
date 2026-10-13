import { useState } from 'react';
import { Select, Space, Tag } from 'antd';
import { useVariantPicker } from '../hooks';
import type { VariantSearchResult } from '../../../shared/api/types';

interface Props {
  /** Variantes déjà dans le bon : on ne les propose pas deux fois. */
  exclude: string[];
  onPick: (variant: VariantSearchResult) => void;
}

/**
 * Recherche par nom, SKU ou code-barres, avec le disponible du site courant
 * affiché : c'est ce chiffre qui dit si une sortie va passer.
 */
export function VariantPicker({ exclude, onPick }: Props) {
  const [term, setTerm] = useState('');
  const picker = useVariantPicker(term);
  const results = (picker.data ?? []).filter(
    (variant) => !exclude.includes(variant.id),
  );

  return (
    <Select
      showSearch
      value={null}
      style={{ width: '100%', maxWidth: 520 }}
      placeholder="Ajouter un article : nom, SKU ou code-barres"
      filterOption={false}
      searchValue={term}
      onSearch={setTerm}
      loading={picker.isFetching}
      notFoundContent={
        term.trim().length < 2
          ? 'Tapez au moins 2 caractères'
          : picker.isFetching
            ? 'Recherche…'
            : 'Aucun article'
      }
      onChange={(id: string) => {
        const variant = results.find((item) => item.id === id);
        if (variant) {
          onPick(variant);
          setTerm('');
        }
      }}
      options={results.map((variant) => ({
        value: variant.id,
        label: (
          <Space>
            <span>
              {variant.productName} — {variant.name}
            </span>
            <Tag>{variant.sku}</Tag>
            <Tag color={variant.available > 0 ? 'success' : 'error'}>
              dispo {variant.available}
            </Tag>
          </Space>
        ),
      }))}
    />
  );
}
