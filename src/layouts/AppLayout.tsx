import { Outlet, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Flex, Layout, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { AppSidebar } from './AppSidebar';
import { SiteSelect } from './SiteSelect';
import { OfflineBanner } from '../shared/components';
import { NotificationBell } from '../features/notifications/components/NotificationBell';
import { useAuth } from '../shared/auth/useAuth';
import { useLogout } from '../features/auth/hooks';
import { roleLabel } from '../shared/constants/labels';
import { HEADER_HEIGHT } from '../shared/constants/layout';

export function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />

      {/* `minWidth: 0` : sans lui, un tableau large pousse la colonne au lieu
          de défiler, et la page entière part en largeur. */}
      <Layout style={{ minWidth: 0 }}>
        <Layout.Header
          style={{
            // L'en-tête accompagne le défilement : le site courant et la
            // cloche restent accessibles au milieu d'une longue liste.
            position: 'sticky',
            top: 0,
            zIndex: 20,
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '0 20px',
            borderBottom: '1px solid #e8eef5',
          }}
        >
          <SiteSelect />
          <Flex align="center" gap={16}>
            <NotificationBell />
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', label: 'Mon profil' },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    label: 'Se déconnecter',
                    icon: <LogoutOutlined />,
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'logout') logout();
                  if (key === 'profile') void navigate('/profile');
                },
              }}
            >
              <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <Flex vertical>
                  <Typography.Text strong style={{ lineHeight: 1.2 }}>
                    {user?.fullName}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {user ? roleLabel[user.roleCode] : ''}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Dropdown>
          </Flex>
        </Layout.Header>

        <OfflineBanner />

        <Layout.Content style={{ padding: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
