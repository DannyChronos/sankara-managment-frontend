import { Flex, Layout } from 'antd';
import { AppBrand } from './AppBrand';
import { AppMenu } from './AppMenu';
import { SIDEBAR_WIDTH } from '../shared/constants/layout';

/**
 * Colonne de navigation des grands écrans. Elle reste collée à la fenêtre
 * pendant que la page défile, et défile dans sa propre colonne quand elle
 * dépasse la hauteur de l'écran.
 *
 * En dessous de `lg`, elle n'est pas rendue du tout : la navigation passe
 * alors par le tiroir de l'en-tête. Une colonne de 248 px prendrait le quart
 * d'un écran de tablette.
 */
export function AppSidebar() {
  return (
    <Layout.Sider
      breakpoint="lg"
      collapsedWidth={0}
      width={SIDEBAR_WIDTH}
      // Le déclencheur natif d'Ant Design est un onglet collé au bord, hors
      // de la colonne : `overflow: hidden` le masque, et c'est voulu — le
      // bouton du menu vit dans l'en-tête, où on le cherche.
      trigger={null}
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Flex vertical style={{ height: '100%' }}>
        <AppBrand />

        {/* `minHeight: 0` : sans lui, un enfant flex refuse de rétrécir et
            l'ascenseur n'apparaît jamais. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <AppMenu />
        </div>
      </Flex>
    </Layout.Sider>
  );
}
