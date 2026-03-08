import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { User, LoginCredentials } from '@/types';
import { logger } from '@/lib/logger';

export interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User['profile']>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;

  // Permission checks
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;

  // Role shortcuts
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isReceptionist: boolean;
  isLabTechnician: boolean;
  isPatient: boolean;
  isExternalClient: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
    clearError,
    hasRole,
    hasPermission,
    canAccess
  } = useAuthStore();

  // Initialize auth state on mount (only if not already authenticated)
  useEffect(() => {
    // Only refresh if we don't have a user yet
    // This prevents clearing the state before Zustand hydration completes
    if (!isAuthenticated && !user) {
      refreshUser();
    }
  }, []); // Empty deps to run only once on mount

  // 🔒 CRÍTICO: Listener global para detectar token faltante
  useEffect(() => {
    let logoutInProgress = false; // Flag para prevenir múltiples logouts simultáneos

    const handleTokenMissing = (event: CustomEvent) => {
      // Evitar procesamiento duplicado
      if (logoutInProgress) {
        return;
      }


      // Si estamos autenticados pero no hay token, hacer logout forzado
      if (isAuthenticated) {

        logoutInProgress = true;

        // Forzar logout sin navegación (para evitar loops)
        logout().then(() => {
          logoutInProgress = false;

          // Solo navegar si no estamos ya en /login
          if (location.pathname !== '/login') {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
              }
            });
          }
        }).catch((error) => {
          logoutInProgress = false;
        });
      }
    };

    // Escuchar evento de token faltante
    window.addEventListener('auth:token-missing', handleTokenMissing as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('auth:token-missing', handleTokenMissing as EventListener);
    };
  }, [isAuthenticated, logout, navigate, location]);

  // Auto-redirect logic
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
      if (!publicRoutes.includes(location.pathname)) {
        navigate('/login', { replace: true, state: { from: location } });
      }
    }
  }, [isAuthenticated, navigate, location]);

  // Enhanced logout with navigation
  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Enhanced login with navigation
  const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
    logger.auth('handleLogin iniciado');

    const success = await login(credentials);
    logger.auth('login() retornó', { success });

    if (success) {
      logger.debug('Login exitoso, esperando hidratación del store (150ms)');
      // Wait for the store to be fully hydrated
      await new Promise(resolve => setTimeout(resolve, 150));

      logger.auth('Llamando a refreshUser');
      // Force a refresh to ensure we have the latest user data
      await refreshUser();

      // Get the latest state
      const store = useAuthStore.getState();
      const freshUser = store.user;
      const isAuth = store.isAuthenticated;

      logger.auth('Después de refresh', {
        user: freshUser?.email,
        role: freshUser?.role,
        authenticated: isAuth
      });

      if (freshUser && isAuth) {
        logger.info('Usuario autenticado, navegando a ruta por defecto...', {
          userId: freshUser.id,
          email: freshUser.email,
          role: freshUser.role,
          isAuthenticated: isAuth
        });

        const defaultRoute = getDefaultRoute(freshUser.role);
        const from = (location.state as any)?.from?.pathname || defaultRoute;

        // Ensure we're not trying to navigate to login page
        const targetRoute = (from === '/login' || from === '/') ? defaultRoute : from;

        logger.info('🧭 Navegando a:', {
          targetRoute,
          userRole: freshUser.role,
          defaultRoute,
          from
        });

        // 🔧 Esperar un tick adicional para que el store se actualice completamente
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar una última vez que el usuario sigue autenticado
        const finalCheck = useAuthStore.getState();
        logger.info('🔍 Verificación final antes de navegar:', {
          isAuthenticated: finalCheck.isAuthenticated,
          hasUser: !!finalCheck.user,
          userRole: finalCheck.user?.role
        });

        // Use replace to avoid adding to history
        navigate(targetRoute, { replace: true });
      } else {
        logger.error('Verificación de autenticación falló después del login');
        navigate('/login', { replace: true });
      }
    } else {
      logger.warn('Login falló, no se navegará');
    }

    return success;
  };

  // Get default route based on user role
  const getDefaultRoute = (role: string): string => {
    switch (role) {
      case 'imaging_technician':
        return '/laboratory/dashboard';
      case 'external_client':
        return '/laboratory/submissions';
      default:
        return '/laboratory/dashboard';
    }
  };

  // Role shortcuts
  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole(['admin', 'super_admin']);
  const isDoctor = hasRole('doctor');
  const isReceptionist = hasRole('receptionist');
  const isImagingTechnician = hasRole('imaging_technician');
  const isPatient = hasRole('patient');
  const isExternalClient = hasRole('external_client');

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
    updateProfile,
    changePassword,
    clearError,
    
    // Permission checks
    hasRole,
    hasPermission,
    canAccess,
    
    // Role shortcuts
    isSuperAdmin,
    isAdmin,
    isDoctor,
    isReceptionist,
    isImagingTechnician,
    isPatient,
    isExternalClient
  };
};

// Hook for requiring authentication
export const useRequireAuth = (requiredRoles?: string[]): UseAuthReturn => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      if (requiredRoles && !auth.hasRole(requiredRoles)) {
        navigate('/unauthorized', { replace: true });
        return;
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.hasRole, navigate, requiredRoles]);

  return auth;
};

// Hook for guest-only pages (login, register)
export const useGuestOnly = (): UseAuthReturn => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const defaultRoute = getDefaultRoute(auth.user.role);
      navigate(defaultRoute, { replace: true });
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  return auth;
};

// Hook for checking specific permissions
export const usePermissions = (permissions: string[]): {
  hasAllPermissions: boolean;
  hasAnyPermission: boolean;
  missingPermissions: string[];
} => {
  const auth = useAuth();

  const hasAllPermissions = permissions.every(permission => 
    auth.hasPermission(permission)
  );

  const hasAnyPermission = permissions.some(permission => 
    auth.hasPermission(permission)
  );

  const missingPermissions = permissions.filter(permission => 
    !auth.hasPermission(permission)
  );

  return {
    hasAllPermissions,
    hasAnyPermission,
    missingPermissions
  };
};

// Hook for role-based component rendering
export const useRoleAccess = (allowedRoles: string[]): boolean => {
  const auth = useAuth();
  return auth.isAuthenticated && auth.hasRole(allowedRoles);
};

// Helper function (extracted to avoid duplication)
function getDefaultRoute(role: string): string {
  switch (role) {
    case 'imaging_technician':
      return '/laboratory/dashboard';
    case 'external_client':
      return '/laboratory/submissions';
    default:
      return '/laboratory/dashboard';
  }
}