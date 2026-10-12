import type { ThemeConfig } from 'antd';

/**
 * Couleurs reprises du logo officiel (`public/logo-matelas-sankara.svg`) :
 * marine, bleu ciel et jaune étoile.
 *
 * `blue` est la teinte de la marque mais ne porte pas de texte blanc
 * (contraste 2,9:1, sous le seuil WCAG AA) : les boutons et éléments actifs
 * utilisent `blueDeep`, qui reste la même couleur en plus soutenu (7,0:1).
 * Le jaune ne sert jamais de couleur de texte : fond jaune, texte marine.
 */
export const brand = {
  navy: '#0E2E4E',
  blue: '#6E9ACE',
  blueDeep: '#2C5B92',
  star: '#F9D86C',
  success: '#2E9E5B',
  danger: '#CF2E2E',
  surface: '#F4F7FB',
} as const;

export const theme: ThemeConfig = {
  token: {
    colorPrimary: brand.blueDeep,
    colorInfo: brand.blueDeep,
    colorLink: brand.blueDeep,
    colorSuccess: brand.success,
    colorError: brand.danger,
    colorWarning: brand.star,
    colorTextHeading: brand.navy,
    colorText: 'rgba(14, 46, 78, 0.88)',
    colorBgLayout: brand.surface,
    colorBorder: '#D8E3EF',
    fontFamily:
      "'Inter', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    borderRadius: 8,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: brand.navy,
      bodyBg: brand.surface,
    },
    Menu: {
      darkItemBg: brand.navy,
      darkSubMenuItemBg: brand.navy,
      darkItemSelectedBg: brand.blueDeep,
      darkGroupTitleColor: 'rgba(255, 255, 255, 0.45)',
    },
    Table: {
      headerBg: brand.surface,
      rowHoverBg: '#EAF2FA',
    },
    Statistic: {
      titleFontSize: 13,
    },
  },
};
