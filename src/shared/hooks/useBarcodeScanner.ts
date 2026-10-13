import { useEffect, useRef } from 'react';

/**
 * Une douchette se comporte comme un clavier très rapide qui termine par
 * Entrée. On distingue le scan de la frappe humaine au délai entre touches :
 * sous 35 ms, c'est une machine.
 */
export function useBarcodeScanner(onScan: (code: string) => void): void {
  const buffer = useRef('');
  const lastKeyAt = useRef(0);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const now = Date.now();
      const elapsed = now - lastKeyAt.current;
      lastKeyAt.current = now;

      if (elapsed > 120) buffer.current = '';

      if (event.key === 'Enter') {
        const code = buffer.current.trim();
        buffer.current = '';
        // Au moins 4 caractères saisis à la vitesse d'une douchette.
        if (code.length >= 4 && elapsed < 120) {
          event.preventDefault();
          onScan(code);
        }
        return;
      }

      if (event.key.length === 1) buffer.current += event.key;
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onScan]);
}
