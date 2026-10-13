import axios from 'axios';
import type { ApiErrorBody } from './types';

/** Erreur normalisée : tout le code applicatif ne manipule que celle-ci. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: Record<string, unknown>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Messages affichés à l'utilisateur, par code d'erreur du backend
 * (FRONTEND.md §12). Les `{jeton}` sont remplacés par les `details`.
 */
const messages: Record<string, string> = {
  VALIDATION_FAILED: 'Certaines informations saisies sont invalides.',
  UNAUTHENTICATED: 'Veuillez vous reconnecter.',
  TOKEN_EXPIRED: 'Votre session a expiré, reconnectez-vous.',
  FORBIDDEN: "Vous n'avez pas la permission d'effectuer cette action.",
  SITE_ACCESS_DENIED: "Vous n'avez pas accès à ce site.",
  NOT_FOUND: 'Cet élément est introuvable.',
  CONFLICT: 'Cette valeur existe déjà.',
  STOCK_INSUFFICIENT:
    'Stock insuffisant : il reste {available} article(s) sur ce site.',
  NO_OPEN_SESSION: 'Ouvrez votre caisse avant d’enregistrer une vente.',
  SESSION_ALREADY_OPEN: 'Une session de caisse est déjà ouverte.',
  SESSION_LOCKED:
    'Cette session est clôturée : aucune modification n’est possible.',
  SELF_VERIFICATION_FORBIDDEN:
    'Vous ne pouvez pas vérifier votre propre session.',
  GAP_COMMENT_REQUIRED: 'Un commentaire est obligatoire en cas d’écart.',
  PAYMENT_TOTAL_MISMATCH:
    'Le total des paiements ne correspond pas au montant à payer.',
  DISCOUNT_APPROVAL_REQUIRED:
    'Cette remise dépasse votre plafond : demandez l’accord d’un administrateur.',
  PAYMENT_REFERENCE_REQUIRED:
    'Indiquez la référence de la transaction pour ce mode de paiement.',
  IDEMPOTENCY_CONFLICT: 'Cette opération a déjà été enregistrée.',
  INVALID_STATE_TRANSITION: 'Cette action n’est pas possible à ce stade.',
  RATE_LIMITED: 'Trop de tentatives. Patientez un instant.',
  INTERNAL_ERROR: 'Une erreur est survenue. Réessayez dans un instant.',
};

/**
 * Messages génériques du backend (`errorMessages`, BACKEND.md §11). Quand le
 * serveur renvoie l'un d'eux, il n'a rien de plus à dire que le code : la
 * version ci-dessus, plus parlante et interpolée, est préférable. Dès qu'il
 * renvoie autre chose — « Ce numéro est déjà celui de Afi Kodjo. », « Ce bon
 * est déjà validé » — c'est lui qui connaît le détail, et son message gagne.
 */
const genericServerMessages = new Set([
  'Les données envoyées sont invalides.',
  'Authentification requise.',
  'Votre session a expiré.',
  "Vous n'avez pas la permission d'effectuer cette action.",
  "Vous n'avez pas accès à ce site.",
  'Ressource introuvable.',
  'Cette ressource existe déjà.',
  'Stock insuffisant sur ce site.',
  "Ouvrez votre caisse avant d'enregistrer une vente.",
  'Une session de caisse est déjà ouverte.',
  'Cette session est clôturée : aucune modification n’est possible.',
  'Vous ne pouvez pas vérifier votre propre session.',
  'Un commentaire est obligatoire en cas d’écart.',
  'Le total des paiements ne correspond pas au montant à payer.',
  'Cette remise dépasse votre plafond : demandez l’accord d’un administrateur.',
  'Une référence de transaction est obligatoire pour ce mode de paiement.',
  'L’en-tête Idempotency-Key est obligatoire sur cette requête.',
  'Cette clé d’idempotence a déjà été utilisée avec un contenu différent.',
  'Cette transition de statut n’est pas autorisée.',
  'Trop de requêtes. Réessayez dans un instant.',
  'Une erreur interne est survenue.',
]);

function interpolate(
  template: string,
  details?: Record<string, unknown>,
): string {
  if (!details) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = details[key];
    if (value === null || value === undefined) return match;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value) ?? match;
  });
}

/** Transforme n'importe quelle erreur axios en `ApiError` affichable. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const status = error.response?.status ?? 0;

    if (body && body.success === false) {
      const serverMessage = body.error.message;
      const template =
        serverMessage && !genericServerMessages.has(serverMessage)
          ? serverMessage
          : (messages[body.error.code] ?? serverMessage);

      return new ApiError(
        body.error.code,
        interpolate(template, body.error.details),
        status,
        body.error.details,
        body.requestId,
      );
    }

    if (!error.response) {
      // Aucune réponse du tout : réseau coupé, ou API injoignable. En
      // développement, nommer l'adresse appelée évite de chercher longtemps.
      const target = import.meta.env.DEV
        ? ` (${import.meta.env.VITE_API_URL})`
        : '';
      return new ApiError(
        'NETWORK_ERROR',
        `Serveur injoignable${target}. Vérifiez votre connexion.`,
        0,
      );
    }

    return new ApiError('INTERNAL_ERROR', messages.INTERNAL_ERROR, status);
  }

  return new ApiError(
    'INTERNAL_ERROR',
    error instanceof Error ? error.message : messages.INTERNAL_ERROR,
    0,
  );
}

/**
 * Message complet affiché à l'utilisateur. Sur une 5xx, le `requestId` est
 * ajouté : c'est ce que le support demandera.
 */
export function errorMessage(error: unknown): string {
  const apiError = toApiError(error);
  return apiError.status >= 500 && apiError.requestId
    ? `${apiError.message} (référence : ${apiError.requestId})`
    : apiError.message;
}

/** Erreurs de validation renvoyées champ par champ par le backend. */
export function fieldErrors(error: unknown): Record<string, string[]> {
  const apiError = toApiError(error);
  const fields = apiError.details?.fields;
  return typeof fields === 'object' && fields !== null
    ? (fields as Record<string, string[]>)
    : {};
}
