import { Select, Typography } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/auth/useAuth';

/**
 * Sélecteur de site courant : masqué si l'utilisateur n'a qu'un site (cas du
 * démarrage). Changer de site vide le cache des requêtes liées au site.
 */
export function SiteSelect() {
  const { user, siteId, setSiteId, currentSite } = useAuth();
  const queryClient = useQueryClient();

  if (!user || user.sites.length === 0) return null;

  if (user.sites.length === 1) {
    return (
      <Typography.Text strong style={{ color: 'var(--sankara-navy)' }}>
        {currentSite?.name ?? user.sites[0].name}
      </Typography.Text>
    );
  }

  return (
    <Select
      value={siteId ?? undefined}
      onChange={(next) => {
        setSiteId(next);
        void queryClient.invalidateQueries();
      }}
      options={user.sites.map((site) => ({
        value: site.id,
        label: `${site.name} (${site.code})`,
      }))}
      style={{ minWidth: 220 }}
      aria-label="Site courant"
    />
  );
}
