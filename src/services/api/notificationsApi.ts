/**
 * API Service para Notificaciones
 * Maneja notificaciones del sistema con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface NotificationData {
  notification_id?: number;
  user_id?: number;
  patient_id?: number;
  notification_type?: string;
  notification_title?: string;
  notification_message?: string;
  notification_data?: Record<string, any>;
  title?: string;
  message?: string;
  is_read?: boolean;
  read_at?: string;
  related_entity_type?: string;
  related_entity_id?: number;
  action_url?: string;
  priority?: 'low' | 'normal' | 'high';
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: NotificationData[];
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationData;
  message?: string;
}

export interface NotificationFilters {
  user_id?: number;
  is_read?: boolean;
  notification_type?: string;
  priority?: string;
  limit?: number;
}

class NotificationsApiService {
  /**
   * Obtiene todas las notificaciones con filtros opcionales
   */
  async getNotifications(filters?: NotificationFilters): Promise<NotificationsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.user_id) params.append('user_id', filters.user_id.toString());
      if (filters?.is_read !== undefined) params.append('is_read', filters.is_read.toString());
      if (filters?.notification_type) params.append('notification_type', filters.notification_type);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<NotificationsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leidas
   * Nota: El backend usa el user_id del token JWT automaticamente
   */
  async getUnreadCount(userId?: number): Promise<number> {
    try {
      const response = await httpClient.get<any>('/notifications/unread-count');
      return response.data?.unread_count || 0;
    } catch (error) {
      console.error('Error al obtener contador de notificaciones:', error);
      return 0;
    }
  }

  /**
   * Marca una notificacion como leida
   */
  async markAsRead(notificationId: number): Promise<NotificationResponse> {
    try {
      const response = await httpClient.put<NotificationResponse>(`/notifications/${notificationId}/read`, {});

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al marcar como leida');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca todas las notificaciones del usuario como leidas
   * Nota: El backend usa el user_id del token JWT automaticamente
   */
  async markAllAsRead(userId?: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.put(`/notifications/mark-all-read/all`, {});

      if (!response.success) {
        throw new Error(response.message || 'Error al marcar todas como leidas');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const notificationsApi = new NotificationsApiService();
export default notificationsApi;
