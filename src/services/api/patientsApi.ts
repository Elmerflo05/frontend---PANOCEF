/**
 * API Service para Pacientes
 * Maneja todas las operaciones CRUD de pacientes con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface PatientFilters {
  branch_id?: number;
  search?: string;
  company_id?: number;
  page?: number;
  limit?: number;
}

export interface PatientData {
  patient_id?: number;
  branch_id?: number;  // ✅ OPCIONAL - Los pacientes NO están asignados a una sede específica
  identification_type_id: number;
  identification_number: string;
  first_name: string;
  last_name: string;
  second_last_name?: string;
  birth_date: string;
  gender_id: number;
  blood_type_id?: number;
  blood_type_name?: string;  // Nombre del tipo de sangre (viene del JOIN con blood_types)
  marital_status_id?: number;
  mobile: string;
  phone?: string;
  email?: string;
  password?: string;  // Contraseña personalizada para el usuario (opcional)
  address?: string;
  city?: string;      // Distrito/Ciudad
  state?: string;     // Departamento/Estado
  district?: string;  // Alias de city (compatibilidad)
  province?: string;
  department?: string; // Alias de state (compatibilidad)
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  allergies?: string;
  chronic_diseases?: string;
  current_medications?: string;
  family_history?: string;
  insurance_company?: string;
  insurance_policy_number?: string;
  company_id?: number;
  ruc?: string;
  business_name?: string;
  notes?: string;
  referral_source?: string;
  is_active?: boolean;
  is_basic_registration?: boolean;  // true = registro básico incompleto
  completed_at?: string;            // Fecha cuando se completó la información
  profile_photo_url?: string;
  user_id_registration?: number;
  registration_date?: string;
  created_at?: string;
  updated_at?: string;
  // Campos alternativos que PostgreSQL puede devolver
  date_time_registration?: string;
  date_time_modification?: string;
  // Plan de salud activo del paciente
  active_health_plan_id?: number;
  health_plan_name?: string;
  health_plan_code?: string;
  health_plan_type?: string;
  // Estado de cliente nuevo/continuador
  is_new_client?: boolean;
}

export interface PatientsListResponse {
  success: boolean;
  data: PatientData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PatientResponse {
  success: boolean;
  data: PatientData;
  message?: string;
}

class PatientsApiService {
  /**
   * Obtiene todos los pacientes con filtros y paginación
   */
  async getPatients(filters?: PatientFilters): Promise<PatientsListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.company_id) params.append('company_id', filters.company_id.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/patients${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<PatientsListResponse>(endpoint);

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
   * Obtiene un paciente por su ID
   */
  async getPatientById(patientId: number): Promise<PatientResponse> {
    try {
      const response = await httpClient.get<PatientResponse>(`/patients/${patientId}`);

      if (!response.success || !response.data) {
        throw new Error('Paciente no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo paciente
   */
  async createPatient(patientData: PatientData): Promise<PatientResponse> {
    try {
      const response = await httpClient.post<PatientResponse>('/patients', patientData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear paciente');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un paciente existente
   */
  async updatePatient(patientId: number, patientData: Partial<PatientData>): Promise<PatientResponse> {
    try {
      const response = await httpClient.put<PatientResponse>(`/patients/${patientId}`, patientData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar paciente');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un paciente
   */
  async deletePatient(patientId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/patients/${patientId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar paciente');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca pacientes por texto (búsqueda rápida)
   */
  async searchPatients(searchTerm: string, branchId?: number): Promise<PatientData[]> {
    try {
      const response = await this.getPatients({
        search: searchTerm,
        branch_id: branchId,
        limit: 50 // Límite mayor para búsquedas
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene pacientes accesibles por sede
   * Incluye pacientes registrados en la sede Y pacientes que tienen citas en esa sede
   * Esto permite ver pacientes que se atienden en una sede aunque estén registrados en otra
   */
  async getAccessiblePatients(filters?: PatientFilters): Promise<PatientsListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/patients/accessible${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<PatientsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: filters?.page || 1,
          limit: filters?.limit || 1000,
          totalPages: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca un paciente por su DNI (identification_number)
   * Útil para el laboratorio de imágenes al crear solicitudes
   * @param dni - Número de documento (8 dígitos)
   * @returns Datos del paciente si existe, o null si no se encuentra
   */
  async searchByDni(dni: string): Promise<{
    found: boolean;
    patient: {
      patient_id: number;
      dni: string;
      nombres: string;
      apellidos: string;
      email: string;
      telefono: string;
      edad: string;
      branch_id: number | null;
      branch_name: string | null;
    } | null;
  }> {
    try {
      // Validar DNI antes de enviar
      if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
        return { found: false, patient: null };
      }

      const response = await httpClient.get<{
        success: boolean;
        found: boolean;
        message: string;
        data: {
          patient_id: number;
          dni: string;
          nombres: string;
          apellidos: string;
          email: string;
          telefono: string;
          edad: string;
          branch_id: number | null;
          branch_name: string | null;
        } | null;
      }>(`/patients/search/dni/${dni}`);

      return {
        found: response.found || false,
        patient: response.data || null
      };
    } catch (error) {
      console.error('Error al buscar paciente por DNI:', error);
      return { found: false, patient: null };
    }
  }

  /**
   * Verifica si ya existe un paciente con el DNI o email proporcionado
   * @returns Objeto con información sobre duplicados encontrados
   */
  async checkDuplicates(dni?: string, email?: string): Promise<{
    dniExists: boolean;
    emailExists: boolean;
    existingPatients: PatientData[];
  }> {
    try {
      const existingPatients: PatientData[] = [];
      let dniExists = false;
      let emailExists = false;

      // Verificar DNI si se proporciona
      if (dni && dni.trim() !== '') {
        const dniResults = await this.searchPatients(dni.trim());
        const exactDniMatch = dniResults.find(
          p => p.identification_number === dni.trim()
        );
        if (exactDniMatch) {
          dniExists = true;
          existingPatients.push(exactDniMatch);
        }
      }

      // Verificar email si se proporciona
      if (email && email.trim() !== '') {
        const emailResults = await this.searchPatients(email.trim());
        const exactEmailMatch = emailResults.find(
          p => p.email?.toLowerCase() === email.trim().toLowerCase()
        );
        if (exactEmailMatch && !existingPatients.find(p => p.patient_id === exactEmailMatch.patient_id)) {
          emailExists = true;
          existingPatients.push(exactEmailMatch);
        }
      }

      return {
        dniExists,
        emailExists,
        existingPatients
      };
    } catch (error) {
      // En caso de error, asumir que no hay duplicados para no bloquear el flujo
      return {
        dniExists: false,
        emailExists: false,
        existingPatients: []
      };
    }
  }
}

// Exportar instancia singleton
export const patientsApi = new PatientsApiService();
export default patientsApi;
