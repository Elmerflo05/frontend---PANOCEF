/**
 * Exportaciones del módulo de formulario de laboratorio unificado
 */

// Componente principal
export { LaboratoryFormUnified } from './LaboratoryFormUnified';

// Secciones (used internally and by LaboratoryFormUnified)
export { Tomografia3DSection } from './sections/Tomografia3DSection';
export { RadiografiasSection } from './sections/RadiografiasSection';
export { PeriapicalSection } from './sections/PeriapicalSection';
export { PatientDataSection } from './sections/PatientDataSection';
export { DoctorDataSection } from './sections/DoctorDataSection';

// Wrappers con selectores (para usuarios internos)
export { PatientSelectorWrapper } from './wrappers/PatientSelectorWrapper';
export { DoctorSelectorWrapper } from './wrappers/DoctorSelectorWrapper';

// FormSteps para modales de nueva solicitud
export { TomografiaFormStepUnified } from './steps/TomografiaFormStepUnified';
export { RadiografiasFormStepUnified } from './steps/RadiografiasFormStepUnified';

// Componentes reutilizables (used by sections internally)
export { PriceInputGroup } from './components/PriceInputGroup';
export { CheckboxItem } from './components/CheckboxItem';
export { RadioOption } from './components/RadioOption';
export { SectionHeader } from './components/SectionHeader';
export { SubsectionTitle } from './components/SubsectionTitle';

// Utilidades de conversión de tipos
export {
  toLegacyTomografiaFormData
} from './utils/typeAdapters';

// Tipos
export type {
  FormMode,
  UserRole,
  Tomografia3DFormData,
  Tomografia3DPricing,
  RadiografiasFormData,
  RadiografiasPricing,
  PatientData,
  DoctorData,
  LaboratoryFormProps
} from './types';

// Valores iniciales y defaults
export {
  INITIAL_TOMOGRAFIA_FORM,
  INITIAL_RADIOGRAFIAS_FORM,
  INITIAL_PATIENT_DATA,
  INITIAL_DOCTOR_DATA,
  DEFAULT_TOMOGRAFIA_PRICING,
  DEFAULT_RADIOGRAFIAS_PRICING
} from './types';
