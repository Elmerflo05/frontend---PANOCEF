/**
 * Servicios de validación para formularios de radiografía
 *
 * Este módulo centraliza toda la lógica de validación de formularios
 * de tomografía y radiografías, permitiendo reutilización y testing.
 *
 * MIGRADO: Usa tipos unificados de @/components/laboratory-form/types
 */

import type {
  PatientData,
  RadiografiasFormData
} from '@/components/laboratory-form/types';

import {
  hasIntraoralSelected,
  hasExtraoralSelected,
  hasOrtodonciaSelected,
  hasAnalisisSelected
} from './helpers';

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida el paso 1 del formulario (Datos del Paciente)
 * ACTUALIZADO: Ahora recibe PatientData en lugar de TomografiaFormData
 */
export const validateTomografiaStep1 = (patient: PatientData): ValidationResult => {
  // SOLO VALIDAR DATOS DEL PACIENTE (obligatorios para pasar al paso 2)

  // Validar nombres del paciente
  if (!patient.nombres || !patient.nombres.trim()) {
    return { isValid: false, error: 'Los nombres del paciente son obligatorios' };
  }

  // Validar apellidos del paciente
  if (!patient.apellidos || !patient.apellidos.trim()) {
    return { isValid: false, error: 'Los apellidos del paciente son obligatorios' };
  }

  // Validar DNI
  if (!patient.dni || !patient.dni.trim()) {
    return { isValid: false, error: 'El DNI es obligatorio' };
  }

  // Los demás campos (doctor, tipo de entrega, estudios) NO son obligatorios para pasar al paso 2

  return { isValid: true };
};

/**
 * Valida el paso 2 del formulario (Radiografías)
 */
export const validateRadiografiasStep2 = (data: RadiografiasFormData): ValidationResult => {
  const hasIntraoral = hasIntraoralSelected(data);
  const hasExtraoral = hasExtraoralSelected(data);
  const hasOrtodoncia = hasOrtodonciaSelected(data);
  const hasAnalisis = hasAnalisisSelected(data);

  // Debe tener al menos un tipo de estudio seleccionado
  if (!hasIntraoral && !hasExtraoral && !hasOrtodoncia && !hasAnalisis) {
    return {
      isValid: false,
      error: 'Debe seleccionar al menos un tipo de estudio o servicio de radiografía'
    };
  }

  return { isValid: true };
};
