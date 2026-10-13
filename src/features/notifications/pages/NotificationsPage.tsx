import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  Flex,
  List,
  Pagination,
  Select,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { formatDateTime } from '../../../shared/utils/format';
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_OPTIONS } from '../labels';
import { resolveNotificationLink } from '../links';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [type, setType] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const notifications = useNotifications({
    page,
    limit: 20,
    ...(unreadOnly ? { unreadOnly: true } : {}),
    ...(type ? { type } : {}),
  });

  if (notifications.isPending) return <PageSkeleton />;
  if (notifications.isError) {
    return (
      <ErrorState
        error={notifications.error}
        onRetry={() => void notifications.refetch()}
      />
    );
  }

  const { data, meta } = notifications.data;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={
          meta.unread > 0 ? `${meta.unread} non lue(s)` : 'Tout est lu.'
        }
        actions={
          <Button
            disabled={meta.unread === 0}
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Tout marquer comme lu
          </Button>
        }
      />

      <Card>
        <Flex gap={16} wrap align="center" style={{ marginBottom: 16 }}>
          <Flex align="center" gap={8}>
            <Switch
              size="small"
              aria-label="Non lues seulement"
              checked={unreadOnly}
              onChange={(value) => {
                setUnreadOnly(value);
                setPage(1);
              }}
            />
            <span>Non lues seulement</span>
          </Flex>
          <Select
            allowClear
            placeholder="Tous les types"
            style={{ minWidth: 240 }}
            value={type}
            onChange={(value?: string) => {
              setType(value);
              setPage(1);
            }}
            options={NOTIFICATION_TYPE_OPTIONS}
          />
        </Flex>

        {data.length === 0 ? (
          <Empty
            description={
              unreadOnly
                ? 'Aucune notification non lue.'
                : 'Aucune notification.'
            }
          />
        ) : (
          <>
            <List
              dataSource={data}
              renderItem={(item) => {
                const info = NOTIFICATION_TYPES[item.type];
                const target = resolveNotificationLink(item.link);

                return (
                  <List.Item
                    style={{
                      background: item.readAt ? undefined : '#f6f9ff',
                      paddingInline: 12,
                    }}
                    actions={[
                      ...(target
                        ? [
                            <Button
                              key="open"
                              type="link"
                              onClick={() => {
                                if (!item.readAt) markRead.mutate(item.id);
                                void navigate(target);
                              }}
                            >
                              Ouvrir
                            </Button>,
                          ]
                        : []),
                      ...(item.readAt
                        ? []
                        : [
                            <Button
                              key="read"
                              type="text"
                              size="small"
                              onClick={() => markRead.mutate(item.id)}
                            >
                              Marquer comme lu
                            </Button>,
                          ]),
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Flex align="center" gap={8} wrap>
                          <Typography.Text strong={!item.readAt}>
                            {item.title}
                          </Typography.Text>
                          <Tag color={info?.color}>
                            {info?.label ?? item.type}
                          </Tag>
                          {!item.readAt && <Tag color="blue">non lue</Tag>}
                        </Flex>
                      }
                      description={
                        <Flex vertical gap={2}>
                          <span>{item.body}</span>
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                          >
                            {formatDateTime(item.createdAt)}
                            {item.link && !target && (
                              <> · l’écran correspondant n’existe pas encore</>
                            )}
                          </Typography.Text>
                        </Flex>
                      }
                    />
                  </List.Item>
                );
              }}
            />

            <Flex justify="end" style={{ marginTop: 16 }}>
              <Pagination
                current={meta.page}
                pageSize={meta.limit}
                total={meta.total}
                showSizeChanger={false}
                hideOnSinglePage
                onChange={setPage}
              />
            </Flex>
          </>
        )}
      </Card>
    </>
  );
}

export default NotificationsPage;
