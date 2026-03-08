/**
 * API Service para Radiografía
 * Maneja solicitudes de radiografía con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

/**
 * Datos del paciente para el formulario PanoCef
 */
export interface PanoCefPatientData {
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  fechaNacimiento?: string;
  edad?: number;
}

/**
 * Datos del doctor para el formulario PanoCef
 */
export interface PanoCefDoctorData {
  nombre: string;
  especialidad?: string;
  colegiatura?: string;
  telefono?: string;
}

/**
 * Datos de Tomografía 3D para el formulario PanoCef
 */
export interface PanoCefTomografia3DData {
  // Opciones generales
  conInforme: boolean;
  sinInforme: boolean;
  dicom: boolean;
  soloUsb: boolean;
  // Opciones específicas
  endodoncia: boolean;
  fracturaRadicular: boolean;
  anatomiaEndodontica: boolean;
  localizacionDiente: boolean;
  implantes: boolean;
  maxilarSuperior: boolean;
  viaAerea: boolean;
  ortognatica: boolean;
  marpe: boolean;
  miniImplantes: boolean;
  atm: boolean;
  macizoFacial: boolean;
  // Campos de texto
  zonaInteres?: string;
  indicacionClinica?: string;
}

/**
 * Datos de Radiografías para el formulario PanoCef
 */
export interface PanoCefRadiografiasData {
  // Intraorales
  periapical: boolean;
  periapicalTipo?: 'fisico' | 'digital';
  periapicalCantidad?: number;
  bitewingAmbos: boolean;
  bitewingDerecho: boolean;
  bitewingIzquierdo: boolean;
  bitewingTipo?: 'fisico' | 'digital';
  oclusalSuperiores: boolean;
  oclusalSuperioresTipo?: 'fisico' | 'digital';
  oclusalInferiores: boolean;
  oclusalInferioresTipo?: 'fisico' | 'digital';
  seriada: boolean;
  seriadaTipo?: 'fisico' | 'digital';

  // Extraorales
  panoramica: boolean;
  panoramicaTipo?: 'fisico' | 'digital';
  cefalometricaLateral: boolean;
  cefalometricaLateralTipo?: 'fisico' | 'digital';
  carpal: boolean;
  carpalTipo?: 'fisico' | 'digital';
  carpalFishman: boolean;
  carpalTtw2: boolean;
  posteriorAnterior: boolean;
  posteriorAnteriorTipo?: 'fisico' | 'digital';
  posteriorAnteriorRicketts: boolean;
  atmBocaAbierta: boolean;
  atmBocaAbiertaTipo?: 'fisico' | 'digital';
  atmBocaCerrada: boolean;
  atmBocaCerradaTipo?: 'fisico' | 'digital';

  // Fotografías
  fotografiaIntraoral: boolean;
  fotografiaExtraoral: boolean;

  // Ortodoncia
  ortodonciaTipo?: 'paquete' | 'individual';
  ortodonciaPaquete?: number;
  ortodonciaAlineadores?: boolean;
  ortodonciaEscaneo?: boolean;
  ortodonciaImpresion?: boolean;
  ortodonciaPlanTratamiento?: 'sin' | 'con';

  // Análisis cefalométricos
  analisisCefalometrico: boolean;
  analisisSteiner: boolean;
  analisisRicketts: boolean;
  analisisMcNamara: boolean;
  analisisJarabak: boolean;
  analisisBjork: boolean;
  analisisUspTweed: boolean;
}

/**
 * Datos completos del formulario PanoCef (request_data)
 */
export interface PanoCefRequestData {
  patient: PanoCefPatientData;
  doctor: PanoCefDoctorData;
  tomografia3D: PanoCefTomografia3DData;
  radiografias: PanoCefRadiografiasData;
}

/**
 * Item del desglose de precios
 */
export interface PanoCefPriceBreakdownItem {
  category: 'intraoral' | 'extraoral' | 'ortodoncias' | 'analisis' | 'tomografia3D';
  subcategory?: string;
  itemName: string;
  itemKey: string;
  basePrice: number;
  quantity: number;
  subtotal: number;
}

/**
 * Datos de pricing para el formulario PanoCef (pricing_data)
 */
export interface PanoCefPricingData {
  breakdown: PanoCefPriceBreakdownItem[];
  suggestedPrice: number;
  finalPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: string;
  discountPercentage?: number;
  discountReason?: string;
}

export interface RadiographyRequestData {
  request_id?: number;
  radiography_request_id?: number; // Alias para compatibilidad con backend
  patient_id?: number | null;  // Opcional para solicitudes PanoCef (datos en request_data)
  dentist_id?: number | null;  // Opcional para solicitudes PanoCef (datos en request_data)
  branch_id?: number | null;   // Opcional, default 1 en BD
  consultation_id?: number;
  request_date: string;
  requested_exam_date?: string;
  actual_exam_date?: string;
  radiography_type: string;
  request_status?: string;
  urgency?: string;
  clinical_diagnosis?: string;
  clinical_observations?: string;
  clinical_indication?: string;
  area_of_interest?: string;
  interpretation?: string;
  findings?: string;
  recommendations?: string;
  radiology_file_url?: string;
  image_url?: string;
  notes?: string;
  // Campos JSONB para datos complejos del formulario PanoCef
  request_data?: PanoCefRequestData;
  pricing_data?: PanoCefPricingData;
  // Campos de auditoría
  user_id_registration?: number;
  date_time_registration?: string;
  user_id_modification?: number;
  date_time_modification?: string;
  created_at?: string;
  updated_at?: string;
  // Campos relacionados (joins)
  patient_name?: string;
  dentist_name?: string;
  branch_name?: string;
}

export interface RadiographyFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  consultation_id?: number;
  radiography_type?: string;
  request_status?: string;
  urgency?: string;
  date_from?: string;
  date_to?: string;
  source?: 'internal' | 'external'; // Filtrar por origen: 'internal' (personal interno) | 'external' (external_client)
  page?: number;
  limit?: number;
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

export interface RadiographyRequestResponse {
  success: boolean;
  data: RadiographyRequestData;
  message?: string;
}

/**
 * Datos de un resultado de radiografía
 */
export interface RadiographyResult {
  result_id: number;
  radiography_request_id: number;
  result_type: 'image' | 'document' | 'external_link';
  file_name?: string;
  original_name?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  external_url?: string;
  uploaded_by?: number;
  uploaded_at: string;
  uploader_name?: string;
  status: string;
}

/**
 * Respuesta de subida de resultados
 */
export interface UploadResultsResponse {
  success: boolean;
  message?: string;
  data: {
    results: RadiographyResult[];
    counts: {
      image: number;
      document: number;
      external_link: number;
      total: number;
    };
  };
}

/**
 * Respuesta de obtener resultados
 */
export interface GetResultsResponse {
  success: boolean;
  data: {
    results: RadiographyResult[];
    counts: {
      image: number;
      document: number;
      external_link: number;
      total: number;
    };
  };
}

/**
 * Datos de un pago externo de laboratorio
 */
export interface ExternalPaymentData {
  payment_id: number;
  radiography_request_id: number;
  branch_id: number;
  branch_name?: string;
  amount: number;
  final_price: number;
  payment_status: 'pending' | 'paid';
  set_price_by_user_id?: number;
  set_price_by_name?: string;
  set_price_at?: string;
  paid_by_user_id?: number;
  paid_by_name?: string;
  paid_at?: string;
  notes?: string;
  date_time_registration?: string;
  // Datos de la solicitud de radiografia
  radiography_type?: string;
  request_data?: PanoCefRequestData;
}

/**
 * Respuesta de obtener todos los pagos externos
 */
export interface ExternalPaymentsResponse {
  success: boolean;
  data: ExternalPaymentData[];
  total: number;
}

class RadiographyApiService {
  /**
   * Obtiene todas las solicitudes de radiografía con filtros y paginación
   */
  async getRadiographyRequests(filters?: RadiographyFilters): Promise<RadiographyRequestsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.consultation_id) params.append('consultation_id', filters.consultation_id.toString());
      if (filters?.radiography_type) params.append('radiography_type', filters.radiography_type);
      if (filters?.request_status) params.append('request_status', filters.request_status);
      if (filters?.urgency) params.append('urgency', filters.urgency);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.source) params.append('source', filters.source);
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
   * Obtiene una solicitud de radiografía por su ID
   */
  async getRadiographyRequestById(requestId: number): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.get<RadiographyRequestResponse>(`/radiography/${requestId}`);

      if (!response.success || !response.data) {
        throw new Error('Solicitud de radiografía no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva solicitud de radiografía
   */
  async createRadiographyRequest(requestData: RadiographyRequestData): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.post<RadiographyRequestResponse>('/radiography', requestData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear solicitud de radiografía');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una solicitud de radiografía existente
   */
  async updateRadiographyRequest(requestId: number, requestData: Partial<RadiographyRequestData>): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.put<RadiographyRequestResponse>(`/radiography/${requestId}`, requestData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar solicitud de radiografía');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una solicitud de radiografía
   */
  async deleteRadiographyRequest(requestId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/radiography/${requestId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar solicitud de radiografía');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aprobar cotización de precio (para external_client)
   */
  async approvePricing(requestId: number): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.post<RadiographyRequestResponse>(
        `/radiography/${requestId}/approve-pricing`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al aprobar cotización');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rechazar cotización de precio (para external_client)
   */
  async rejectPricing(requestId: number, reason?: string): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.post<RadiographyRequestResponse>(
        `/radiography/${requestId}/reject-pricing`,
        { reason: reason || 'No especificado' }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al rechazar cotización');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enviar contraoferta de precio (solo para técnico de imagen)
   * @param requestId - ID de la solicitud de radiografía
   * @param counterOfferPrice - Precio de la contraoferta
   */
  async submitCounterOffer(requestId: number, counterOfferPrice: number): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.post<RadiographyRequestResponse>(
        `/radiography/${requestId}/counter-offer`,
        { counterOfferPrice }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al enviar contraoferta');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marcar solicitud como entregada (cuando el cliente visualiza los resultados)
   * Transición automática: completed -> delivered
   * @param requestId - ID de la solicitud de radiografía
   */
  async markAsDelivered(requestId: number): Promise<RadiographyRequestResponse> {
    try {
      const response = await httpClient.post<RadiographyRequestResponse>(
        `/radiography/${requestId}/mark-delivered`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al marcar como entregada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Subir resultados de radiografía (imágenes, documentos, enlaces externos)
   * @param requestId - ID de la solicitud de radiografía
   * @param files - Array de archivos (imágenes y documentos)
   * @param externalLinks - Array de URLs externas
   */
  async uploadResults(
    requestId: number,
    files: File[],
    externalLinks: string[]
  ): Promise<UploadResultsResponse> {
    try {
      const formData = new FormData();

      // Agregar archivos al FormData
      files.forEach(file => {
        formData.append('files', file);
      });

      // Agregar enlaces externos como JSON
      if (externalLinks.length > 0) {
        formData.append('externalLinks', JSON.stringify(externalLinks));
      }

      // NO establecer Content-Type manualmente - el navegador lo hace automáticamente
      // con el boundary correcto para multipart/form-data
      const response = await httpClient.post<UploadResultsResponse>(
        `/radiography/${requestId}/upload-results`,
        formData
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al subir resultados');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener resultados de una solicitud de radiografía
   * @param requestId - ID de la solicitud de radiografía
   */
  async getResults(requestId: number): Promise<GetResultsResponse> {
    try {
      const response = await httpClient.get<GetResultsResponse>(
        `/radiography/${requestId}/results`
      );

      if (!response.success) {
        throw new Error('Error al obtener resultados');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Establecer precio final para solicitud externa (solo tecnico de imagen)
   * Crea registro en laboratory_external_payments
   * @param requestId - ID de la solicitud de radiografia
   * @param finalPrice - Precio final a establecer
   * @param notes - Notas opcionales
   */
  async setFinalPrice(requestId: number, finalPrice: number, notes?: string): Promise<ApiResponse> {
    try {
      const response = await httpClient.post<ApiResponse>(
        `/radiography/${requestId}/set-final-price`,
        { finalPrice, notes }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al establecer precio');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Registrar pago de solicitud externa (solo tecnico de imagen)
   * @param requestId - ID de la solicitud de radiografia
   * @param notes - Notas opcionales del pago
   */
  async registerPayment(requestId: number, notes?: string): Promise<ApiResponse> {
    try {
      const response = await httpClient.post<ApiResponse>(
        `/radiography/${requestId}/register-payment`,
        { notes }
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al registrar pago');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener informacion de pago de una solicitud
   * @param requestId - ID de la solicitud de radiografia
   */
  async getPaymentInfo(requestId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.get<ApiResponse>(
        `/radiography/${requestId}/payment`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todos los pagos externos de laboratorio
   * Para admin/recepcionista para ver y gestionar pagos pendientes
   * @param filters - Filtros opcionales (branch_id, payment_status, date_from, date_to)
   */
  async getAllExternalPayments(filters?: {
    branch_id?: number;
    payment_status?: 'pending' | 'paid';
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<ExternalPaymentsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.payment_status) params.append('payment_status', filters.payment_status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/radiography/external-payments${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<ExternalPaymentsResponse>(endpoint);

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const radiographyApi = new RadiographyApiService();
export default radiographyApi;
