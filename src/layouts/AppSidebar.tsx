import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flex, Layout, Menu, Typography } from 'antd';
import { navigation } from './navigation';
import { usePermission } from '../shared/auth/usePermission';
import { SIDEBAR_WIDTH } from '../shared/constants/layout';

/**
 * Menu latéral. Il reste collé à la fenêtre pendant que la page défile, et
 * défile dans sa propre colonne quand il dépasse la hauteur de l'écran : on ne
 * perd jamais la navigation en descendant dans une longue liste.
 */
export function AppSidebar() {
  const { can } = usePermission();
  const location = useLocation();
  // `null` tant que l'utilisateur n'a rien replié : le menu s'ouvre alors sur
  // la section de l'écran courant. Dès qu'il ouvre ou ferme quelque chose,
  // c'est son choix qui vaut — le menu ne se réarrange plus sous ses yeux.
  const [opened, setOpened] = useState<string[] | null>(null);

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
  const active = useMemo(() => {
    let best: { section: string; key: string; length: number } | null = null;

    for (const section of navigation) {
      for (const item of section.items) {
        const covers =
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`);
        if (covers && (!best || item.path.length > best.length)) {
          best = {
            section: section.key,
            key: `${section.key}/${item.key}`,
            length: item.path.length,
          };
        }
      }
    }

    return best;
  }, [location.pathname]);

  const openKeys = opened ?? (active ? [active.section] : []);

  return (
    <Layout.Sider
      breakpoint="lg"
      collapsedWidth={0}
      width={SIDEBAR_WIDTH}
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        // Le menu latéral ne participe pas au défilement de la page : la
        // navigation reste sous la main, quelle que soit la longueur de
        // l'écran affiché.
        overflow: 'hidden',
      }}
    >
      <Flex vertical style={{ height: '100%' }}>
        <Flex align="center" gap={10} style={{ padding: '18px 16px' }}>
          {/* Le logotype complet est en partie marine : sur le menu marine,
              on n'affiche que l'étoile, avec le nom en toutes lettres. */}
          <img src="/mark-matelas-sankara.svg" alt="" width={30} height={30} />
          <Typography.Text strong style={{ color: '#fff' }}>
            Matelas Sankara
          </Typography.Text>
        </Flex>

        {/* `minHeight: 0` : sans lui, un enfant flex refuse de rétrécir et
            l'ascenseur n'apparaît jamais. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <Menu
            theme="dark"
            mode="inline"
            items={items}
            selectedKeys={active ? [active.key] : []}
            openKeys={openKeys}
            onOpenChange={setOpened}
          />
        </div>
      </Flex>
    </Layout.Sider>
  );
}
