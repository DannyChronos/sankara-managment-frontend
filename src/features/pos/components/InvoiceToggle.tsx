import { Checkbox, Flex, Input, Tag, Typography } from 'antd';
import { IfuInput } from '../../../shared/components';
import { buyerIfuError } from '../../../shared/utils/ifu';
import type {
  EinvoiceBuyer,
  EmecefEnv,
  InvoiceMode,
} from '../../../shared/api/types';

interface Props {
  mode: InvoiceMode;
  env: EmecefEnv;
  requested: boolean;
  buyer: EinvoiceBuyer;
  onRequestedChange: (requested: boolean) => void;
  onBuyerChange: (buyer: EinvoiceBuyer) => void;
}

/**
 * Case « Facture normalisée » et champs acheteur, sous le total (§6.2).
 *
 * En mode systématique il n'y a rien à cocher — toute vente est facturée —
 * mais le caissier peut tout de même renseigner l'acheteur si le client est
 * une entreprise qui réclame son IFU sur la facture.
 */
export function InvoiceToggle({
  mode,
  env,
  requested,
  buyer,
  onRequestedChange,
  onBuyerChange,
}: Props) {
  if (mode === 'DISABLED') return null;

  const test = env === 'TEST';
  const showFields = mode === 'ALWAYS' || requested;
  const ifuError = buyerIfuError(buyer);

  return (
    <div style={{ marginTop: 10 }}>
      {mode === 'ALWAYS' ? (
        <Flex align="center" gap={8}>
          <Tag color="processing">Facture normalisée</Tag>
          {test && <Tag color="warning">TEST</Tag>}
        </Flex>
      ) : (
        <Flex align="center" gap={8}>
          <Checkbox
            checked={requested}
            onChange={(event) => onRequestedChange(event.target.checked)}
          >
            Facture normalisée (F6)
          </Checkbox>
          {test && requested && <Tag color="warning">TEST</Tag>}
        </Flex>
      )}

      {showFields && (
        <Flex vertical gap={6} style={{ marginTop: 8 }}>
          <Input
            size="small"
            placeholder="Nom de l’acheteur (facultatif)"
            maxLength={120}
            value={buyer.name ?? ''}
            onChange={(event) =>
              onBuyerChange({ ...buyer, name: event.target.value })
            }
          />
          <IfuInput
            size="small"
            status={ifuError ? 'error' : undefined}
            value={buyer.ifu ?? ''}
            onChange={(value) => onBuyerChange({ ...buyer, ifu: value })}
          />
          {ifuError && (
            <Typography.Text type="danger" style={{ fontSize: 12 }}>
              {ifuError}
            </Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Un particulier n’a rien à remplir.
          </Typography.Text>
        </Flex>
      )}
    </div>
  );
}
