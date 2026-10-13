import { Tag } from 'antd';
import { ORDER_STATUS } from '../labels';

export function OrderStatusTag({ status }: { status: string }) {
  const info = ORDER_STATUS[status];
  return <Tag color={info?.color}>{info?.label ?? status}</Tag>;
}
