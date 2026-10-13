import { useState } from 'react';
import { Button, Card, Flex, Typography } from 'antd';
import { MoneyInput } from '../../../shared/components';
import { useOpenSession } from '../../cash-sessions/hooks';

/** Sans caisse ouverte, le POS ne propose que ça (FRONTEND.md §9.1). */
export function OpenSessionCard() {
  const [openingFloat, setOpeningFloat] = useState<number | null>(0);
  const open = useOpenSession();

  return (
    <Flex align="center" justify="center" style={{ flex: 1, padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title level={4}>Ouvrir ma caisse</Typography.Title>
        <Typography.Paragraph type="secondary">
          Comptez le fond de caisse avant de commencer : il entre dans la
          recette attendue de la journée.
        </Typography.Paragraph>

        <MoneyInput
          value={openingFloat}
          onChange={setOpeningFloat}
          autoFocus
          placeholder="Fond de caisse"
        />

        <Button
          type="primary"
          size="large"
          block
          style={{ marginTop: 16 }}
          loading={open.isPending}
          disabled={openingFloat === null}
          onClick={() => open.mutate({ openingFloat: openingFloat ?? 0 })}
        >
          Ouvrir la caisse
        </Button>
      </Card>
    </Flex>
  );
}
