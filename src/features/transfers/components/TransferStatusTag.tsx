import { Tag } from 'antd';
import { TRANSFER_STATUS } from '../labels';
import type { TransferStatus } from '../../../shared/api/types';

export function TransferStatusTag({ status }: { status: TransferStatus }) {
  const info = TRANSFER_STATUS[status];
  return <Tag color={info?.color}>{info?.label ?? status}</Tag>;
}
