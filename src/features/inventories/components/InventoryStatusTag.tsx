import { Tag } from 'antd';
import { INVENTORY_STATUS } from '../labels';
import type { InventoryStatus } from '../../../shared/api/types';

export function InventoryStatusTag({ status }: { status: InventoryStatus }) {
  const info = INVENTORY_STATUS[status];
  return <Tag color={info?.color}>{info?.label ?? status}</Tag>;
}
