import type { ReactNode } from 'react';
import { Card, Statistic, Typography } from 'antd';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  value: ReactNode;
  /** Précision sous le chiffre : panier moyen, seuil, période… */
  hint?: ReactNode;
  danger?: boolean;
  /** Écran qui répond à la question que pose le chiffre. */
  to?: string;
  linkLabel?: string;
}

/**
 * Carte d'indicateur. Un chiffre de tableau de bord n'a d'intérêt que s'il
 * mène quelque part : la carte entière est cliquable dès qu'un écran répond
 * à la question qu'il pose.
 */
export function StatCard({ title, value, hint, danger, to, linkLabel }: Props) {
  const card = (
    <Card
      hoverable={Boolean(to)}
      style={{ height: '100%' }}
      styles={{ body: { paddingBottom: 16 } }}
    >
      <Statistic
        title={title}
        value={typeof value === 'number' ? value : undefined}
        formatter={typeof value === 'number' ? undefined : () => value}
        valueStyle={danger ? { color: 'var(--sankara-danger)' } : undefined}
      />
      {hint && (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {hint}
        </Typography.Text>
      )}
      {to && linkLabel && (
        <div style={{ marginTop: 4 }}>
          <Typography.Text
            style={{ fontSize: 13, color: 'var(--sankara-blue-deep)' }}
          >
            {linkLabel} →
          </Typography.Text>
        </div>
      )}
    </Card>
  );

  return to ? (
    <Link to={to} style={{ display: 'block', height: '100%' }}>
      {card}
    </Link>
  ) : (
    card
  );
}
