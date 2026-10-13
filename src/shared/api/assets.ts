/**
 * Les fichiers servis par l'API (photos produits) portent un chemin relatif
 * à l'API — `/uploads/products/…` — et non au front. En développement les
 * deux ne sont pas sur le même port : sans cette résolution, les images
 * pointeraient sur le serveur Vite et ne chargeraient pas.
 */
function apiOrigin(): string {
  const base = import.meta.env.VITE_API_URL ?? '';
  // Une base relative (`/api/v1` derrière un reverse proxy) partage déjà
  // l'origine de la page.
  return new URL(base, window.location.origin).origin;
}

export function fileUrl(path: string): string;
export function fileUrl(path: string | null | undefined): string | undefined;
export function fileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return new URL(path, apiOrigin()).toString();
}
