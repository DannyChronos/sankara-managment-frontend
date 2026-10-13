import { Empty, Table, Typography } from 'antd';
import { Money } from '../../../shared/components';
import type { ReportResult } from '../../../shared/api/types';
import { HEADER_HEIGHT } from '../../../shared/constants/layout';

/**
 * Le rapport décrit lui-même ses colonnes : le frontend ne sait pas ce qu'il
 * affiche, et c'est voulu. Ajouter une colonne côté backend suffit, l'écran
 * suit — et l'export montre exactement la même chose.
 */
export function ReportTable({ report }: { report: ReportResult }) {
  if (report.rows.length === 0) {
    return <Empty description="Aucune donnée sur cette période." />;
  }

  const hasTotals = Object.keys(report.totals).length > 0;

  return (
    <Table<Record<string, unknown>>
      rowKey={(_, index) => String(index)}
      size="small"
      sticky={{ offsetHeader: HEADER_HEIGHT }}
      scroll={{ x: 'max-content' }}
      pagination={{
        pageSize: 50,
        showSizeChanger: false,
        hideOnSinglePage: true,
      }}
      dataSource={report.rows}
      columns={report.columns.map((column) => ({
        title: column.label,
        dataIndex: column.key,
        align: column.money ? ('right' as const) : undefined,
        render: (value: unknown) =>
          column.money && typeof value === 'number' ? (
            <Money value={value} />
          ) : (
            (value as string)
          ),
      }))}
      summary={() =>
        hasTotals ? (
          <Table.Summary fixed>
            <Table.Summary.Row>
              {report.columns.map((column, index) => {
                const total = report.totals[column.key];
                return (
                  <Table.Summary.Cell
                    key={column.key}
                    index={index}
                    align={column.money ? 'right' : undefined}
                  >
                    {index === 0 ? (
                      <Typography.Text strong>Total</Typography.Text>
                    ) : total === undefined ? null : column.money ? (
                      <Money value={total} strong />
                    ) : (
                      <Typography.Text strong>{total}</Typography.Text>
                    )}
                  </Table.Summary.Cell>
                );
              })}
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      }
    />
  );
}
