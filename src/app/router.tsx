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
      {
        path: '/forgot-password',
        lazy: async () => {
          const { ForgotPasswordPage } =
            await import('../features/auth/pages/ForgotPasswordPage');
          return { Component: ForgotPasswordPage };
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
        path: 'cash-sessions',
        lazy: async () => {
          const { SessionsPage } =
            await import('../features/cash-sessions/pages/SessionsPage');
          return {
            Component: () => (
              <RequirePermission perm="cash-sessions:open">
                <SessionsPage />
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
        path: 'cash-sessions/:id',
        lazy: async () => {
          const { SessionDetailPage } =
            await import('../features/cash-sessions/pages/SessionDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="cash-sessions:open">
                <SessionDetailPage />
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
        path: 'catalog/categories',
        lazy: async () => {
          const { CategoriesPage } =
            await import('../features/catalog/pages/CategoriesPage');
          return {
            Component: () => (
              <RequirePermission perm="catalog:read">
                <CategoriesPage />
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
      {
        path: 'stock',
        lazy: async () => {
          const { StockLevelsPage } =
            await import('../features/stock/pages/StockLevelsPage');
          return {
            Component: () => (
              <RequirePermission perm="stock:read">
                <StockLevelsPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'stock/movements',
        lazy: async () => {
          const { StockMovementsPage } =
            await import('../features/stock/pages/StockMovementsPage');
          return {
            Component: () => (
              <RequirePermission perm="stock:read">
                <StockMovementsPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'stock/operations',
        lazy: async () => {
          const { StockOperationsPage } =
            await import('../features/stock/pages/StockOperationsPage');
          return {
            Component: () => (
              <RequirePermission perm="stock:read">
                <StockOperationsPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'stock/operations/new',
        lazy: async () => {
          const { NewStockOperationPage } =
            await import('../features/stock/pages/NewStockOperationPage');
          return {
            Component: () => (
              <RequirePermission perm="stock:entry">
                <NewStockOperationPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'stock/operations/:id',
        lazy: async () => {
          const { StockOperationDetailPage } =
            await import('../features/stock/pages/StockOperationDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="stock:read">
                <StockOperationDetailPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'transfers',
        lazy: async () => {
          const { TransfersPage } =
            await import('../features/transfers/pages/TransfersPage');
          return {
            Component: () => (
              <RequirePermission perm="transfers:read">
                <TransfersPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'transfers/new',
        lazy: async () => {
          const { NewTransferPage } =
            await import('../features/transfers/pages/NewTransferPage');
          return {
            Component: () => (
              <RequirePermission perm="transfers:ship">
                <NewTransferPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'transfers/:id',
        lazy: async () => {
          const { TransferDetailPage } =
            await import('../features/transfers/pages/TransferDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="transfers:read">
                <TransferDetailPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'inventories',
        lazy: async () => {
          const { InventoriesPage } =
            await import('../features/inventories/pages/InventoriesPage');
          return {
            Component: () => (
              <RequirePermission perm="inventories:read">
                <InventoriesPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'inventories/:id',
        lazy: async () => {
          const { InventoryDetailPage } =
            await import('../features/inventories/pages/InventoryDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="inventories:read">
                <InventoryDetailPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'sales',
        lazy: async () => {
          const { SalesPage } =
            await import('../features/sales/pages/SalesPage');
          return {
            Component: () => (
              <RequirePermission perm="sales:read">
                <SalesPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'sales/:id',
        lazy: async () => {
          const { SaleDetailPage } =
            await import('../features/sales/pages/SaleDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="sales:read">
                <SaleDetailPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'suppliers',
        lazy: async () => {
          const { SuppliersPage } =
            await import('../features/suppliers/pages/SuppliersPage');
          return {
            Component: () => (
              <RequirePermission perm="stock:entry">
                <SuppliersPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'suppliers/:id',
        lazy: async () => {
          const { SupplierDetailPage } =
            await import('../features/suppliers/pages/SupplierDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="stock:entry">
                <SupplierDetailPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'customers',
        lazy: async () => {
          const { CustomersPage } =
            await import('../features/customers/pages/CustomersPage');
          return {
            Component: () => (
              <RequirePermission perm="customers:read">
                <CustomersPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'customers/:id',
        lazy: async () => {
          const { CustomerDetailPage } =
            await import('../features/customers/pages/CustomerDetailPage');
          return {
            Component: () => (
              <RequirePermission perm="customers:read">
                <CustomerDetailPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'reports',
        lazy: async () => {
          const { ReportsPage } =
            await import('../features/reports/pages/ReportsPage');
          return {
            Component: () => (
              <RequirePermission perm="reports:read">
                <ReportsPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'users',
        lazy: async () => {
          const { UsersPage } =
            await import('../features/users/pages/UsersPage');
          return {
            Component: () => (
              <RequirePermission perm="users:read">
                <UsersPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'rbac/roles',
        lazy: async () => {
          const { RolesPage } =
            await import('../features/rbac/pages/RolesPage');
          return {
            Component: () => (
              <RequirePermission perm="rbac:read">
                <RolesPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'sites',
        lazy: async () => {
          const { SitesPage } =
            await import('../features/sites/pages/SitesPage');
          return {
            Component: () => (
              <RequirePermission perm="sites:read">
                <SitesPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { SettingsPage } =
            await import('../features/settings/pages/SettingsPage');
          return {
            Component: () => (
              <RequirePermission perm="settings:manage">
                <SettingsPage />
              </RequirePermission>
            ),
          };
        },
      },
      {
        path: 'profile',
        lazy: async () => {
          const { ProfilePage } =
            await import('../features/profile/pages/ProfilePage');
          return { Component: ProfilePage };
        },
      },
      {
        path: 'notifications',
        lazy: async () => {
          const { NotificationsPage } =
            await import('../features/notifications/pages/NotificationsPage');
          return { Component: NotificationsPage };
        },
      },
      // ...orderRoutes
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
