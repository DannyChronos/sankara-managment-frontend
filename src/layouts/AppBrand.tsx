import { Flex, Typography } from 'antd';

/**
 * Le logotype complet est en partie marine : sur le fond marine du menu, on
 * n'affiche que l'étoile, avec le nom en toutes lettres.
 */
export function AppBrand() {
  return (
    <Flex align="center" gap={10} style={{ padding: '18px 16px' }}>
      <img src="/mark-matelas-sankara.svg" alt="" width={30} height={30} />
      <Typography.Text strong style={{ color: '#fff' }}>
        Matelas Sankara
      </Typography.Text>
    </Flex>
  );
}
