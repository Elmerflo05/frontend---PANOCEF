/**
 * API Service para Configuración de la Aplicación
 * Maneja configuraciones globales y por sede del sistema
 */

import httpClient, { ApiResponse } from './httpClient';

export interface AppSettingData {
  setting_id?: number;
  setting_key: string;
  setting_value: string;
  setting_type?: string;
  description?: string;
  is_public?: boolean;
  branch_id?: number;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  branch_name?: string;
}

export interface AppSettingsListResponse {
  success: boolean;
  data: AppSettingData[];
}

export interface AppSettingResponse {
  success: boolean;
  data: AppSettingData;
  message?: string;
}

export interface AppSettingFilters {
  setting_key?: string;
  setting_type?: string;
  is_public?: boolean;
  branch_id?: number;
  limit?: number;
}

class AppSettingsApiService {
  /**
   * Obtiene todas las configuraciones con filtros opcionales
   */
  async getAppSettings(filters?: AppSettingFilters): Promise<AppSettingsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.setting_key) params.append('setting_key', filters.setting_key);
      if (filters?.setting_type) params.append('setting_type', filters.setting_type);
      if (filters?.is_public !== undefined) params.append('is_public', filters.is_public.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/settings${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<AppSettingsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una configuración por su ID
   */
  async getAppSettingById(settingId: number): Promise<AppSettingResponse> {
    try {
      const response = await httpClient.get<AppSettingResponse>(`/settings/${settingId}`);

      if (!response.success || !response.data) {
        throw new Error('Configuración no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una configuración por su clave (key)
   */
  async getAppSettingByKey(settingKey: string, branchId?: number): Promise<AppSettingData | null> {
    try {
      const response = await this.getAppSettings({
        setting_key: settingKey,
        branch_id: branchId,
        limit: 1
      });

      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el valor de una configuración por su clave
   */
  async getSettingValue(settingKey: string, branchId?: number, defaultValue?: string): Promise<string | null> {
    try {
      const setting = await this.getAppSettingByKey(settingKey, branchId);
      return setting ? setting.setting_value : (defaultValue || null);
    } catch (error) {
      return defaultValue || null;
    }
  }

  /**
   * Crea una nueva configuración
   */
  async createAppSetting(settingData: AppSettingData): Promise<AppSettingResponse> {
    try {
      const response = await httpClient.post<AppSettingResponse>('/settings', settingData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear configuración');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una configuración existente
   */
  async updateAppSetting(settingId: number, settingData: Partial<AppSettingData>): Promise<AppSettingResponse> {
    try {
      const response = await httpClient.put<AppSettingResponse>(`/settings/${settingId}`, settingData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar configuración');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza o crea una configuración por su clave (upsert)
   */
  async upsertAppSetting(settingKey: string, settingValue: string, branchId?: number): Promise<AppSettingResponse> {
    try {
      // Intentar actualizar primero usando el endpoint PUT /settings/key/:key
      const updateResponse = await httpClient.put<AppSettingResponse>(`/settings/key/${settingKey}`, {
        setting_value: settingValue
      });

      if (updateResponse.success && updateResponse.data) {
        return updateResponse;
      }

      // Si no existe, crear nueva
      return await this.createAppSetting({
        setting_key: settingKey,
        setting_value: settingValue,
        branch_id: branchId
      });
    } catch (error: any) {
      // Si el error es 404 (no encontrado), crear nueva configuración
      if (error?.status === 404 || error?.message?.includes('no encontrada')) {
        return await this.createAppSetting({
          setting_key: settingKey,
          setting_value: settingValue,
          branch_id: branchId
        });
      }
      throw error;
    }
  }

  /**
   * Elimina una configuración
   */
  async deleteAppSetting(settingId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/settings/${settingId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar configuración');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene configuraciones públicas (visibles para todos)
   */
  async getPublicSettings(branchId?: number): Promise<AppSettingData[]> {
    try {
      const response = await this.getAppSettings({
        is_public: true,
        branch_id: branchId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene configuraciones de una sede específica
   */
  async getBranchSettings(branchId: number): Promise<AppSettingData[]> {
    try {
      const response = await this.getAppSettings({
        branch_id: branchId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza múltiples configuraciones en lote
   */
  async bulkUpdateSettings(settings: Array<{ setting_id: number; setting_value: string }>): Promise<ApiResponse> {
    try {
      const response = await httpClient.put('/settings/bulk', { settings });

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar configuraciones en lote');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene configuraciones por tipo
   */
  async getSettingsByType(settingType: string, branchId?: number): Promise<AppSettingData[]> {
    try {
      const response = await this.getAppSettings({
        setting_type: settingType,
        branch_id: branchId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const appSettingsApi = new AppSettingsApiService();
export default appSettingsApi;
