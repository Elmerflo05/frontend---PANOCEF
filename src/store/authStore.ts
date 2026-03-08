import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import ApiAuthService from '@/services/api/authService';
import type { User, LoginCredentials } from '@/types';
import { logger } from '@/lib/logger';

interface AuthState {
  user: User | null;
  token: string | null; // 🔒 CRÍTICO: Persistir token en el store
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  passwordExpired: boolean; // 🔒 Flag para indicar que la contraseña ha expirado
  daysUntilExpiry: number | null; // Días hasta que expire la contraseña
  _hasHydrated: boolean; // 🔧 Flag para saber si el store terminó de cargar desde localStorage
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User['profile']>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void; // 🔧 Nueva acción
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (resource: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      // 🔥 Wrapper para detectar cambios sospechosos en el estado
      const monitoredSet: typeof set = (partial) => {
        const prevState = get();
        const prevToken = prevState.token;
        const prevAuth = prevState.isAuthenticated;

        // Ejecutar el set normal
        set(partial);

        // Verificar después del set (solo en desarrollo)
        if (import.meta.env.DEV) {
          const newState = get();
          const newToken = newState.token;
          const newAuth = newState.isAuthenticated;

          // Detectar pérdida de token sospechosa
          if (prevToken && !newToken && newAuth) {
            // Token lost - silent check
          }
        }
      };

      return {
      // Initial state
      user: null,
      token: null, // 🔒 Token JWT inicial
      isAuthenticated: false,
      isLoading: false,
      error: null,
      passwordExpired: false, // 🔒 Flag para indicar que la contraseña ha expirado
      daysUntilExpiry: null, // Días hasta que expire la contraseña
      _hasHydrated: false, // 🔧 Inicialmente no ha terminado de hidratar

      // Actions
      login: async (credentials: LoginCredentials): Promise<boolean> => {
        logger.auth('Login iniciado', { email: credentials.email });
        monitoredSet({ isLoading: true, error: null, passwordExpired: false });

        try {
          logger.auth('Llamando a ApiAuthService.login');
          const response = await ApiAuthService.login(credentials);

          logger.auth('ApiAuthService retornó', {
            success: response.success,
            hasUser: !!response.user,
            hasToken: !!response.token,
            userRole: response.user?.role,
            passwordExpired: response.passwordExpired,
            message: response.message
          });

          // Verificar si la contraseña ha expirado
          if (response.passwordExpired) {
            logger.warn('Contraseña expirada detectada');
            monitoredSet({
              passwordExpired: true,
              error: response.message || 'Tu contraseña ha expirado. Debe ser cambiada.',
              isLoading: false
            });
            return false;
          }

          if (response.success && response.user && response.token) {
            // 🔒 CRÍTICO: Guardar token en localStorage Y en el store
            localStorage.setItem('dental_clinic_token', response.token);

            logger.store('authStore', 'Login exitoso, actualizando store con usuario Y token');
            monitoredSet({
              user: response.user,
              token: response.token, // 🔒 Guardar token en el estado de Zustand
              isAuthenticated: true,
              isLoading: false,
              error: null,
              passwordExpired: false,
              daysUntilExpiry: response.daysUntilExpiry || null
            });
            logger.store('authStore', 'Store actualizado con token persistente');
            return true;
          } else {
            logger.warn('Login falló', response.message);
            monitoredSet({
              error: response.message || 'Error de autenticación',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          logger.error('Error en login', error);
          monitoredSet({
            error: error instanceof Error ? error.message : 'Error de conexión',
            isLoading: false
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        monitoredSet({ isLoading: true });

        try {
          await ApiAuthService.logout();
        } catch (error) {
          logger.error('Logout error', error);
        } finally {
          // 🔒 CRÍTICO: Limpiar token JWT explícitamente
          localStorage.removeItem('dental_clinic_token');
          localStorage.removeItem('dental_clinic_user');

          monitoredSet({
            user: null,
            token: null, // 🔒 Limpiar token del estado también
            isAuthenticated: false,
            isLoading: false,
            error: null,
            passwordExpired: false,
            daysUntilExpiry: null
          });
        }
      },

      refreshUser: async (): Promise<void> => {
        const currentUser = ApiAuthService.getCurrentUser();
        const token = localStorage.getItem('dental_clinic_token');

        if (currentUser && token) {
          // Usuario y token válidos, actualizar estado
          monitoredSet({
            user: currentUser,
            token: token, // 🔒 Sincronizar token con el estado
            isAuthenticated: true,
            error: null
          });
        } else {
          // No hay usuario o token, limpiar estado
          monitoredSet({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      updateProfile: async (updates: Partial<User['profile']>): Promise<boolean> => {
        monitoredSet({ isLoading: true, error: null });

        try {
          // TODO: Implementar endpoint de actualización de perfil en el backend
          // Por ahora solo actualizamos localmente
          const { user } = get();
          if (!user) {
            monitoredSet({
              error: 'Usuario no autenticado',
              isLoading: false
            });
            return false;
          }

          const updatedUser = {
            ...user,
            profile: {
              ...user.profile,
              ...updates
            }
          };

          monitoredSet({
            user: updatedUser,
            isLoading: false,
            error: null
          });

          // Guardar en localStorage
          localStorage.setItem('dental_clinic_user', JSON.stringify(updatedUser));

          logger.auth('Profile actualizado localmente');
          return true;
        } catch (error) {
          logger.error('Error al actualizar perfil', error);
          monitoredSet({
            error: error instanceof Error ? error.message : 'Error de conexión',
            isLoading: false
          });
          return false;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
        monitoredSet({ isLoading: true, error: null });

        try {
          const response = await ApiAuthService.changePassword(currentPassword, newPassword);

          if (response.success) {
            logger.auth('Contraseña actualizada exitosamente');
            monitoredSet({
              isLoading: false,
              error: null
            });
            return true;
          } else {
            logger.warn('Error al cambiar contraseña', response.message);
            monitoredSet({
              error: response.message || 'Error al cambiar contraseña',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          logger.error('Error al cambiar contraseña', error);
          monitoredSet({
            error: error instanceof Error ? error.message : 'Error de conexión',
            isLoading: false
          });
          return false;
        }
      },

      clearError: () => {
        monitoredSet({ error: null });
      },

      setLoading: (loading: boolean) => {
        monitoredSet({ isLoading: loading });
      },

      setHasHydrated: (hydrated: boolean) => {
        monitoredSet({ _hasHydrated: hydrated });
      },

      hasRole: (role: string | string[]): boolean => {
        // 🔧 CRÍTICO: Leer del estado de Zustand en lugar de localStorage
        const user = get().user;

        if (!user) {
          return false;
        }

        const hasRoleResult = Array.isArray(role)
          ? role.includes(user.role)
          : user.role === role;

        return hasRoleResult;
      },

      hasPermission: (permission: string): boolean => {
        // 🔧 CRÍTICO: Leer del estado de Zustand en lugar de localStorage
        const user = get().user;
        if (!user) return false;
        return ApiAuthService.hasPermission(permission);
      },

      canAccess: (resource: string): boolean => {
        const { user } = get();
        if (!user) return false;

        const accessRules: Record<string, string[]> = {
          'laboratory': ['imaging_technician', 'external_client'],
        };

        const allowedRoles = accessRules[resource];
        return allowedRoles ? allowedRoles.includes(user.role) : false;
      }
      }; // Cerrar el return del wrapper
    },
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token, // 🔒 Persistir token junto con el usuario
        isAuthenticated: state.isAuthenticated
      }),
      // 🔧 Marcar cuando termine la hidratación desde localStorage
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            // Aún así marcar como hidratado para no bloquear la app
            if (state) state._hasHydrated = true;
          } else {
            // 🔒 CRÍTICO: Validar y restaurar token JWT
            if (state && state.isAuthenticated) {
              // Si tenemos token en el estado pero no en localStorage, restaurarlo
              if (state.token) {
                const tokenInLocalStorage = localStorage.getItem('dental_clinic_token');

                if (!tokenInLocalStorage) {
                  localStorage.setItem('dental_clinic_token', state.token);
                } else if (tokenInLocalStorage !== state.token) {
                  localStorage.setItem('dental_clinic_token', state.token);
                }
              } else {
                // Si no hay token en el estado pero está autenticado, hay un problema
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;

                // También limpiar del localStorage
                localStorage.removeItem('dental_clinic_token');
                localStorage.removeItem('dental_clinic_user');
              }
            }

            // Marcar que ya terminó la hidratación
            if (state) state._hasHydrated = true;
          }
        };
      }
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);