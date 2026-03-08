/**
 * Hook para manejar el cierre de sesión automático por inactividad
 * Lee el valor de sessionTimeout desde appSettingsStore y cierra sesión
 * cuando el usuario está inactivo por ese tiempo
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';

interface UseSessionTimeoutReturn {
  /** Tiempo restante en segundos antes del cierre de sesión */
  timeRemaining: number;
  /** Si el modal de advertencia debe mostrarse */
  showWarning: boolean;
  /** Función para extender la sesión (reiniciar el timer) */
  extendSession: () => void;
  /** Si el timeout está activo */
  isActive: boolean;
}

// Tiempo de advertencia antes del cierre (60 segundos = 1 minuto)
const WARNING_TIME_SECONDS = 60;

export const useSessionTimeout = (): UseSessionTimeoutReturn => {
  const { isAuthenticated, logout } = useAuthStore();
  const { settings } = useAppSettingsStore();

  // sessionTimeout está en minutos, convertir a milisegundos
  const timeoutMinutes = settings?.sessionTimeout || 30;
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const [timeRemaining, setTimeRemaining] = useState<number>(timeoutMinutes * 60);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Función para cerrar sesión
  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    setIsActive(false);

    // Limpiar todos los timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    await logout();

    // Navegar a login con mensaje (el useAuth se encargará de esto)
    window.dispatchEvent(new CustomEvent('session:timeout', {
      detail: { message: 'Tu sesión ha expirado por inactividad' }
    }));
  }, [logout]);

  // Función para reiniciar el timer
  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setTimeRemaining(timeoutMinutes * 60);

    // Limpiar timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Tiempo para mostrar advertencia (timeout total - 60 segundos de advertencia)
    const warningTime = Math.max(timeoutMs - (WARNING_TIME_SECONDS * 1000), 0);

    // Timer para mostrar advertencia
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(WARNING_TIME_SECONDS);

      // Iniciar countdown de 60 segundos
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Tiempo agotado, cerrar sesión
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningTime);

    // Timer para cerrar sesión
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);

    setIsActive(true);
  }, [isAuthenticated, timeoutMinutes, timeoutMs, handleLogout]);

  // Función para extender la sesión (llamada desde el modal de advertencia)
  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Ref para tracking de showWarning sin causar re-renders
  const showWarningRef = useRef<boolean>(false);

  // Mantener ref sincronizado con state
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Eventos de actividad del usuario
  useEffect(() => {
    if (!isAuthenticated) {
      setIsActive(false);
      return;
    }

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Throttle para evitar demasiadas llamadas
    let throttleTimer: NodeJS.Timeout | null = null;

    const handleActivity = () => {
      // Solo reiniciar si NO estamos en el periodo de advertencia (usar ref para evitar re-render)
      if (showWarningRef.current) return;

      // Throttle: máximo una vez por segundo
      if (throttleTimer) return;

      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 1000);

      resetTimer();
    };

    // Agregar listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar el timer solo una vez al montar
    resetTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Limpiar al desautenticar
  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setShowWarning(false);
      setIsActive(false);
    }
  }, [isAuthenticated]);

  return {
    timeRemaining,
    showWarning,
    extendSession,
    isActive
  };
};

export default useSessionTimeout;
