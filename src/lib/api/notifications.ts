import { api } from '../api';
import type { NotificationInApp, UnreadCountResponse } from '../../types/notification';

/**
 * Récupérer les notifications de l'utilisateur connecté
 */
export async function getNotifications(limit = 50): Promise<NotificationInApp[]> {
  const response = await api.get<NotificationInApp[]>('/notifications', {
    params: { limit },
  });
  return response.data;
}

/**
 * Récupérer le nombre de notifications non lues
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return response.data;
}

/**
 * Marquer une notification comme lue
 */
export async function markAsRead(notificationId: string): Promise<NotificationInApp> {
  const response = await api.patch<NotificationInApp>(
    `/notifications/${notificationId}/read`
  );
  return response.data;
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  const response = await api.patch<{ count: number }>('/notifications/read-all');
  return response.data;
}

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}
