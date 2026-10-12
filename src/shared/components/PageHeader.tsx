import type { ReactNode } from 'react';
import { Breadcrumb, Flex, Typography } from 'antd';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { title: ReactNode; href?: string }[];
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} style={{ marginBottom: 8 }} />
      )}
      <Flex align="center" justify="space-between" gap={16} wrap>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          )}
        </div>
        {actions && <Flex gap={8}>{actions}</Flex>}
      </Flex>
    </div>
  );
}
