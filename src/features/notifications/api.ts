import { api, http } from '../../shared/api/http';
import type {
  ApiEnvelope,
  Notification,
  NotificationPage,
} from '../../shared/api/types';

export const notificationsApi = {
  /**
   * `getPaged` perdrait `meta.unread` : on déplie l'enveloppe ici pour garder
   * le compteur, qui vient de la même requête que la liste.
   */
  list: (params: Record<string, unknown>): Promise<NotificationPage> =>
    http
      .get<ApiEnvelope<Notification[]>>('/notifications', { params })
      .then((response) => ({
        data: response.data.data,
        meta: response.data.meta as NotificationPage['meta'],
      })),

  markRead: (id: string) =>
    api.patch<{ id: string; readAt: string }>(`/notifications/${id}/read`),

  markAllRead: () => api.patch<{ marked: number }>('/notifications/read-all'),
};
