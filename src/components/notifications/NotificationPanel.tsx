// ============================================================================
// NOTIFICATION PANEL - Panel Dropdown de Notificaciones
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCheck, Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { notificationsApi, NotificationData } from '@/services/api/notificationsApi';
import { useAuthStore } from '@/store/authStore';

// Interfaz adaptada para el panel
interface PanelNotification {
  id: number;
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'lab_result' | 'system' | 'reminder' | 'info' | 'warning' | 'success' | 'error';
  status: 'unread' | 'read';
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
}

interface NotificationPanelProps {
  onClose: () => void;
  onNotificationUpdate: () => void;
}

// Función para mapear datos de la API al formato del panel
function mapNotificationData(data: NotificationData): PanelNotification {
  // Mapear el tipo de notificación
  const typeMap: Record<string, PanelNotification['type']> = {
    'payment_reminder': 'payment',
    'new_payment': 'payment',
    'appointment_confirmed': 'appointment',
    'appointment_rescheduled': 'appointment',
    'appointment_cancelled': 'appointment',
    'appointment_rejected': 'appointment',
    'appointment_reminder': 'reminder',
    'system': 'system',
    'info': 'info',
    'warning': 'warning',
    'success': 'success',
    'error': 'error',
  };

  return {
    id: data.notification_id || 0,
    title: data.notification_title || data.title || 'Sin título',
    message: data.notification_message || data.message || '',
    type: typeMap[data.notification_type || ''] || 'info',
    status: data.is_read ? 'read' : 'unread',
    priority: data.priority || 'normal',
    createdAt: new Date(data.created_at || Date.now()),
  };
}

export default function NotificationPanel({ onClose, onNotificationUpdate }: NotificationPanelProps) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<PanelNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones desde la API real
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userId = parseInt(user.id, 10);
      if (isNaN(userId)) return;

      const response = await notificationsApi.getNotifications({
        user_id: userId,
        limit: 50
      });

      const mappedNotifications = response.data.map(mapNotificationData);
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Marcar como leída
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      await loadNotifications();
      onNotificationUpdate();
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const userId = parseInt(user.id, 10);
      if (isNaN(userId)) return;
      await notificationsApi.markAllAsRead(userId);
      await loadNotifications();
      onNotificationUpdate();
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  };

  // Icono según tipo
  const getTypeIcon = (type: PanelNotification['type']) => {
    switch (type) {
      case 'payment':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'reminder':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'appointment':
        return <AlertCircle className="w-5 h-5 text-panocef-primary" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  // Color del borde según prioridad
  const getPriorityColor = (priority: PanelNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500';
      case 'normal':
        return 'border-l-4 border-blue-500';
      case 'low':
        return 'border-l-4 border-gray-300';
      default:
        return 'border-l-4 border-gray-300';
    }
  };

  // Formato de fecha relativa
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-bold text-gray-900">Notificaciones</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => n.status === 'unread') && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              title="Marcar todas como leídas"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No tienes notificaciones</p>
            <p className="text-sm text-gray-500 mt-1">Te avisaremos cuando llegue algo nuevo</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  notification.status === 'unread' ? 'bg-blue-50/30' : ''
                } ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icono */}
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold ${
                        notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      {notification.status === 'unread' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(notification.createdAt)}
                      </span>

                      {notification.status === 'unread' && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Mostrando últimas {notifications.length} notificaciones
          </p>
        </div>
      )}
    </div>
  );
}
