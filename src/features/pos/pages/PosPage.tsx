import { Button, Card, Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/auth/useAuth';

/**
 * Squelette du point de vente (FRONTEND.md §9) : recherche + grille d'articles
 * à gauche, panier et encaissement à droite, clé d'idempotence par tentative
 * de vente. À implémenter avec les endpoints `/catalog/variants/search`,
 * `/cash-sessions/current` et `/sales`.
 */
export function PosPage() {
  const { currentSite, user } = useAuth();

  return (
    <Flex vertical style={{ flex: 1 }}>
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: '12px 20px',
          background: 'var(--sankara-navy)',
          color: '#fff',
        }}
      >
        <Typography.Text strong style={{ color: '#fff' }}>
          Matelas Sankara · {currentSite?.name ?? 'Site non défini'} ·{' '}
          {user?.fullName}
        </Typography.Text>
        <Link to="/dashboard">
          <Button size="small">Quitter la caisse</Button>
        </Link>
      </Flex>

      <Flex flex={1} align="center" justify="center" style={{ padding: 24 }}>
        <Card style={{ maxWidth: 520 }}>
          <Typography.Title level={4}>Point de vente</Typography.Title>
          <Typography.Paragraph type="secondary">
            Sans session de caisse ouverte, cet écran n’affichera que « Ouvrir
            ma caisse ». La recherche, le panier et la fenêtre d’encaissement
            arrivent avec les modules `cash-sessions` et `sales` du backend.
          </Typography.Paragraph>
        </Card>
      </Flex>
    </Flex>
  );
}

export default PosPage;
