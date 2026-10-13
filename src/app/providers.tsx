import type { ReactNode } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import frFRLocale from 'antd/locale/fr_FR';
import type { Locale } from 'antd/es/locale';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import { theme } from './theme';

/**
 * `antd/locale/fr_FR` est publié en CommonJS : selon l'interopérabilité, l'import
 * rend soit la locale, soit un module qui l'enveloppe. Sans ce déballage, Ant
 * Design retombe silencieusement sur l'anglais — « Start date » au milieu d'une
 * interface française.
 */
const frFR =
  (frFRLocale as Locale & { default?: Locale }).default ?? frFRLocale;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={frFR} theme={theme}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
