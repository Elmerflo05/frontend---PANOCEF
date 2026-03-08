/**
 * API Service para Solicitudes de Radiografía/Tomografía
 * Maneja las operaciones CRUD de solicitudes de exámenes diagnósticos
 */

import httpClient from './httpClient';

export interface RadiographyRequestData {
  radiography_request_id?: number;
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  consultation_id?: number;
  appointment_id?: number;
  request_date?: string;
  radiography_type?: string;
  area_of_interest?: string;
  clinical_indication?: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
  request_status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  request_data?: {
    patientData?: {
      nombre?: string;
      edad?: string;
      dni?: string;
      telefono?: string;
      motivoConsulta?: string;
    };
    doctorData?: {
      doctor?: string;
      cop?: string;
      direccion?: string;
      email?: string;
      telefono?: string;
    };
    tomografia3D?: any;
    radiografias?: any;
  };
  pricing_data?: {
    breakdown?: Array<{ service: string; price: number }>;
    subtotal?: number;
    suggestedPrice?: number;
    finalPrice?: number | null;
    status?: string;
  };
}

export interface RadiographyRequestResponse {
  success: boolean;
  data: RadiographyRequestData;
  message?: string;
  wasUpdated?: boolean;
}

export interface RadiographyRequestsListResponse {
  success: boolean;
  data: RadiographyRequestData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class RadiographyRequestsApiService {
  /**
   * Obtiene todas las solicitudes con filtros
   */
  async getRequests(filters?: {
    patient_id?: number;
    dentist_id?: number;
    consultation_id?: number;
    request_status?: string;
    page?: number;
    limit?: number;
  }): Promise<RadiographyRequestsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.consultation_id) params.append('consultation_id', filters.consultation_id.toString());
      if (filters?.request_status) params.append('request_status', filters.request_status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/radiography${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<RadiographyRequestsListResponse>(endpoint);

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
   * Obtiene una solicitud por ID
   */
  async getRequestById(requestId: number): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.get<RadiographyRequestResponse>(`/radiography/${requestId}`);

      if (!response.success || !response.data) {
        throw new Error('Solicitud no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upsert de solicitud: Crea o actualiza según consultation_id
   * Si ya existe una solicitud con el mismo consultation_id, la actualiza.
   * Si no existe, crea una nueva y notifica a los técnicos.
   */
  async upsertRequest(requestData: RadiographyRequestData): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.post<RadiographyRequestResponse>('/radiography/upsert', requestData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al procesar solicitud');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva solicitud
   */
  async createRequest(requestData: RadiographyRequestData): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.post<RadiographyRequestResponse>('/radiography', requestData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear solicitud');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una solicitud existente
   */
  async updateRequest(requestId: number, requestData: Partial<RadiographyRequestData>): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.put<RadiographyRequestResponse>(`/radiography/${requestId}`, requestData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar solicitud');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene solicitudes de un paciente
   */
  async getPatientRequests(patientId: number): Promise<RadiographyRequestData[]> {
    try {
      const response = await this.getRequests({ patient_id: patientId, limit: 100 });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene solicitud por consultation_id
   */
  async getRequestByConsultation(consultationId: number): Promise<RadiographyRequestData | null> {
    try {
      const response = await this.getRequests({ consultation_id: consultationId, limit: 1 });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const radiographyRequestsApi = new RadiographyRequestsApiService();
export default radiographyRequestsApi;
