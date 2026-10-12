import type { ReactNode } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import { theme } from './theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={frFR} theme={theme}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
