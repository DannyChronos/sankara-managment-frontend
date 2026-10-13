import { Card, Col, Empty, Row, Spin, Tag, Typography } from 'antd';
import { Money } from '../../../shared/components';
import type { VariantSearchResult } from '../../../shared/api/types';

interface Props {
  results: VariantSearchResult[];
  loading: boolean;
  term: string;
  onPick: (variant: VariantSearchResult) => void;
}

/**
 * Grille de résultats. Une carte sans stock est grisée et ne s'ajoute pas : le
 * contrôle reste du confort de saisie, c'est le backend qui tranche.
 */
export function VariantGrid({ results, loading, term, onPick }: Props) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (term.trim().length < 2) {
    return (
      <Empty
        description="Cherchez un article par nom, SKU ou code-barres"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ marginTop: 48 }}
      />
    );
  }

  if (results.length === 0) {
    return (
      <Empty
        description={`Aucun article pour « ${term} »`}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ marginTop: 48 }}
      />
    );
  }

  return (
    <Row gutter={[12, 12]}>
      {results.map((variant) => {
        const soldOut = variant.available <= 0;

        return (
          <Col xs={12} sm={8} lg={6} key={variant.id}>
            <Card
              size="small"
              hoverable={!soldOut}
              onClick={() => !soldOut && onPick(variant)}
              style={{
                height: '100%',
                opacity: soldOut ? 0.5 : 1,
                cursor: soldOut ? 'not-allowed' : 'pointer',
                borderColor: soldOut ? '#e3e8ef' : undefined,
              }}
              aria-disabled={soldOut}
            >
              <Typography.Text strong ellipsis style={{ display: 'block' }}>
                {variant.productName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {variant.name}
              </Typography.Text>

              <div style={{ marginTop: 8, fontSize: 16 }}>
                {variant.price === null ? (
                  <Tag color="error">sans prix</Tag>
                ) : (
                  <Money value={variant.price} strong />
                )}
              </div>

              <Tag
                color={
                  soldOut
                    ? 'error'
                    : variant.available <= 3
                      ? 'warning'
                      : 'success'
                }
                style={{ marginTop: 6 }}
              >
                {soldOut ? 'Rupture' : `Dispo : ${variant.available}`}
              </Tag>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
