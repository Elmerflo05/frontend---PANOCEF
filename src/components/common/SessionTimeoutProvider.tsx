/**
 * Provider que maneja el timeout de sesión por inactividad
 * Integra el hook useSessionTimeout con el modal de advertencia
 *
 * Uso: Envolver los layouts autenticados con este componente
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { useAppSettingsStore } from '@/store/appSettingsStore';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

export const SessionTimeoutProvider = ({ children }: SessionTimeoutProviderProps) => {
  const navigate = useNavigate();
  const { loadSettings, settings } = useAppSettingsStore();

  // Cargar settings si no están cargados
  useEffect(() => {
    if (!settings) {
      loadSettings();
    }
  }, [settings, loadSettings]);

  const {
    timeRemaining,
    showWarning,
    extendSession,
    isActive
  } = useSessionTimeout();

  // Escuchar evento de timeout para navegar a login
  useEffect(() => {
    const handleSessionTimeout = (event: CustomEvent) => {
      navigate('/login', {
        replace: true,
        state: {
          message: event.detail?.message || 'Tu sesión ha expirado por inactividad'
        }
      });
    };

    window.addEventListener('session:timeout', handleSessionTimeout as EventListener);

    return () => {
      window.removeEventListener('session:timeout', handleSessionTimeout as EventListener);
    };
  }, [navigate]);

  return (
    <>
      {children}

      {/* Modal de advertencia de timeout */}
      <SessionTimeoutWarning
        show={showWarning}
        timeRemaining={timeRemaining}
        onExtend={extendSession}
      />
    </>
  );
};

export default SessionTimeoutProvider;
