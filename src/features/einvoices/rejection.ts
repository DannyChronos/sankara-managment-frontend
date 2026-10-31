import { rejectionReasonLabel } from '../../shared/constants/labels';

/**
 * Traduit ce qu'on sait traduire, et laisse parler la DGI pour le reste :
 * elle est mieux placée que nous pour dire pourquoi elle a refusé.
 */
export function rejectionMessage(invoice: {
  rejectionCode: string | null;
  rejectionReason: string | null;
}): string {
  const known = invoice.rejectionCode
    ? rejectionReasonLabel[invoice.rejectionCode]
    : undefined;
  return (
    known ??
    invoice.rejectionReason ??
    'La DGI a refusé cette facture sans préciser de motif.'
  );
}

/** Le motif brut de la DGI apporte-t-il quelque chose de plus ? */
export function hasRawReason(invoice: {
  rejectionCode: string | null;
  rejectionReason: string | null;
}): boolean {
  return Boolean(
    invoice.rejectionReason &&
    invoice.rejectionCode &&
    rejectionReasonLabel[invoice.rejectionCode],
  );
}
