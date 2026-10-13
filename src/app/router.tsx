import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { AppLayout } from '../layouts/AppLayout';
import { PosLayout } from '../layouts/PosLayout';
import { RequireAuth } from '../shared/auth/RequireAuth';
import { RequirePermission } from '../shared/auth/RequirePermission';
import { FullPageSpinner } from './FullPageSpinner';
import { HomeRedirect } from './HomeRedirect';
import { NotFoundPage } from './NotFoundPage';

/**
 * Arbre des routes. Chaque module métier apportera son propre fichier
 * `routes.tsx` chargé en `lazy` (FRONTEND.md §7) ; le POS reste un bundle
 * séparé pour rester léger sur une connexion 3G.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    hydrateFallbackElement: <FullPageSpinner />,
    children: [
      {
        path: '/login',
        lazy: async () => {
          const { LoginPage } =
            await import('../features/auth/pages/LoginPage');
          return { Component: LoginPage };
        },
      },
    ],
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    hydrateFallbackElement: <FullPageSpinner />,
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        path: 'dashboard',
        lazy: async () => {
          const { DashboardPage } =
            await import('../features/dashboard/pages/DashboardPage');
          return {
            Component: () => (
              <RequirePermission perm="reports:read">
                <DashboardPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'cash-sessions/me',
        lazy: async () => {
          const { MySessionPage } =
            await import('../features/cash-sessions/pages/MySessionPage');
          return {
            Component: () => (
              <RequirePermission perm="cash-sessions:open">
                <MySessionPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'cash-sessions/to-verify',
        lazy: async () => {
          const { SessionsToVerifyPage } =
            await import('../features/cash-sessions/pages/SessionsToVerifyPage');
          return {
            Component: () => (
              <RequirePermission perm="cash-sessions:verify">
                <SessionsToVerifyPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'cash-sessions/:id/close',
        lazy: async () => {
          const { CloseSessionPage } =
            await import('../features/cash-sessions/pages/CloseSessionPage');
          return {
            Component: () => (
              <RequirePermission perm="cash-sessions:close">
                <CloseSessionPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'cash-sessions/:id/verify',
        lazy: async () => {
          const { VerifySessionPage } =
            await import('../features/cash-sessions/pages/VerifySessionPage');
          return {
            Component: () => (
              <RequirePermission perm="cash-sessions:verify">
                <VerifySessionPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'catalog/products',
        lazy: async () => {
          const { ProductsPage } =
            await import('../features/catalog/pages/ProductsPage');
          return {
            Component: () => (
              <RequirePermission perm="catalog:read">
                <ProductsPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'catalog/products/:id',
        lazy: async () => {
          const { ProductDetailPage } =
            await import('../features/catalog/pages/ProductDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="catalog:read">
                <ProductDetailPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'audit',
        lazy: async () => {
          const { AuditLogPage } =
            await import('../features/audit/pages/AuditLogPage');
          return {
            Component: () => (
              <RequirePermission perm="audit:read">
                <AuditLogPage />
              </RequirePermission>
            ),
          };
        },
      },
      // ...stockRoutes, ...transferRoutes, ...inventoryRoutes,
      // ...cashSessionRoutes, ...salesRoutes, ...customerRoutes, ...orderRoutes,
      // ...reportRoutes, ...adminRoutes
    ],
  },
  {
    path: '/pos',
    hydrateFallbackElement: <FullPageSpinner />,
    element: (
      <RequireAuth>
        <RequirePermission perm="sales:create">
          <PosLayout />
        </RequirePermission>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        lazy: async () => {
          const { PosPage } = await import('../features/pos/pages/PosPage');
          return { Component: PosPage };
        },
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
