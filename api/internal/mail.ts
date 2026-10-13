import { createHmac, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';

/**
 * Relais SMTP pour l'API, hébergée sur Railway.
 *
 * Railway ferme les ports 25, 465 et 587 en sortie en dessous du plan Pro :
 * l'envoi part et meurt en « Connection timeout ». Vercel, lui, ne bloque
 * que le port 25 et laisse 465 et 587 ouverts sur le runtime Node. L'API
 * garde donc la file d'attente et les reprises, et confie le dernier mètre
 * à cette route, qu'elle joint en HTTPS.
 *
 * Cette route envoie un email à l'adresse qu'on lui donne : sans signature
 * valable, c'est un relais ouvert, et du spam partirait depuis le compte
 * d'envoi du projet jusqu'à ce qu'il soit suspendu. Rien ne s'exécute avant
 * que la signature soit vérifiée.
 */

/** Fenêtre de rejeu. Les deux horloges sont celles de Railway et de Vercel,
 *  pas la même machine : trop court, un décalage casse l'envoi. */
const FENETRE_MS = 5 * 60 * 1000;

const MAX_SUJET = 300;
const MAX_HTML = 200_000;
const MAX_TEXTE = 100_000;

interface CorpsMail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Validation sans dépendance : quatre champs, quatre règles. */
function corpsValide(valeur: unknown): valeur is CorpsMail {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const c = valeur as Record<string, unknown>;

  return (
    typeof c.to === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.to) &&
    typeof c.subject === 'string' &&
    c.subject.length > 0 &&
    c.subject.length <= MAX_SUJET &&
    typeof c.html === 'string' &&
    c.html.length > 0 &&
    c.html.length <= MAX_HTML &&
    typeof c.text === 'string' &&
    c.text.length > 0 &&
    c.text.length <= MAX_TEXTE
  );
}

function signatureValide(
  brut: string,
  horodatage: string,
  recue: string,
  secret: string,
): boolean {
  const attendue = createHmac('sha256', secret)
    .update(`${horodatage}.${brut}`)
    .digest('hex');

  // `timingSafeEqual` exige deux tampons de même longueur et lève sinon :
  // comparer les longueurs d'abord, sans quoi une signature tronquée rend
  // un 500 au lieu d'un 401.
  const a = Buffer.from(attendue, 'utf8');
  const b = Buffer.from(recue, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function json(corps: unknown, status: number): Response {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.MAIL_RELAY_SECRET;
  if (!secret) {
    // Sans secret, tout envoi serait non authentifié : on refuse plutôt que
    // d'ouvrir le relais.
    return json({ message: 'Relais non configuré.' }, 503);
  }

  const horodatage = request.headers.get('x-sankara-timestamp');
  const signature = request.headers.get('x-sankara-signature');
  if (!horodatage || !signature) {
    return json({ message: 'Signature absente.' }, 401);
  }

  const age = Date.now() - Number(horodatage);
  if (!Number.isFinite(age) || Math.abs(age) > FENETRE_MS) {
    return json({ message: 'Horodatage hors fenêtre.' }, 401);
  }

  // Le corps brut, pas l'objet analysé : la signature porte sur ces octets.
  const brut = await request.text();
  if (!signatureValide(brut, horodatage, signature, secret)) {
    return json({ message: 'Signature invalide.' }, 401);
  }

  let analyse: unknown;
  try {
    analyse = JSON.parse(brut);
  } catch {
    return json({ message: 'Corps illisible.' }, 400);
  }
  if (!corpsValide(analyse)) {
    return json({ message: 'Corps invalide.' }, 400);
  }

  const port = Number(process.env.SMTP_PORT ?? process.env.EMAIL_PORT ?? 587);
  const user = process.env.SMTP_USER ?? process.env.EMAIL_USER;
  // Google affiche ses mots de passe d'application par groupes de quatre ;
  // recopiés tels quels, les espaces font échouer l'authentification.
  const pass = (
    process.env.SMTP_PASS ??
    process.env.EMAIL_PASSWORD ??
    ''
  ).replace(/\s+/g, '');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? process.env.EMAIL_HOST,
    port,
    // 465 est le TLS implicite ; 587 démarre en clair puis bascule.
    secure: port === 465,
    // Bornés sous `maxDuration` : une poignée de main qui n'aboutit pas doit
    // rendre la main avant que Vercel ne tranche, sinon l'API reçoit un 504
    // sans cause lisible.
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });

  try {
    // L'envoi est attendu, jamais laissé en tâche de fond : une fois la
    // réponse partie, Vercel suspend le travail restant, et un échange SMTP
    // en cours s'arrêterait au milieu.
    await transporter.sendMail({
      from:
        process.env.MAIL_FROM ??
        process.env.EMAIL_FROM ??
        'Matelas Sankara <no-reply@matelas-sankara.bj>',
      to: analyse.to,
      subject: analyse.subject,
      html: analyse.html,
      text: analyse.text,
    });
  } catch (erreur) {
    // 502 et non 500 : la panne est chez le fournisseur SMTP, et l'API doit
    // reprendre le travail.
    return json(
      { message: `Envoi SMTP refusé : ${(erreur as Error).message}` },
      502,
    );
  }

  return json({ sent: true }, 200);
}
