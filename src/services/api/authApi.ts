/**
 * API Service para Autenticación
 * Maneja login, logout y gestión de tokens JWT
 */

import httpClient, { ApiResponse } from './httpClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserData {
  user_id: number;
  role_id: number;
  branch_id: number | null;
  dentist_id: number | null; // ID del dentista (para doctores y external_client)
  patient_id: number | null; // ID del paciente (para rol paciente)
  professional_license: string | null; // COP (para doctores y external_client)
  specialty: { id: number; name: string } | null; // Especialidad (para doctores y external_client)
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  mobile: string | null;
  avatar_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login: string | null;
  profile: any;
  branches_access: number[] | null;
  commission_percentage: number | null;
  commission_config: any;
  role: {
    role_id: number;
    role_name: string;
    role_description: string | null;
    role_level: number;
  };
  permissions: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: UserData;
}

export interface AuthApiResponse {
  success: boolean;
  user?: UserData;
  token?: string;
  message?: string;
  passwordExpired?: boolean;
  mustChangePassword?: boolean;
  passwordExpiryWarning?: {
    daysUntilExpiry: number;
    message: string;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeExpiredPasswordData {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

class AuthApiService {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<AuthApiResponse> {
    try {

      const response = await httpClient.post<LoginResponse & { passwordExpired?: boolean; mustChangePassword?: boolean; passwordExpiryWarning?: { daysUntilExpiry: number; message: string } }>(
        '/auth/login',
        credentials,
        { requiresAuth: false } // No requiere token para login
      );

      if (response.success && response.token) {

        // Guardar token en el httpClient
        httpClient.saveToken(response.token);

        return {
          success: true,
          user: response.user,
          token: response.token,
          message: response.message || 'Login exitoso',
          passwordExpiryWarning: response.passwordExpiryWarning,
        };
      }

      return {
        success: false,
        message: response.message || 'Error en el login',
      };
    } catch (error: any) {
      // Capturar respuesta de contraseña expirada (HTTP 403)
      // Nota: httpClient usa fetch nativo, el error tiene .status y .data (no .response)
      if (error?.status === 403 && error?.data?.passwordExpired) {
        return {
          success: false,
          passwordExpired: true,
          mustChangePassword: true,
          message: error.data.error || 'Tu contraseña ha expirado. Debe ser cambiada.',
        };
      }

      // Capturar respuesta de cuenta bloqueada (HTTP 423)
      if (error?.status === 423) {
        return {
          success: false,
          message: error.data?.error || 'Cuenta bloqueada temporalmente',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
      };
    }
  }

  /**
   * Cierra sesión del usuario actual
   */
  async logout(): Promise<void> {
    try {
      // Eliminar token del cliente
      httpClient.removeToken();

      // Opcional: Llamar endpoint de logout en el backend si existe
      // await httpClient.post('/auth/logout');
    } catch (error) {
      // Aún así eliminar el token
      httpClient.removeToken();
    }
  }

  /**
   * Verifica si hay un token válido
   */
  hasValidToken(): boolean {
    const token = localStorage.getItem('dental_clinic_token');
    if (!token) return false;

    try {
      // Decodificar el payload del JWT (parte central del token)
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Verificar si el token ha expirado
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información del usuario desde el token
   */
  getUserFromToken(): UserData | null {
    const token = localStorage.getItem('dental_clinic_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // El payload del backend contiene: user_id, email, role_id, role_name, branch_id, branches_access, dentist_id, patient_id
      // Necesitamos construir un objeto UserData básico
      return {
        user_id: payload.user_id,
        role_id: payload.role_id,
        branch_id: payload.branch_id,
        dentist_id: payload.dentist_id || null, // Incluir dentist_id del token (para doctores y external_client)
        patient_id: payload.patient_id || null, // Incluir patient_id del token (para pacientes)
        professional_license: null,
        specialty: null,
        username: payload.email?.split('@')[0] || '',
        email: payload.email,
        first_name: '',
        last_name: '',
        full_name: payload.email?.split('@')[0] || '',
        phone: null,
        mobile: null,
        avatar_url: null,
        is_active: true,
        email_verified: true,
        last_login: null,
        profile: null,
        branches_access: payload.branches_access,
        commission_percentage: null,
        commission_config: null,
        role: {
          role_id: payload.role_id,
          role_name: payload.role_name,
          role_description: null,
          role_level: 1,
        },
        permissions: [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    try {
      const response = await httpClient.post<ChangePasswordResponse>(
        '/auth/change-password',
        data,
        { requiresAuth: true }
      );

      return {
        success: response.success,
        message: response.message || (response.success ? 'Contraseña actualizada correctamente' : 'Error al cambiar contraseña'),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar contraseña',
      };
    }
  }

  /**
   * Cambia la contraseña cuando ha expirado (no requiere autenticación completa)
   */
  async changeExpiredPassword(data: ChangeExpiredPasswordData): Promise<ChangePasswordResponse> {
    try {
      // Transformar nombres de campos a snake_case para el backend
      const backendData = {
        email: data.email,
        current_password: data.currentPassword,
        new_password: data.newPassword
      };

      const response = await httpClient.post<ChangePasswordResponse>(
        '/auth/change-expired-password',
        backendData,
        { requiresAuth: false }
      );

      return {
        success: response.success,
        message: response.message || (response.success ? 'Contraseña actualizada correctamente' : 'Error al cambiar contraseña'),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar contraseña',
      };
    }
  }
}

// Exportar instancia singleton
export const authApi = new AuthApiService();
export default authApi;
