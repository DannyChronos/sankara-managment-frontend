import { Tag } from 'antd';
import { OPERATION_STATUS } from '../labels';

export function OperationStatusTag({ status }: { status: string }) {
  const info = OPERATION_STATUS[status];
  return <Tag color={info?.color}>{info?.label ?? status}</Tag>;
}
