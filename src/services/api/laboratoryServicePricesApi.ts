/**
 * API Service: Laboratory Service Prices
 *
 * Servicio para gestión de precios de servicios de laboratorio.
 * Consume la nueva API normalizada /api/laboratory/service-prices
 *
 * Mantiene compatibilidad con formato legacy del frontend existente.
 */

import httpClient from './httpClient';

// ============================================
// TIPOS E INTERFACES
// ============================================

/**
 * Estructura de un servicio de laboratorio con precio
 */
export interface LaboratoryServicePrice {
  service_price_id: number;
  service_code: string;
  service_name: string;
  service_category: 'tomografia3d' | 'radiografias';
  service_subcategory: string | null;
  base_price: number;
  currency: string;
  has_quantity: boolean;
  quantity_unit: string | null;
  has_options: boolean;
  options_config: Record<string, unknown> | null;
  legacy_field_name: string | null;
  description: string | null;
  help_text: string | null;
  is_active: boolean;
  display_order: number;
}

/**
 * Formato legacy de precios de Tomografía 3D
 * Compatible con el hook useTomografia3DPricing
 */
export interface Tomografia3DPricingLegacy {
  // Tipo de Entrega
  conInforme: number;
  sinInforme: number;
  dicom: number;
  soloUsb: number;
  // Campo Pequeño
  endodoncia: number;
  fracturaRadicular: number;
  anatomiaEndodontica: number;
  // Campo Mediano
  localizacionDiente: number;
  implantes: number;
  maxilarSuperior: number;
  // Campo Mediano/Grande
  viaAerea: number;
  ortognatica: number;
  // Ortodoncia
  marpe: number;
  miniImplantes: number;
  // Otras Opciones
  atm: number;
  macizoFacial: number;
}

/**
 * Formato legacy de precios de Radiografías
 * Compatible con el hook useRadiografiasPricing
 *
 * NOTA: Incluye campos legacy (para BD existente) + campos nuevos del UI
 */
export interface RadiografiasPricingLegacy {
  // Intraorales - Periapical
  periapicalFisico: number;
  periapicalDigital: number;

  // Bitewing - Campos legacy
  bitewingAmbos: number;
  bitewingDerecho: number;
  bitewingIzquierdo: number;
  // Bitewing - Campos nuevos UI
  bitewingMolares: number;
  bitewingPremolares: number;

  // Oclusal
  oclusalSuperiores: number;
  oclusalInferiores: number;

  // Otras Intraorales
  seriada: number;
  radiografias: number;
  // Fotografias - Campos nuevos UI
  fotografiaIntraoral: number;
  fotografiaExtraoral: number;

  // Extraorales - Campos legacy
  halografiaPanoramica: number;
  halografiaLateral: number;
  halografiaPosterior: number;
  estudiosAtm: number;
  radiografiaCefalometrica: number;
  // Extraorales - Campos nuevos UI (alias)
  panoramica: number;
  cefalometrica: number;
  carpal: number;
  posteriorAnterior: number;
  atmAbierta: number;
  atmCerrada: number;

  // Asesoría Ortodoncia P1
  paq1ConAsesoria: number;
  paq1SinAsesoria: number;
  // Asesoría Ortodoncia P2
  paq2ConAsesoria: number;
  paq2SinAsesoria: number;
  // Asesoría Ortodoncia P3
  paq3ConAsesoria: number;
  paq3SinAsesoria: number;

  // Servicios Adicionales - Campos legacy
  alteracionesInmediatas: number;
  escaneoImpresionDigital: number;
  modelosEstudio3d: number;
  // Servicios Adicionales - Campos nuevos UI
  alineadores: number;
  escaneoIntraoral: number;
  modelosDigitales: number;

  // Análisis Cefalométricos - Campos legacy
  ricketts: number;
  powell: number;
  nordEstelametal: number;
  steinerBianco: number;
  steiner: number;
  bjork: number;
  mcNamara: number;
  usp: number;
  especificarOtros: number;
  // Análisis Cefalométricos - Campos nuevos UI
  schwartz: number;
  tweed: number;
  downs: number;
  bjorks: number;
  rotJarabak: number;
  tejidosBlancos: number;
}

/**
 * Respuesta de la API para lista de servicios
 */
interface ServicePricesListResponse {
  success: boolean;
  data: LaboratoryServicePrice[];
  count?: number;
}

/**
 * Respuesta de la API para formato legacy
 */
interface LegacyPricingResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Respuesta combinada de todos los precios
 */
interface AllPricingResponse {
  success: boolean;
  data: {
    tomografia3d: Tomografia3DPricingLegacy;
    radiografias: RadiografiasPricingLegacy;
  };
}

/**
 * Estadísticas de servicios
 */
interface ServiceStats {
  tomografia3d: number;
  radiografias: number;
  total: number;
}

// ============================================
// CLASE DEL SERVICIO API
// ============================================

class LaboratoryServicePricesApi {
  private readonly baseUrl = '/laboratory/service-prices';

  // ============================================
  // MÉTODOS DE LECTURA
  // ============================================

  /**
   * Obtiene todos los servicios con sus precios
   */
  async getAllServicePrices(
    category?: 'tomografia3d' | 'radiografias',
    subcategory?: string
  ): Promise<LaboratoryServicePrice[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (subcategory) params.append('subcategory', subcategory);

    const queryString = params.toString();
    const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.get<ServicePricesListResponse>(url);

    if (!response.success) {
      throw new Error('Error al obtener precios de servicios');
    }

    return response.data;
  }

  /**
   * Obtiene precios de Tomografía 3D en formato legacy
   * Compatible con useTomografia3DPricing hook
   */
  async getTomografia3DPricing(): Promise<Tomografia3DPricingLegacy> {
    const response = await httpClient.get<LegacyPricingResponse<Tomografia3DPricingLegacy>>(
      `${this.baseUrl}/tomografia3d`
    );

    if (!response.success || !response.data) {
      throw new Error('Error al obtener precios de Tomografía 3D');
    }

    return response.data;
  }

  /**
   * Obtiene precios de Radiografías en formato legacy
   * Compatible con useRadiografiasPricing hook
   */
  async getRadiografiasPricing(): Promise<RadiografiasPricingLegacy> {
    const response = await httpClient.get<LegacyPricingResponse<RadiografiasPricingLegacy>>(
      `${this.baseUrl}/radiografias`
    );

    if (!response.success || !response.data) {
      throw new Error('Error al obtener precios de Radiografías');
    }

    return response.data;
  }

  /**
   * Obtiene todos los precios en formato legacy (ambas categorías)
   */
  async getAllPricing(): Promise<{
    tomografia3d: Tomografia3DPricingLegacy;
    radiografias: RadiografiasPricingLegacy;
  }> {
    const response = await httpClient.get<AllPricingResponse>(`${this.baseUrl}/all`);

    if (!response.success || !response.data) {
      throw new Error('Error al obtener precios');
    }

    return response.data;
  }

  /**
   * Obtiene un servicio por su código
   */
  async getServiceByCode(serviceCode: string): Promise<LaboratoryServicePrice> {
    const response = await httpClient.get<{
      success: boolean;
      data: LaboratoryServicePrice;
    }>(`${this.baseUrl}/code/${serviceCode}`);

    if (!response.success || !response.data) {
      throw new Error('Servicio no encontrado');
    }

    return response.data;
  }

  /**
   * Obtiene estadísticas de servicios
   */
  async getStats(): Promise<ServiceStats> {
    const response = await httpClient.get<{
      success: boolean;
      data: ServiceStats;
    }>(`${this.baseUrl}/stats`);

    if (!response.success || !response.data) {
      throw new Error('Error al obtener estadísticas');
    }

    return response.data;
  }

  /**
   * Obtiene servicios en formato estructurado (con metadatos completos)
   */
  async getTomografia3DStructured(): Promise<LaboratoryServicePrice[]> {
    const response = await httpClient.get<ServicePricesListResponse>(
      `${this.baseUrl}/tomografia3d?format=structured`
    );

    if (!response.success) {
      throw new Error('Error al obtener servicios de Tomografía 3D');
    }

    return response.data;
  }

  /**
   * Obtiene servicios de radiografías en formato estructurado
   */
  async getRadiografiasStructured(): Promise<LaboratoryServicePrice[]> {
    const response = await httpClient.get<ServicePricesListResponse>(
      `${this.baseUrl}/radiografias?format=structured`
    );

    if (!response.success) {
      throw new Error('Error al obtener servicios de Radiografías');
    }

    return response.data;
  }

  // ============================================
  // MÉTODOS DE ESCRITURA (Solo super_admin)
  // ============================================

  /**
   * Actualiza precios de Tomografía 3D (bulk)
   * Solo accesible por super_admin
   */
  async updateTomografia3DPricing(
    pricing: Partial<Tomografia3DPricingLegacy>
  ): Promise<Tomografia3DPricingLegacy> {
    const response = await httpClient.put<LegacyPricingResponse<Tomografia3DPricingLegacy>>(
      `${this.baseUrl}/tomografia3d`,
      pricing
    );

    if (!response.success || !response.data) {
      throw new Error('Error al actualizar precios de Tomografía 3D');
    }

    return response.data;
  }

  /**
   * Actualiza precios de Radiografías (bulk)
   * Solo accesible por super_admin
   */
  async updateRadiografiasPricing(
    pricing: Partial<RadiografiasPricingLegacy>
  ): Promise<RadiografiasPricingLegacy> {
    const response = await httpClient.put<LegacyPricingResponse<RadiografiasPricingLegacy>>(
      `${this.baseUrl}/radiografias`,
      pricing
    );

    if (!response.success || !response.data) {
      throw new Error('Error al actualizar precios de Radiografías');
    }

    return response.data;
  }

  /**
   * Actualiza un servicio específico por ID
   */
  async updateServicePrice(
    servicePriceId: number,
    data: {
      base_price?: number;
      description?: string;
      help_text?: string;
      is_active?: boolean;
      options_config?: Record<string, unknown>;
    }
  ): Promise<LaboratoryServicePrice> {
    const response = await httpClient.put<{
      success: boolean;
      data: LaboratoryServicePrice;
      message?: string;
    }>(`${this.baseUrl}/${servicePriceId}`, data);

    if (!response.success || !response.data) {
      throw new Error('Error al actualizar precio del servicio');
    }

    return response.data;
  }

  /**
   * Actualiza un servicio específico por código
   */
  async updatePriceByCode(
    serviceCode: string,
    basePrice: number
  ): Promise<LaboratoryServicePrice> {
    const response = await httpClient.put<{
      success: boolean;
      data: LaboratoryServicePrice;
      message?: string;
    }>(`${this.baseUrl}/code/${serviceCode}`, { base_price: basePrice });

    if (!response.success || !response.data) {
      throw new Error('Error al actualizar precio del servicio');
    }

    return response.data;
  }
}

// Exportar instancia singleton
export const laboratoryServicePricesApi = new LaboratoryServicePricesApi();
export default laboratoryServicePricesApi;
