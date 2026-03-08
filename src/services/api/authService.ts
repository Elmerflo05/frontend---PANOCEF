/**
 * Servicio de Autenticación para API Real
 * NUEVO servicio que reemplaza el uso de IndexedDB por llamadas HTTP reales al backend
 */

import { authApi, type UserData, type LoginCredentials, type AuthApiResponse, type ChangePasswordData, type ChangeExpiredPasswordData } from './authApi';
import type { User } from '@/types';

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  passwordExpired?: boolean; // Indica si la contraseña ha expirado
  daysUntilExpiry?: number; // Días hasta que expire la contraseña
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Mapea UserData de la API al tipo User del frontend
 */
function mapApiUserToFrontendUser(apiUser: UserData): User {
  const mappedRole = mapRoleIdToRoleName(apiUser.role_id);


  // Determinar branch_id: usar el principal, o el primero de branches_access si no hay principal
  const primaryBranchId = apiUser.branch_id ||
    (apiUser.branches_access && apiUser.branches_access.length > 0 ? apiUser.branches_access[0] : null);

  // Construir el profile con todos los datos disponibles
  // Para external_client, el profile ya viene con licenseNumber y specialty desde el backend
  const baseProfile = apiUser.profile || {};
  const profile = {
    ...baseProfile,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    phone: apiUser.phone || apiUser.mobile || '',
    // Para pacientes, incluir patient_id en el profile
    patientId: apiUser.patient_id || undefined,
    // licenseNumber y specialty ya vienen en baseProfile para external_client
    // Para otros roles, usar professional_license si existe
    licenseNumber: baseProfile.licenseNumber || apiUser.professional_license || undefined,
    specialty: baseProfile.specialty || (apiUser.specialty?.name) || undefined,
  };

  // Construir array de especialidades si existe (para roles que usan specialty_id)
  const specialties = apiUser.specialty ? [{
    id: apiUser.specialty.id.toString(),
    name: apiUser.specialty.name
  }] : undefined;

  return {
    id: apiUser.user_id.toString(),
    email: apiUser.email,
    name: apiUser.full_name || `${apiUser.first_name} ${apiUser.last_name}`.trim(),
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    role: mappedRole,
    sedeId: primaryBranchId?.toString() || undefined,
    sedesAcceso: apiUser.branches_access?.map(id => id.toString()) || undefined,
    // IDs numéricos para operaciones con el backend
    dentist_id: apiUser.dentist_id || undefined,
    patient_id: apiUser.patient_id || undefined,
    branch_id: primaryBranchId || undefined,
    avatar: apiUser.avatar_url || undefined,
    phone: apiUser.phone || undefined,
    mobile: apiUser.mobile || undefined,
    status: apiUser.status || 'inactive',
    emailVerified: apiUser.email_verified,
    lastLogin: apiUser.last_login ? new Date(apiUser.last_login) : undefined,
    profile: profile,
    specialties: specialties,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: '', // No exponer contraseña
  } as User;
}

/**
 * Mapea role_id a role name
 */
function mapRoleIdToRoleName(roleId: number): string {
  const roleMap: Record<number, string> = {
    1: 'super_admin',
    2: 'admin',
    3: 'doctor',
    4: 'receptionist',
    5: 'imaging_technician',
    6: 'patient',           // Paciente (role_id 6 en BD)
    7: 'external_client',   // Cliente Externo (role_id 7 en BD)
  };

  const mappedRole = roleMap[roleId];

  if (!mappedRole) {
    return 'patient';
  }

  return mappedRole;
}

export class ApiAuthService {
  private static readonly TOKEN_KEY = 'dental_clinic_token';
  private static readonly USER_KEY = 'dental_clinic_user';

  /**
   * Inicia sesión con credenciales
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AuthApiResponse = await authApi.login(credentials);

      // Verificar si la contraseña ha expirado
      if (response.passwordExpired) {
        return {
          success: false,
          passwordExpired: true,
          message: response.message || 'Tu contraseña ha expirado. Debe ser cambiada.',
        };
      }

      if (!response.success || !response.user || !response.token) {
        return {
          success: false,
          message: response.message || 'Credenciales inválidas',
        };
      }

      // Mapear usuario de API a formato del frontend
      const user = mapApiUserToFrontendUser(response.user);

      // Guardar usuario en localStorage para acceso rápido
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

      // Calcular días hasta expiración si hay advertencia
      const daysUntilExpiry = response.passwordExpiryWarning?.daysUntilExpiry;

      return {
        success: true,
        user,
        token: response.token,
        message: response.message || 'Inicio de sesión exitoso',
        daysUntilExpiry,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
      };
    }
  }

  /**
   * Cierra sesión del usuario
   */
  static async logout(): Promise<void> {
    try {
      // Llamar API de logout
      await authApi.logout();

      // Limpiar datos locales
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      // Aún así limpiar datos locales
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  /**
   * Obtiene el usuario actual
   * ⚠️ CRÍTICO: Esta función solo LEE, NO debe eliminar tokens
   */
  static getCurrentUser(): User | null {
    try {
      // 🔒 CRÍTICO: NO llamar a logout() aquí - solo es una función de lectura
      // Verificar si hay token válido
      if (!authApi.hasValidToken()) {
        return null; // Simplemente retornar null, NO hacer logout
      }

      // Intentar obtener usuario del localStorage
      const userJson = localStorage.getItem(this.USER_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        return user;
      }

      // Si no hay usuario guardado pero hay token, intentar extraer del token
      const tokenUser = authApi.getUserFromToken();
      if (tokenUser) {
        const user = mapApiUserToFrontendUser(tokenUser);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        return user;
      }

      return null;
    } catch (error) {
      return null; // Simplemente retornar null, NO hacer logout
    }
  }

  /**
   * Obtiene los permisos del usuario basado en su rol
   */
  static getPermissions(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    const rolePermissions: Record<string, string[]> = {
      imaging_technician: [
        'read:imaging_studies', 'write:imaging_studies',
        'read:appointments', 'update:imaging_status',
        'read:laboratory', 'write:laboratory',
        'read:lab_reports',
      ],
      external_client: [
        'read:own_lab_requests',
        'read:own_lab_results',
      ],
    };

    return rolePermissions[user.role] || [];
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  static hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    try {
      const response = await authApi.changePassword({ currentPassword, newPassword });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar contraseña',
      };
    }
  }

  /**
   * Cambia la contraseña cuando ha expirado
   */
  static async changeExpiredPassword(email: string, currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    try {
      const response = await authApi.changeExpiredPassword({ email, currentPassword, newPassword });
      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar contraseña',
      };
    }
  }
}

export default ApiAuthService;
