import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { errorMessage, fieldErrors, toApiError } from './errors';

function apiError(
  code: string,
  message: string,
  status = 409,
  details?: Record<string, unknown>,
  requestId = 'req-1',
) {
  const headers = new AxiosHeaders();
  return new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    { headers },
    {},
    {
      status,
      statusText: '',
      headers,
      config: { headers },
      data: { success: false, error: { code, message, details }, requestId },
    },
  );
}

describe('traduction des erreurs de l’API', () => {
  it('garde le message du serveur quand il est circonstancié', () => {
    const error = apiError(
      'CONFLICT',
      'Ce numéro est déjà celui de Afi Kodjo.',
    );

    expect(errorMessage(error)).toBe('Ce numéro est déjà celui de Afi Kodjo.');
  });

  it('préfère le libellé local quand le serveur reste générique', () => {
    const error = apiError('CONFLICT', 'Cette ressource existe déjà.');

    expect(errorMessage(error)).toBe('Cette valeur existe déjà.');
  });

  it('interpole les détails dans le libellé local', () => {
    const error = apiError(
      'STOCK_INSUFFICIENT',
      'Stock insuffisant sur ce site.',
      409,
      { available: 2 },
    );

    expect(errorMessage(error)).toBe(
      'Stock insuffisant : il reste 2 article(s) sur ce site.',
    );
  });

  it('ajoute la référence de la requête sur une erreur serveur', () => {
    const error = apiError(
      'INTERNAL_ERROR',
      'Une erreur interne est survenue.',
      500,
    );

    expect(errorMessage(error)).toContain('(référence : req-1)');
  });

  it('nomme l’API injoignable plutôt qu’une erreur générique', () => {
    const headers = new AxiosHeaders();
    const offline = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      { headers },
      {},
    );

    const converted = toApiError(offline);
    expect(converted.code).toBe('NETWORK_ERROR');
    expect(converted.message).toMatch(/Serveur injoignable/);
  });

  it('expose les erreurs champ par champ', () => {
    const error = apiError(
      'VALIDATION_FAILED',
      'Les données envoyées sont invalides.',
      400,
      {
        fields: { phone: ['Numéro de téléphone invalide.'] },
      },
    );

    expect(fieldErrors(error)).toEqual({
      phone: ['Numéro de téléphone invalide.'],
    });
  });
});
