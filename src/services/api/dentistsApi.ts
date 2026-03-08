/**
 * API Service para Dentistas
 * Maneja todas las operaciones CRUD de dentistas, horarios y excepciones
 */

import httpClient, { ApiResponse } from './httpClient';

export interface DentistFilters {
  branch_id?: number;
  specialty_id?: number;
  is_active?: boolean;
  include_inactive?: boolean; // true para incluir suspendidos en gestión
  search?: string;
  page?: number;
  limit?: number;
}

export interface DentistScheduleData {
  schedule_id?: number;
  dentist_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  branch_id?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DentistExceptionData {
  exception_id?: number;
  dentist_id: number;
  exception_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  is_available?: boolean;
  created_at?: string;
}

export interface DentistData {
  dentist_id?: number;
  user_id?: number;
  branch_id?: number | null; // NULLABLE: Los médicos usan branches_access
  branches_access?: number[]; // Array de IDs de sedes con acceso
  specialty_id?: number;
  license_number?: string; // Campo legacy
  professional_license?: string; // Campo real de la BD (COP)
  license_country?: string;
  license_expiry_date?: string;
  bio?: string;
  years_of_experience?: number;
  years_experience?: number; // Alias para compatibilidad con backend
  education?: string;
  certifications?: string;
  consultation_fee?: number;
  commission_percentage?: number;
  is_active?: boolean;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Campos reales de la BD (la tabla dentists usa estos nombres)
  date_time_registration?: string;
  date_time_modification?: string;
  dni?: string;
  address?: string;
  photo_url?: string;
  profile?: {
    dni?: string;
  };

  // Datos relacionados (joins)
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  specialty_name?: string;
  branch_name?: string;
  schedules?: DentistScheduleData[];
  exceptions?: DentistExceptionData[];
  specialties?: Array<{ specialty_id: number; specialty_name: string }> | number[]; // Array de especialidades (objetos o IDs)
}

export interface CompleteDentistData {
  // Datos del usuario
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  dni: string;
  password?: string;
  // branch_id NO se usa para médicos (solo para admins)
  branches_access: number[]; // Array de IDs de sedes con acceso (REQUERIDO)

  // Datos del dentista
  specialty_id?: number;
  professional_license: string;
  license_country?: string;
  license_expiry_date?: string;
  bio?: string;
  years_experience?: number;
  consultation_fee?: number;

  // Horarios (opcional)
  schedules?: Array<{
    branch_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  }>;
}

export interface DentistsListResponse {
  success: boolean;
  data: DentistData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DentistResponse {
  success: boolean;
  data: DentistData;
  message?: string;
}

export interface ScheduleResponse {
  success: boolean;
  data: DentistScheduleData;
  message?: string;
}

export interface ExceptionResponse {
  success: boolean;
  data: DentistExceptionData;
  message?: string;
}

export interface ExceptionsListResponse {
  success: boolean;
  data: DentistExceptionData[];
}

class DentistsApiService {
  /**
   * Obtiene todos los dentistas con filtros y paginación
   */
  async getDentists(filters?: DentistFilters): Promise<DentistsListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.specialty_id) params.append('specialty_id', filters.specialty_id.toString());
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
      if (filters?.include_inactive) params.append('include_inactive', 'true');
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/dentists${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<DentistsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          totalPages: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un dentista por su ID
   */
  async getDentistById(dentistId: number): Promise<DentistResponse> {
    try {
      const response = await httpClient.get<DentistResponse>(`/dentists/${dentistId}`);

      if (!response.success || !response.data) {
        throw new Error('Dentista no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo dentista
   */
  async createDentist(dentistData: DentistData): Promise<DentistResponse> {
    try {
      const response = await httpClient.post<DentistResponse>('/dentists', dentistData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear dentista');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un médico completo (usuario + dentista + horarios) de forma atómica
   */
  async createCompleteDentist(dentistData: CompleteDentistData): Promise<DentistResponse> {
    try {
      const response = await httpClient.post<DentistResponse>('/dentists/complete', dentistData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear médico');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un dentista existente
   */
  async updateDentist(dentistId: number, dentistData: Partial<DentistData>): Promise<DentistResponse> {
    try {
      const response = await httpClient.put<DentistResponse>(`/dentists/${dentistId}`, dentistData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar dentista');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un dentista
   */
  async deleteDentist(dentistId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/dentists/${dentistId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar dentista');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega un horario a un dentista
   */
  async addSchedule(dentistId: number, scheduleData: DentistScheduleData): Promise<ScheduleResponse> {
    try {
      const response = await httpClient.post<ScheduleResponse>(`/dentists/${dentistId}/schedules`, scheduleData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar horario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un horario
   */
  async updateSchedule(scheduleId: number, scheduleData: Partial<DentistScheduleData>): Promise<ScheduleResponse> {
    try {
      const response = await httpClient.put<ScheduleResponse>(`/dentists/schedules/${scheduleId}`, scheduleData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar horario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un horario
   */
  async deleteSchedule(scheduleId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/dentists/schedules/${scheduleId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar horario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene excepciones de horario de un dentista
   */
  async getExceptions(dentistId: number): Promise<ExceptionsListResponse> {
    try {
      const response = await httpClient.get<ExceptionsListResponse>(`/dentists/${dentistId}/exceptions`);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega una excepción de horario
   */
  async addException(dentistId: number, exceptionData: DentistExceptionData): Promise<ExceptionResponse> {
    try {
      const response = await httpClient.post<ExceptionResponse>(`/dentists/${dentistId}/exceptions`, exceptionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al agregar excepción');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una excepción de horario
   */
  async deleteException(exceptionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/dentists/exceptions/${exceptionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar excepción');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene dentistas activos
   */
  async getActiveDentists(branchId?: number): Promise<DentistData[]> {
    try {
      const filters: DentistFilters = {
        is_active: true,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getDentists(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene dentistas por especialidad
   */
  async getDentistsBySpecialty(specialtyId: number, branchId?: number): Promise<DentistData[]> {
    try {
      const filters: DentistFilters = {
        specialty_id: specialtyId,
        is_active: true,
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getDentists(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los dentistas con sus especialidades (endpoint público)
   */
  async getAllDentists(): Promise<DentistData[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: DentistData[] }>('/public/dentists');
      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene dentistas por sede con sus especialidades (endpoint público)
   */
  async getDentistsByBranch(branchId: number): Promise<DentistData[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: DentistData[] }>(
        `/public/dentists/by-branch/${branchId}`
      );
      return response.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca un dentista por su COP (professional_license)
   * Útil para el laboratorio de imágenes al crear solicitudes
   * @param cop - Número de colegiatura del odontólogo (mínimo 3 caracteres)
   * @returns Datos del dentista si existe, o null si no se encuentra
   */
  async searchByCop(cop: string): Promise<{
    found: boolean;
    dentist: {
      dentist_id: number;
      cop: string;
      nombres: string;
      apellidos: string;
      email: string;
      telefono: string;
      especialidad: string;
      branch_id: number | null;
      branch_name: string | null;
    } | null;
  }> {
    try {
      // Validar COP antes de enviar (mínimo 3 caracteres)
      if (!cop || cop.trim().length < 3) {
        return { found: false, dentist: null };
      }

      const response = await httpClient.get<{
        success: boolean;
        found: boolean;
        message: string;
        data: {
          dentist_id: number;
          cop: string;
          nombres: string;
          apellidos: string;
          email: string;
          telefono: string;
          especialidad: string;
          branch_id: number | null;
          branch_name: string | null;
        } | null;
      }>(`/dentists/search/cop/${encodeURIComponent(cop.trim())}`);

      return {
        found: response.found || false,
        dentist: response.data || null
      };
    } catch (error) {
      console.error('Error al buscar dentista por COP:', error);
      return { found: false, dentist: null };
    }
  }
}

// Exportar instancia singleton
export const dentistsApi = new DentistsApiService();
export default dentistsApi;
