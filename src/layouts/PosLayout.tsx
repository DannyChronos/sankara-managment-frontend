import { Outlet } from 'react-router-dom';
import { OfflineBanner } from '../shared/components';

/** Plein écran, sans menu : la caisse doit rester la plus rapide possible. */
export function PosLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
      }}
    >
      <OfflineBanner />
      <Outlet />
    </div>
  );
}
