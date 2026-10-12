import type { ReactNode } from 'react';
import { Button, Popconfirm } from 'antd';

interface ConfirmActionProps {
  title: string;
  description?: ReactNode;
  okText?: string;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  children: ReactNode;
}

/** Confirmation explicite des actions irréversibles (clôture, validation). */
export function ConfirmAction({
  title,
  description,
  okText = 'Confirmer',
  danger,
  disabled,
  loading,
  onConfirm,
  children,
}: ConfirmActionProps) {
  return (
    <Popconfirm
      title={title}
      description={description}
      okText={okText}
      cancelText="Annuler"
      okButtonProps={{ danger }}
      onConfirm={onConfirm}
      disabled={disabled}
    >
      <Button danger={danger} disabled={disabled} loading={loading}>
        {children}
      </Button>
    </Popconfirm>
  );
}
