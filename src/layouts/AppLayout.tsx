import { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Flex, Layout, Menu, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { navigation } from './navigation';
import { SiteSelect } from './SiteSelect';
import { OfflineBanner } from '../shared/components';
import { NotificationBell } from '../features/notifications/components/NotificationBell';
import { useAuth } from '../shared/auth/useAuth';
import { usePermission } from '../shared/auth/usePermission';
import { useLogout } from '../features/auth/hooks';
import { roleLabel } from '../shared/constants/labels';

export function AppLayout() {
  const { user } = useAuth();
  const { can } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();

  // Le menu est déclaré une fois (navigation.ts) puis filtré : une section
  // dont aucune entrée n'est permise disparaît entièrement. La clé porte la
  // section : deux entrées peuvent viser le même écran (« Mes ventes » et
  // « Ventes ») sans se marcher dessus.
  const items = useMemo(
    () =>
      navigation
        .map((section) => ({
          key: section.key,
          label: section.label,
          type: 'group' as const,
          children: section.items
            .filter((item) => can(item.perm))
            .map((item) => ({
              key: `${section.key}/${item.key}`,
              label: <Link to={item.path}>{item.label}</Link>,
            })),
        }))
        .filter((section) => section.children.length > 0),
    [can],
  );

  // Entrée la plus précise qui couvre l'URL : un détail de bon
  // (/stock/operations/<id>) garde « Bons d'entrée / sortie » surligné.
  const selectedKeys = useMemo(() => {
    let best: { key: string; length: number } | null = null;

    for (const section of navigation) {
      for (const item of section.items) {
        const covers =
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`);
        if (covers && (!best || item.path.length > best.length)) {
          best = {
            key: `${section.key}/${item.key}`,
            length: item.path.length,
          };
        }
      }
    }

    return best ? [best.key] : [];
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider breakpoint="lg" collapsedWidth={0} width={248}>
        <Flex align="center" gap={10} style={{ padding: '18px 16px' }}>
          {/* Le logotype complet est en partie marine : sur le menu marine,
              on n'affiche que l'étoile, avec le nom en toutes lettres. */}
          <img src="/mark-matelas-sankara.svg" alt="" width={30} height={30} />
          <Typography.Text strong style={{ color: '#fff' }}>
            Matelas Sankara
          </Typography.Text>
        </Flex>
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={selectedKeys}
        />
      </Layout.Sider>

      <Layout>
        <Layout.Header
          style={{
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
