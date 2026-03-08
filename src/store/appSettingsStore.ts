import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { UI_TEXTS } from '@/constants/ui';
import { appSettingsApi, AppSettingData } from '@/services/api/appSettingsApi';

interface AppSettingsStore {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  initializeDefaultSettings: () => Promise<void>;
}

// Mapeo de keys del backend a propiedades del frontend
const SETTING_KEY_MAP: Record<string, keyof AppSettings> = {
  'clinic_name': 'clinicName',
  'clinic_address': 'clinicAddress',
  'clinic_phone': 'clinicPhone',
  'clinic_email': 'clinicEmail',
  'clinic_website': 'clinicWebsite',
  'clinic_logo': 'clinicLogo',
  'timezone': 'timezone',
  'currency': 'currency',
  'language': 'language',
  'whatsapp_number': 'whatsappNumber',
  'whatsapp_display': 'whatsappDisplay',
  'whatsapp_imaging': 'whatsappImaging',
  'whatsapp_imaging_display': 'whatsappImagingDisplay',
  'phone_main': 'phoneMain',
  'phone_emergency': 'phoneEmergency',
  'email_info': 'emailInfo',
  'email_appointments': 'emailAppointments',
  'email_support': 'emailSupport',
  'address_main': 'addressMain',
  'facebook': 'facebook',
  'instagram': 'instagram',
  'twitter': 'twitter',
  'email_notifications': 'emailNotifications',
  'sms_notifications': 'smsNotifications',
  'appointment_reminders': 'appointmentReminders',
  'reminder_time': 'reminderTime',
  'system_alerts': 'systemAlerts',
  'session_timeout': 'sessionTimeout',
  'password_expiry': 'passwordExpiry',
  'max_login_attempts': 'maxLoginAttempts',
  'audit_log': 'auditLog',
  'inventory_alert_settings': 'inventoryAlertSettings',
};

// Mapeo inverso (frontend key -> backend key)
const FRONTEND_TO_BACKEND_MAP: Record<string, string> = Object.entries(SETTING_KEY_MAP)
  .reduce((acc, [backendKey, frontendKey]) => {
    acc[frontendKey as string] = backendKey;
    return acc;
  }, {} as Record<string, string>);

// Tipos de datos para cada setting
const SETTING_TYPES: Record<string, 'string' | 'number' | 'boolean' | 'json'> = {
  'email_notifications': 'boolean',
  'sms_notifications': 'boolean',
  'appointment_reminders': 'boolean',
  'reminder_time': 'number',
  'system_alerts': 'boolean',
  'session_timeout': 'number',
  'password_expiry': 'number',
  'max_login_attempts': 'number',
  'audit_log': 'boolean',
  'inventory_alert_settings': 'json',
};

// Valores por defecto basados en UI_TEXTS
const getDefaultSettings = (): Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> => ({
  // Información de la Clínica
  clinicName: UI_TEXTS.APP_NAME,
  clinicAddress: 'Av. Principal 123, Ciudad, País',
  clinicPhone: UI_TEXTS.CONTACT?.SUPPORT_PHONE || '+51 999 999 999',
  clinicEmail: UI_TEXTS.CONTACT?.SUPPORT_EMAIL || 'info@clinica.com',
  clinicWebsite: 'www.clinica.com',
  clinicLogo: undefined,
  timezone: 'America/Lima',
  currency: 'PEN',
  language: 'es',

  // Información de Contacto
  whatsappNumber: UI_TEXTS.CONTACT?.WHATSAPP_NUMBER || '51999999999',
  whatsappDisplay: '+51 999 999 999',
  whatsappImaging: '51999999998',
  whatsappImagingDisplay: '+51 999 999 998',
  phoneMain: '+51 01 234 5678',
  phoneEmergency: '+51 999 999 999',
  emailInfo: 'info@clinica.com',
  emailAppointments: 'citas@clinica.com',
  emailSupport: UI_TEXTS.CONTACT?.SUPPORT_EMAIL || 'soporte@clinica.com',
  addressMain: 'Av. Principal 123, Ciudad, País',

  // Redes Sociales
  facebook: undefined,
  instagram: undefined,
  twitter: undefined,

  // Configuración de Notificaciones
  emailNotifications: true,
  smsNotifications: false,
  appointmentReminders: true,
  reminderTime: 24,
  systemAlerts: true,

  // Configuración de Seguridad
  sessionTimeout: 30,
  passwordExpiry: 90,
  maxLoginAttempts: 3,
  auditLog: true,

  // Configuración de Alertas de Inventario
  inventoryAlertSettings: { diasAntes: 30 }
});

/**
 * Convierte valor de string del backend a su tipo correcto
 */
function parseSettingValue(backendKey: string, value: string | null): any {
  if (value === null || value === undefined || value === '') return null;

  const type = SETTING_TYPES[backendKey];

  switch (type) {
    case 'boolean':
      return value === 'true' || value === '1';
    case 'number':
      return parseInt(value, 10) || 0;
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    default:
      return value;
  }
}

/**
 * Convierte valor a string para enviar al backend
 */
function stringifyValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Transforma array de settings del backend a objeto AppSettings del frontend
 */
function transformSettingsFromApi(apiSettings: AppSettingData[]): Partial<AppSettings> {
  const result: Partial<AppSettings> = {};

  for (const setting of apiSettings) {
    const frontendKey = SETTING_KEY_MAP[setting.setting_key];
    if (frontendKey) {
      (result as any)[frontendKey] = parseSettingValue(setting.setting_key, setting.setting_value);
    }
  }

  return result;
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    try {
      set({ isLoading: true, error: null });

      // Verificar que haya token antes de intentar cargar
      const token = localStorage.getItem('dental_clinic_token');
      if (!token) {
        // Sin token, usar valores por defecto
        const defaults = getDefaultSettings();
        set({
          settings: {
            id: '1',
            ...defaults,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          isLoading: false
        });
        return;
      }

      // Cargar settings desde la API
      const response = await appSettingsApi.getAppSettings();
      const apiSettings = response.data || [];

      // Transformar a formato frontend
      const loadedSettings = transformSettingsFromApi(apiSettings);

      // Mezclar con valores por defecto para campos faltantes
      const defaults = getDefaultSettings();
      const mergedSettings: AppSettings = {
        id: '1',
        ...defaults,
        ...loadedSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      set({ settings: mergedSettings, isLoading: false });
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      // En caso de error, usar valores por defecto
      const defaults = getDefaultSettings();
      set({
        settings: {
          id: '1',
          ...defaults,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        error: 'Error al cargar la configuración',
        isLoading: false
      });
    }
  },

  updateSettings: async (updates) => {
    try {
      set({ isLoading: true, error: null });

      const currentSettings = get().settings;
      if (!currentSettings) {
        throw new Error('No hay configuración cargada');
      }

      // Actualizar cada setting en el backend
      const updatePromises: Promise<any>[] = [];

      for (const [frontendKey, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const backendKey = FRONTEND_TO_BACKEND_MAP[frontendKey];
          if (backendKey) {
            const stringValue = stringifyValue(value);
            updatePromises.push(
              appSettingsApi.upsertAppSetting(backendKey, stringValue)
            );
          }
        }
      }

      await Promise.all(updatePromises);

      // Actualizar estado local
      const updatedSettings: AppSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date()
      };

      set({ settings: updatedSettings, isLoading: false });

    } catch (error) {
      console.error('Error al actualizar la configuración:', error);
      set({ error: 'Error al actualizar la configuración', isLoading: false });
      throw error;
    }
  },

  initializeDefaultSettings: async () => {
    try {
      const defaults = getDefaultSettings();
      const now = new Date();

      // Crear configuraciones por defecto en el backend
      const createPromises: Promise<any>[] = [];

      for (const [frontendKey, value] of Object.entries(defaults)) {
        if (value !== undefined) {
          const backendKey = FRONTEND_TO_BACKEND_MAP[frontendKey];
          if (backendKey) {
            const stringValue = stringifyValue(value);
            createPromises.push(
              appSettingsApi.upsertAppSetting(backendKey, stringValue).catch(() => {
                // Ignorar errores individuales durante inicialización
              })
            );
          }
        }
      }

      await Promise.all(createPromises);

      const defaultSettings: AppSettings = {
        id: '1',
        ...defaults,
        createdAt: now,
        updatedAt: now
      };

      set({ settings: defaultSettings });

    } catch (error) {
      console.error('Error al inicializar configuraciones:', error);
      throw error;
    }
  }
}));
