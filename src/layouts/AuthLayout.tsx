import { Outlet } from 'react-router-dom';
import { Flex, Typography } from 'antd';

/**
 * Pages publiques : connexion, mot de passe oublié.
 * Sur le fond marine, seule l'étoile du logo est lisible — le logotype
 * complet (dont une partie est en marine) s'affiche sur le fond blanc de la
 * carte, dans la page elle-même.
 */
export function AuthLayout() {
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(160deg, var(--sankara-navy) 0%, #1c4a78 100%)',
        padding: 16,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Flex vertical align="center" gap={10} style={{ marginBottom: 20 }}>
          <img src="/mark-matelas-sankara.svg" alt="" width={56} height={56} />
          <Typography.Text style={{ color: 'rgba(255,255,255,0.8)' }}>
            Gestion du stock et de la caisse
          </Typography.Text>
        </Flex>
        <Outlet />
      </div>
    </Flex>
  );
}
