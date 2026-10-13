import { Tag } from 'antd';
import { MOVEMENT } from '../labels';

export function MovementTypeTag({ type }: { type: string }) {
  const movement = MOVEMENT[type];
  return <Tag color={movement?.color}>{movement?.label ?? type}</Tag>;
}
