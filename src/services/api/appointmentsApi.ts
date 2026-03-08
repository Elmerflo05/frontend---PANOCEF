/**
 * API Service para Citas
 * Maneja operaciones de consulta de citas con el backend
 */

import httpClient from './httpClient';

export interface AppointmentFilters {
  branch_id?: number;
  dentist_id?: number;
  patient_id?: number;
  appointment_status_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentData {
  appointment_id?: number;
  branch_id: number;
  patient_id: number;
  dentist_id: number;
  specialty_id?: number;
  consultorio_id?: number;
  appointment_date: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  appointment_type?: string;
  reason?: string;
  notes?: string;
  room?: string;
  price?: number;
  payment_method?: string;
  voucher?: string;
  selected_promotion_id?: number;
  appointment_status_id: number;
  status_code?: string;
  confirmed?: boolean;
  confirmed_at?: string;
  confirmed_by?: number;
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  arrived_at?: string;
  completed_at?: string;
  reminder_sent?: boolean;
  reminder_sent_date?: string;
  user_id_registration?: number;
  user_id_modification?: number;
  date_time_registration?: string;
  date_time_modification?: string;
  status?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  identification_number?: string;
  patient_phone?: string;
  patient_mobile?: string;
  patient_email?: string;
  dentist_name?: string;
  appointment_status_name?: string;
  status_color?: string;
  specialty_name?: string;
  branch_name?: string;
  promotion_name?: string;
  discount_percentage?: number;
  reschedule_count?: number;
}

export interface AppointmentsListResponse {
  success: boolean;
  data: AppointmentData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class AppointmentsApiService {
  /**
   * Obtiene todas las citas con filtros y paginacion
   */
  async getAppointments(filters?: AppointmentFilters): Promise<AppointmentsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.appointment_status_id) params.append('appointment_status_id', filters.appointment_status_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/appointments${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<AppointmentsListResponse>(endpoint);

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
}

// Exportar instancia singleton
export const appointmentsApi = new AppointmentsApiService();
export default appointmentsApi;
