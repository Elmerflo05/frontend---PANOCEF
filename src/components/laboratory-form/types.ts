/**
 * Tipos unificados para el formulario de laboratorio
 *
 * Este módulo centraliza todos los tipos para los 5 flujos de usuario:
 * 1. SuperAdmin: Configura precios (mode: 'pricing')
 * 2. Doctor: Selecciona estudios en consulta (mode: 'edit')
 * 3. Paciente: Ve lo que el doctor registró (mode: 'view')
 * 4. Técnico Imagenología: Crea solicitudes + ve precios (mode: 'edit' + showPrices)
 * 5. Cliente Externo: Envía solicitudes públicas (mode: 'edit')
 *
 * IMPORTANTE: Esta es la fuente única de verdad (Single Source of Truth) para
 * todos los tipos de formularios de laboratorio del sistema.
 *
 * Los tipos de precios se importan desde laboratoryServicePricesApi.ts
 * para mantener sincronización con la estructura de BD normalizada.
 *
 * @version 2.1.0 - Integración con BD normalizada
 * @module laboratory-form/types
 */

import type {
  Tomografia3DPricingLegacy,
  RadiografiasPricingLegacy
} from '@/services/api/laboratoryServicePricesApi';

// ============================================================================
// MODOS Y ROLES
// ============================================================================

export type FormMode = 'pricing' | 'edit' | 'view';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'doctor'
  | 'patient'
  | 'imaging_technician'
  | 'external_client';

// ============================================================================
// DATOS DE TOMOGRAFÍA 3D (estructura completa)
// ============================================================================

export interface Tomografia3DFormData {
  // Tipo de Entrega
  conInforme: boolean;
  sinInforme: boolean;
  dicom: boolean;
  soloUsb: boolean;

  // Campo Pequeño
  endodoncia: boolean;
  numeroPiezasEndo: string;
  fracturaRadicular: boolean;
  numeroPiezasFractura: string;
  anatomiaEndodontica: boolean;
  numeroPiezasAnatEndo: string;

  // Campo Mediano
  localizacionDiente: boolean;
  numeroPiezasLoc: string;
  implantes: boolean;
  numeroCortes: string;
  conGuiaQx: boolean;
  tipoGuiaImplante: 'guiaTomografica' | 'sinGuia' | '';
  maxilarSuperior: boolean; // Maxilar superior e inferior (Sin informe)

  // Campo Mediano/Grande
  viaAerea: boolean;
  tipoGuiaViaAerea: 'conGuia' | 'sinGuia' | '';
  ortognatica: boolean;
  tipoOrtognatica: 'conGuia' | 'sinGuia' | 'conPlanificacionQuirurgica' | '';

  // Ortodoncia
  marpe: boolean;
  miniImplantes: boolean;
  // Sub-opciones de Mini-implantes
  intraAlveolares: boolean;
  extraAlveolares: boolean;
  infracigomatico: boolean;
  buccalShelf: boolean;
  // Opciones de guía para ortodoncia
  tipoGuiaOrtodoncia: 'conGuia' | 'sinGuia' | '';
  guiaImpresa: 'impreso' | 'digital' | '';

  // Otras Opciones
  atm: boolean;
  tipoAtm: 'bocaAbierta' | 'bocaCerrada' | '';
  macizoFacial: boolean;
  tipoMacizoFacial: 'tercioMedioSuperior' | 'tercioMedioInferior' | '';

  // Otros
  otros: string;
}

// ============================================================================
// PRECIOS DE TOMOGRAFÍA 3D
// Sincronizado con tabla laboratory_service_prices (16 campos)
// ============================================================================

// Re-exportar tipos de precios desde la API (fuente única de verdad)
export type Tomografia3DPricing = Tomografia3DPricingLegacy;

// ============================================================================
// DATOS DE RADIOGRAFÍAS (estructura completa)
// ============================================================================

export interface RadiografiasFormData {
  // INTRAORALES - Tipo de modo
  intraoralTipo: ('periapical' | 'fisico' | 'digital')[];

  // Periapical - Dientes seleccionados modo FÍSICO
  dientesSuperioresFisico: string[];
  dientesInferioresFisico: string[];
  dientesTemporalesFisico: string[];

  // Periapical - Dientes seleccionados modo DIGITAL
  dientesSuperioresDigital: string[];
  dientesInferioresDigital: string[];
  dientesTemporalesDigital: string[];

  // Arrays legacy para compatibilidad
  periapicalFisico: number[];
  periapicalDigital: number[];

  // Bitewing
  bitewingMolaresDerecha: boolean;
  bitewingMolaresIzquierda: boolean;
  bitewingPremolaresDerecha: boolean;
  bitewingPremolaresIzquierda: boolean;

  // Oclusal
  oclusalSuperiores: boolean;
  oclusalInferiores: boolean;

  // Otras opciones intraorales
  seriada: boolean;
  fotografias: boolean;
  fotografiaIntraoral: boolean;
  fotografiaExtraoral: boolean;

  // EXTRAORALES
  extraoralTipo: ('fisico' | 'digital')[];
  extraoralPanoramica: boolean;
  extraoralCefalometrica: boolean;
  extraoralCarpal: boolean;
  carpalFishman: boolean;
  carpalTtw2: boolean;
  extraoralPosteriorAnterior: boolean;
  posteriorAnteriorRicketts: boolean;
  extraoralAtmAbierta: boolean;
  extraoralAtmCerrada: boolean;
  extraoralFotografia: boolean;

  // ASESORÍA ORTODONCIA
  ortodonciaTipo: ('fisico' | 'digital')[];
  ortodonciaPaquete: 0 | 1 | 2 | 3;
  ortodonciaPlanTratamiento: 'con' | 'sin' | '';

  // Servicios Adicionales - Alineadores Invisibles
  ortodonciaAlineadores: boolean;
  alineadoresPlanificacion: boolean;
  alineadoresImpresion: boolean;

  // Servicios Adicionales - Escaneo Intraoral Digital
  ortodonciaEscaneo: boolean;
  escaneoIntraoral: boolean;
  escaneoIntraoralZocalo: boolean;
  escaneoIntraoralInforme: boolean;

  // Servicios Adicionales - Modelos de Estudio 3D
  ortodonciaImpresion: boolean;
  modelosDigitalesConInforme: boolean;
  modelosDigitalesSinInforme: boolean;
  modelosImpresionDigital: boolean;

  // ANÁLISIS CEFALOMÉTRICOS
  analisisRicketts: boolean;
  analisisSchwartz: boolean;
  analisisSteiner: boolean;
  analisisMcNamara: boolean;
  analisisTweed: boolean;
  analisisDowns: boolean;
  analisisBjorks: boolean;
  analisisUSP: boolean;
  analisisRotJarabak: boolean;
  analisisTejidosBlancos: boolean;
  analisisOtros: string;

  // Campos legacy para compatibilidad con DiagnosticPlanStep
  bitewingAmbos?: boolean;
  bitewingDerecho?: boolean;
  bitewingIzquierdo?: boolean;
  halografiaPanoramica?: boolean;
  halografiaLateral?: boolean;
  halografiaPosterior?: boolean;
  estudiosAtm?: boolean;
  radiografiaCefalometrica?: boolean;
  paquete1ConAsesoria?: boolean;
  paquete1SinAsesoria?: boolean;
  paquete2ConAsesoria?: boolean;
  paquete2SinAsesoria?: boolean;
  paquete3ConAsesoria?: boolean;
  paquete3SinAsesoria?: boolean;
  alteracionesInmediatas?: boolean;
  escaneoImpresionDigital?: boolean;
  modelosEstudio3d?: boolean;
  ricketts?: boolean;
  powell?: boolean;
  nordEstelametal?: boolean;
  steinerBianco?: boolean;
  steiner?: boolean;
  bjork?: boolean;
  mcNamara?: boolean;
  usp?: boolean;
  especificarOtros?: string;
}

// ============================================================================
// PRECIOS DE RADIOGRAFÍAS
// Sincronizado con tabla laboratory_service_prices (32 campos)
// ============================================================================

// Re-exportar tipo de precios desde la API (fuente única de verdad)
export type RadiografiasPricing = RadiografiasPricingLegacy;

// Extensión para campos UI adicionales que no están en el backend
// Estos campos son para lógica de UI, no para almacenamiento
export interface RadiografiasPricingExtended extends RadiografiasPricingLegacy {
  // Campos de UI adicionales (calculados localmente, no en BD)
  bitewingMolares?: number;
  bitewingPremolares?: number;
  fotografiaIntraoral?: number;
  fotografiaExtraoral?: number;
  panoramica?: number;
  cefalometrica?: number;
  carpal?: number;
  posteriorAnterior?: number;
  atmAbierta?: number;
  atmCerrada?: number;
  alineadores?: number;
  escaneoIntraoral?: number;
  modelosDigitales?: number;
  schwartz?: number;
  tweed?: number;
  downs?: number;
  bjorks?: number;
  rotJarabak?: number;
  tejidosBlancos?: number;
}

// ============================================================================
// DATOS DE PACIENTE Y DOCTOR
// ============================================================================

export interface PatientData {
  nombres: string;
  apellidos: string;
  edad: string;
  dni: string;
  telefono: string;
  email?: string;
  motivoConsulta?: string;
}

export interface DoctorData {
  nombres: string;
  apellidos: string;
  cop: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

// ============================================================================
// PROPS DEL COMPONENTE PRINCIPAL
// ============================================================================

export interface LaboratoryFormProps {
  mode: FormMode;
  userRole: UserRole;
  showPatientSection?: boolean;
  showDoctorSection?: boolean;
  showPrices?: boolean;
  colorTheme?: 'cyan' | 'purple' | 'panocef';

  // Datos del formulario
  tomografiaData?: Tomografia3DFormData;
  radiografiasData?: RadiografiasFormData;
  patientData?: PatientData;
  doctorData?: DoctorData;

  // Precios
  tomografiaPricing?: Tomografia3DPricing;
  radiografiasPricing?: RadiografiasPricing;

  // Callbacks
  onTomografiaChange?: (field: keyof Tomografia3DFormData, value: any) => void;
  onRadiografiasChange?: (field: keyof RadiografiasFormData, value: any) => void;
  onPatientChange?: (field: keyof PatientData, value: string) => void;
  onDoctorChange?: (field: keyof DoctorData, value: string) => void;
  onTomografiaPricingChange?: (field: keyof Tomografia3DPricing, value: number) => void;
  onRadiografiasPricingChange?: (field: keyof RadiografiasPricing, value: number) => void;
  onSave?: () => void;
  onCancel?: () => void;

  // Estado
  loading?: boolean;
  error?: string | null;
}

// ============================================================================
// VALORES INICIALES
// ============================================================================

export const INITIAL_TOMOGRAFIA_FORM: Tomografia3DFormData = {
  // Tipo de Entrega
  conInforme: false,
  sinInforme: false,
  dicom: false,
  soloUsb: false,
  // Campo Pequeño
  endodoncia: false,
  numeroPiezasEndo: '',
  fracturaRadicular: false,
  numeroPiezasFractura: '',
  anatomiaEndodontica: false,
  numeroPiezasAnatEndo: '',
  // Campo Mediano
  localizacionDiente: false,
  numeroPiezasLoc: '',
  implantes: false,
  numeroCortes: '',
  conGuiaQx: false,
  tipoGuiaImplante: '',
  maxilarSuperior: false,
  // Campo Mediano/Grande
  viaAerea: false,
  tipoGuiaViaAerea: '',
  ortognatica: false,
  tipoOrtognatica: '',
  // Ortodoncia
  marpe: false,
  miniImplantes: false,
  intraAlveolares: false,
  extraAlveolares: false,
  infracigomatico: false,
  buccalShelf: false,
  tipoGuiaOrtodoncia: '',
  guiaImpresa: '',
  // Otras Opciones
  atm: false,
  tipoAtm: '',
  macizoFacial: false,
  tipoMacizoFacial: '',
  // Otros
  otros: ''
};

export const INITIAL_RADIOGRAFIAS_FORM: RadiografiasFormData = {
  // Intraorales
  intraoralTipo: [],
  dientesSuperioresFisico: [],
  dientesInferioresFisico: [],
  dientesTemporalesFisico: [],
  dientesSuperioresDigital: [],
  dientesInferioresDigital: [],
  dientesTemporalesDigital: [],
  periapicalFisico: [],
  periapicalDigital: [],
  // Bitewing
  bitewingMolaresDerecha: false,
  bitewingMolaresIzquierda: false,
  bitewingPremolaresDerecha: false,
  bitewingPremolaresIzquierda: false,
  // Oclusal
  oclusalSuperiores: false,
  oclusalInferiores: false,
  // Otras intraorales
  seriada: false,
  fotografias: false,
  fotografiaIntraoral: false,
  fotografiaExtraoral: false,
  // Extraorales
  extraoralTipo: [],
  extraoralPanoramica: false,
  extraoralCefalometrica: false,
  extraoralCarpal: false,
  carpalFishman: false,
  carpalTtw2: false,
  extraoralPosteriorAnterior: false,
  posteriorAnteriorRicketts: false,
  extraoralAtmAbierta: false,
  extraoralAtmCerrada: false,
  extraoralFotografia: false,
  // Asesoría Ortodoncia
  ortodonciaTipo: [],
  ortodonciaPaquete: 0,
  ortodonciaPlanTratamiento: '',
  ortodonciaAlineadores: false,
  alineadoresPlanificacion: false,
  alineadoresImpresion: false,
  ortodonciaEscaneo: false,
  escaneoIntraoral: false,
  escaneoIntraoralZocalo: false,
  escaneoIntraoralInforme: false,
  ortodonciaImpresion: false,
  modelosDigitalesConInforme: false,
  modelosDigitalesSinInforme: false,
  modelosImpresionDigital: false,
  // Análisis Cefalométricos
  analisisRicketts: false,
  analisisSchwartz: false,
  analisisSteiner: false,
  analisisMcNamara: false,
  analisisTweed: false,
  analisisDowns: false,
  analisisBjorks: false,
  analisisUSP: false,
  analisisRotJarabak: false,
  analisisTejidosBlancos: false,
  analisisOtros: ''
};

export const INITIAL_PATIENT_DATA: PatientData = {
  nombres: '',
  apellidos: '',
  edad: '',
  dni: '',
  telefono: '',
  email: '',
  motivoConsulta: ''
};

export const INITIAL_DOCTOR_DATA: DoctorData = {
  nombres: '',
  apellidos: '',
  cop: '',
  especialidad: '',
  telefono: '',
  email: '',
  direccion: ''
};

export const DEFAULT_TOMOGRAFIA_PRICING: Tomografia3DPricing = {
  conInforme: 150,
  sinInforme: 100,
  dicom: 50,
  soloUsb: 30,
  endodoncia: 80,
  fracturaRadicular: 75,
  anatomiaEndodontica: 85,
  localizacionDiente: 100,
  implantes: 120,
  maxilarSuperior: 110,
  viaAerea: 150,
  ortognatica: 160,
  marpe: 140,
  miniImplantes: 130,
  atm: 125,
  macizoFacial: 135
};

// Precios por defecto de Radiografías (sincronizado con BD + campos UI)
export const DEFAULT_RADIOGRAFIAS_PRICING: RadiografiasPricing = {
  // INTRAORALES - PERIAPICAL (2)
  periapicalFisico: 50,
  periapicalDigital: 20,

  // BITEWING - Legacy (3)
  bitewingAmbos: 60,
  bitewingDerecho: 35,
  bitewingIzquierdo: 35,
  // BITEWING - Campos nuevos UI (2)
  bitewingMolares: 35,
  bitewingPremolares: 35,

  // OCLUSAL (2)
  oclusalSuperiores: 40,
  oclusalInferiores: 40,

  // OTRAS INTRAORALES (2)
  seriada: 280,
  radiografias: 50,
  // Fotografias - Campos nuevos UI (2)
  fotografiaIntraoral: 30,
  fotografiaExtraoral: 30,

  // EXTRAORALES - Legacy (5)
  halografiaPanoramica: 80,
  halografiaLateral: 70,
  halografiaPosterior: 75,
  estudiosAtm: 120,
  radiografiaCefalometrica: 90,
  // EXTRAORALES - Campos nuevos UI (6)
  panoramica: 80,
  cefalometrica: 90,
  carpal: 70,
  posteriorAnterior: 75,
  atmAbierta: 60,
  atmCerrada: 60,

  // ASESORÍA ORTODONCIA - Paquete 1 (2)
  paq1ConAsesoria: 400,
  paq1SinAsesoria: 350,
  // ASESORÍA ORTODONCIA - Paquete 2 (2)
  paq2ConAsesoria: 300,
  paq2SinAsesoria: 250,
  // ASESORÍA ORTODONCIA - Paquete 3 (2)
  paq3ConAsesoria: 450,
  paq3SinAsesoria: 400,

  // SERVICIOS ADICIONALES - Legacy (3)
  alteracionesInmediatas: 50,
  escaneoImpresionDigital: 80,
  modelosEstudio3d: 100,
  // SERVICIOS ADICIONALES - Campos nuevos UI (3)
  alineadores: 150,
  escaneoIntraoral: 80,
  modelosDigitales: 100,

  // ANÁLISIS CEFALOMÉTRICOS - Legacy (9)
  ricketts: 50,
  powell: 50,
  nordEstelametal: 50,
  steinerBianco: 50,
  steiner: 50,
  bjork: 50,
  mcNamara: 50,
  usp: 50,
  especificarOtros: 50,
  // ANÁLISIS CEFALOMÉTRICOS - Campos nuevos UI (6)
  schwartz: 50,
  tweed: 50,
  downs: 50,
  bjorks: 50,
  rotJarabak: 50,
  tejidosBlancos: 50
};
