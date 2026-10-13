import { useState } from 'react';
import { Badge, Button, Dropdown, Empty, Flex, List, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../../shared/utils/format';
import { useMarkAllRead, useMarkRead, useUnreadCount } from '../hooks';
import { resolveNotificationLink } from '../links';

/** Cloche de l'en-tête : les cinq dernières alertes, et le compte des non lues. */
export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { unread, recent } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      placement="bottomRight"
      popupRender={() => (
        <div
          style={{
            width: 380,
            background: 'var(--sankara-surface, #fff)',
            borderRadius: 8,
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.14)',
          }}
        >
          <Flex
            align="center"
            justify="space-between"
            gap={8}
            style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7' }}
          >
            <Typography.Text strong>Notifications</Typography.Text>
            {unread > 0 && (
              <Button
                type="link"
                size="small"
                loading={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                Tout marquer comme lu
              </Button>
            )}
          </Flex>

          {recent.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Rien à signaler."
              style={{ padding: 16 }}
            />
          ) : (
            <List
              size="small"
              dataSource={recent}
              renderItem={(item) => {
                const target = resolveNotificationLink(item.link);
                return (
                  <List.Item
                    style={{
                      padding: '10px 16px',
                      cursor: target ? 'pointer' : 'default',
                      background: item.readAt ? undefined : '#f6f9ff',
                    }}
                    onClick={() => {
                      if (!item.readAt) markRead.mutate(item.id);
                      if (target) {
                        setOpen(false);
                        void navigate(target);
                      }
                    }}
                  >
                    <Flex vertical gap={2} style={{ width: '100%' }}>
                      <Typography.Text strong={!item.readAt}>
                        {item.title}
                      </Typography.Text>
                      <Typography.Text type="secondary" ellipsis>
                        {item.body}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {formatDateTime(item.createdAt)}
                      </Typography.Text>
                    </Flex>
                  </List.Item>
                );
              }}
            />
          )}

          <div style={{ padding: '10px 16px', borderTop: '1px solid #eef2f7' }}>
            <Link to="/notifications" onClick={() => setOpen(false)}>
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    >
      <Badge count={unread} size="small" offset={[2, -2]}>
        <BellOutlined
          style={{ fontSize: 18, cursor: 'pointer' }}
          aria-label={`Notifications${unread > 0 ? ` : ${unread} non lue(s)` : ''}`}
        />
      </Badge>
    </Dropdown>
  );
}
