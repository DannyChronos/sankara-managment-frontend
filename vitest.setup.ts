import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * jsdom ne fournit ni `matchMedia` ni `ResizeObserver` ; Ant Design s'appuie
 * sur les deux pour ses points de rupture et ses composants redimensionnables.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverStub,
});
