import type { ReactNode } from 'react';
import { Button, Empty, Result, Skeleton } from 'antd';
import { errorMessage } from '../api/errors';

export function EmptyState({
  description = 'Aucune donnée pour le moment.',
  action,
}: {
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE}>
      {action}
    </Empty>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <Result
      status="warning"
      title="Impossible d’afficher ces données"
      subTitle={errorMessage(error)}
      extra={
        onRetry && (
          <Button type="primary" onClick={onRetry}>
            Réessayer
          </Button>
        )
      }
    />
  );
}

export function PageSkeleton() {
  return <Skeleton active paragraph={{ rows: 6 }} />;
}
