// ============================================================================
// NOTIFICATION BELL - Campana de Notificaciones con Badge
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/services/api/notificationsApi';
import { useAuthStore } from '@/store/authStore';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // Cargar contador de no leídas desde la API real
  // El backend usa el user_id del token JWT automáticamente
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error al cargar contador de notificaciones:', error);
    }
  }, [user]);

  useEffect(() => {
    loadUnreadCount();

    // Actualizar cada 10 segundos para respuesta más rápida
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-6 h-6 text-gray-600" />

        {/* Badge contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {showPanel && (
        <NotificationPanel
          onClose={() => setShowPanel(false)}
          onNotificationUpdate={loadUnreadCount}
        />
      )}
    </div>
  );
}
