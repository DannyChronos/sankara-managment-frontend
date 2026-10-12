import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useRestoreSession } from '../features/auth/hooks';

export function App() {
  useRestoreSession();
  return <RouterProvider router={router} />;
}
