import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Tooltip } from 'antd';
import { navigation } from './navigation';
import { usePermission } from '../shared/auth/usePermission';
import { roleLabel } from '../shared/constants/labels';

interface Props {
  /** Appelé après un clic sur une entrée : sert à refermer le tiroir. */
  onNavigate?: () => void;
}

/**
 * Le menu lui-même, sans son habillage : il sert aussi bien dans la colonne
 * latérale des grands écrans que dans le tiroir des petits.
 */
export function AppMenu({ onNavigate }: Props) {
  const { can } = usePermission();
  const location = useLocation();
  // `null` tant que l'utilisateur n'a rien replié : le menu s'ouvre alors sur
  // la section de l'écran courant. Dès qu'il ouvre ou ferme quelque chose,
  // c'est son choix qui vaut — le menu ne se réarrange plus sous ses yeux.
  const [opened, setOpened] = useState<string[] | null>(null);

  const items = useMemo(
    () =>
      navigation
        .map((section) => ({
          key: section.key,
          label: (
            <Tooltip
              placement="right"
              title={
                <>
                  <div>{section.hint}</div>
                  <div style={{ opacity: 0.75, marginTop: 4 }}>
                    Au quotidien :{' '}
                    {section.roles
                      .map((role) => roleLabel[role] ?? role)
                      .join(', ')}
                  </div>
                </>
              }
            >
              <span>{section.label}</span>
            </Tooltip>
          ),
          children: section.items
            .filter((item) => can(item.perm))
            .map((item) => ({
              key: `${section.key}/${item.key}`,
              label: (
                <Tooltip placement="right" title={item.hint}>
                  <Link to={item.path} onClick={onNavigate}>
                    {item.label}
                  </Link>
                </Tooltip>
              ),
            })),
        }))
        .filter((section) => section.children.length > 0),
    [can, onNavigate],
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

  return (
    <Menu
      theme="dark"
      mode="inline"
      items={items}
      selectedKeys={active ? [active.key] : []}
      openKeys={opened ?? (active ? [active.section] : [])}
      onOpenChange={setOpened}
    />
  );
}
