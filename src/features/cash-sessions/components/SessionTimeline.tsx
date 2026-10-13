import { Empty, Timeline, Typography } from 'antd';
import { Money } from '../../../shared/components';
import { formatDateTime } from '../../../shared/utils/format';
import { SESSION_EVENTS } from '../labels';
import type { CashSessionEvent } from '../../../shared/api/types';

/**
 * Historique de la session. Le détail utile vit dans le `payload` de chaque
 * événement : on en montre ce qui se lit, plutôt que le JSON brut.
 */
export function SessionTimeline({ events }: { events: CashSessionEvent[] }) {
  if (events.length === 0) {
    return <Empty description="Aucun événement." />;
  }

  return (
    <Timeline
      items={events.map((event) => {
        const info = SESSION_EVENTS[event.type];
        return {
          color: info?.color ?? 'blue',
          children: (
            <>
              <Typography.Text strong>
                {info?.label ?? event.type}
              </Typography.Text>
              <div>
                <Typography.Text type="secondary">
                  {formatDateTime(event.createdAt)}
                  {event.actorName ? ` · ${event.actorName}` : ''}
                </Typography.Text>
              </div>
              <EventDetail payload={event.payload} />
            </>
          ),
        };
      })}
    />
  );
}

function EventDetail({ payload }: { payload: Record<string, unknown> }) {
  const amount = numberOf(payload, 'amount', 'openingFloat', 'gapTotal');
  const comment = stringOf(payload, 'comment');

  if (amount === null && !comment) return null;

  return (
    <Typography.Paragraph style={{ marginBottom: 0 }}>
      {amount !== null && <Money value={amount} signed={amount < 0} />}
      {amount !== null && comment ? ' — ' : null}
      {comment}
    </Typography.Paragraph>
  );
}

function numberOf(
  payload: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    if (typeof payload[key] === 'number') return payload[key];
  }
  return null;
}

function stringOf(
  payload: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    if (typeof payload[key] === 'string' && payload[key].trim() !== '') {
      return payload[key];
    }
  }
  return null;
}
