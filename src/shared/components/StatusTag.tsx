import { Tag } from 'antd';
import {
  cashSessionStatusColor,
  cashSessionStatusLabel,
} from '../constants/labels';
import type { CashSessionStatus } from '../api/types';

export function SessionStatusTag({ status }: { status: CashSessionStatus }) {
  return (
    <Tag color={cashSessionStatusColor[status]}>
      {cashSessionStatusLabel[status]}
    </Tag>
  );
}

interface StatusTagProps {
  label: string;
  color?: string;
}

/** Tag générique, pour les statuts qui n'ont pas encore leur table dédiée. */
export function StatusTag({ label, color = 'default' }: StatusTagProps) {
  return <Tag color={color}>{label}</Tag>;
}
