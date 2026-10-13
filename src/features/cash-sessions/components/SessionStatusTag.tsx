import { Tag } from 'antd';
import {
  cashSessionStatusColor,
  cashSessionStatusLabel,
} from '../../../shared/constants/labels';
import type { CashSessionStatus } from '../../../shared/api/types';

export function SessionStatusTag({
  status,
  forceClosed,
}: {
  status: CashSessionStatus;
  forceClosed?: boolean;
}) {
  return (
    <>
      <Tag color={cashSessionStatusColor[status]}>
        {cashSessionStatusLabel[status]}
      </Tag>
      {forceClosed && <Tag color="volcano">Clôture forcée</Tag>}
    </>
  );
}
