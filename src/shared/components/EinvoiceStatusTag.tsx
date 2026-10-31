import { Spin, Tag, Tooltip } from 'antd';
import {
  einvoiceStatusColor,
  einvoiceStatusLabel,
  normalizedInvoiceStatusColor,
  normalizedInvoiceStatusLabel,
} from '../constants/labels';
import type { EinvoiceStatus, NormalizedInvoiceStatus } from '../api/types';

interface Props {
  status: EinvoiceStatus;
  /** Mentionne que la facture n'a aucune valeur fiscale (environnement TEST). */
  test?: boolean;
  /** Infobulle : motif du rejet, heure d'envoi… */
  hint?: string | null;
}

/**
 * Statut de facture d'une vente. « En cours » porte un indicateur animé :
 * au comptoir, c'est le signe qu'il ne faut pas encore donner le ticket au
 * client comme s'il s'agissait d'une facture.
 */
export function EinvoiceStatusTag({ status, test, hint }: Props) {
  const tag = (
    <Tag color={einvoiceStatusColor[status]}>
      {status === 'PENDING' && <Spin size="small" style={{ marginRight: 6 }} />}
      {einvoiceStatusLabel[status]}
      {test && status !== 'NOT_REQUESTED' ? ' · TEST' : ''}
    </Tag>
  );

  return hint ? <Tooltip title={hint}>{tag}</Tooltip> : tag;
}

/** Statut de la facture elle-même, au journal (§8.1). */
export function NormalizedInvoiceStatusTag({
  status,
  hint,
}: {
  status: NormalizedInvoiceStatus;
  hint?: string | null;
}) {
  const tag = (
    <Tag color={normalizedInvoiceStatusColor[status]}>
      {status === 'SUBMITTED' && (
        <Spin size="small" style={{ marginRight: 6 }} />
      )}
      {normalizedInvoiceStatusLabel[status]}
    </Tag>
  );

  return hint ? <Tooltip title={hint}>{tag}</Tooltip> : tag;
}
