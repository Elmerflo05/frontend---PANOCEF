/**
 * Hook unificado para gestión de formularios de radiografía
 *
 * Versión UNIFICADA que separa los datos del paciente, doctor y tomografía
 * en lugar de mezclarlos en un solo objeto.
 *
 * Este hook reemplaza gradualmente a useRadiographyForm.ts
 *
 * Estructura de datos:
 * - patientData: PatientData (nombres, apellidos, dni, etc.)
 * - doctorData: DoctorData (nombres, apellidos, cop, etc.)
 * - tomografiaData: Tomografia3DFormData (opciones de tomografía)
 * - radiografiasData: RadiografiasFormData (opciones de radiografías)
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  type PatientData,
  type DoctorData,
  type Tomografia3DFormData,
  type RadiografiasFormData,
  INITIAL_PATIENT_DATA,
  INITIAL_DOCTOR_DATA,
  INITIAL_TOMOGRAFIA_FORM,
  INITIAL_RADIOGRAFIAS_FORM
} from '@/components/laboratory-form/types';

// Para compatibilidad con validación existente
import { validateTomografiaStep1 } from '@/services/radiography';
import { toLegacyTomografiaFormData } from '@/components/laboratory-form/utils/typeAdapters';

export interface UseUnifiedRadiographyFormReturn {
  // Estado
  currentStep: number;
  patientData: PatientData;
  doctorData: DoctorData;
  tomografiaData: Tomografia3DFormData;
  radiografiasData: RadiografiasFormData;

  // Handlers separados
  handlers: {
    handlePatientChange: (field: keyof PatientData, value: string) => void;
    handleDoctorChange: (field: keyof DoctorData, value: string) => void;
    handleTomografiaChange: (field: keyof Tomografia3DFormData, value: any) => void;
    handleRadiografiasChange: (field: keyof RadiografiasFormData, value: any) => void;
    toggleDienteFisico: (diente: string, category: 'superiores' | 'inferiores' | 'temporales') => void;
    toggleDienteDigital: (diente: string, category: 'superiores' | 'inferiores' | 'temporales') => void;
    toggleIntraoralTipo: (tipo: 'periapical' | 'fisico' | 'digital') => void;
    toggleExtraoralTipo: (tipo: 'fisico' | 'digital') => void;
    toggleOrtodociaTipo: (tipo: 'fisico' | 'digital') => void;
    nextStep: () => boolean;
    previousStep: () => void;
    reset: () => void;
  };

  // Helper para obtener datos en formato legacy (compatibilidad)
  getLegacyTomografiaData: () => any;
}

export const useUnifiedRadiographyForm = (): UseUnifiedRadiographyFormReturn => {
  // Estado separado para cada sección
  const [currentStep, setCurrentStep] = useState(1);
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [doctorData, setDoctorData] = useState<DoctorData>(INITIAL_DOCTOR_DATA);
  const [tomografiaData, setTomografiaData] = useState<Tomografia3DFormData>(INITIAL_TOMOGRAFIA_FORM);
  const [radiografiasData, setRadiografiasData] = useState<RadiografiasFormData>(INITIAL_RADIOGRAFIAS_FORM);

  // ========================================
  // HANDLERS DE CAMBIO
  // ========================================

  const handlePatientChange = (field: keyof PatientData, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleDoctorChange = (field: keyof DoctorData, value: string) => {
    setDoctorData(prev => ({ ...prev, [field]: value }));
  };

  const handleTomografiaChange = (field: keyof Tomografia3DFormData, value: any) => {
    setTomografiaData(prev => ({ ...prev, [field]: value }));
  };

  const handleRadiografiasChange = (field: keyof RadiografiasFormData, value: any) => {
    setRadiografiasData(prev => ({ ...prev, [field]: value }));
  };

  // ========================================
  // HANDLERS DE DIENTES (PERIAPICAL)
  // ========================================

  const toggleDienteFisico = (diente: string, category: 'superiores' | 'inferiores' | 'temporales') => {
    const field = category === 'superiores' ? 'dientesSuperioresFisico' :
                  category === 'inferiores' ? 'dientesInferioresFisico' :
                  'dientesTemporalesFisico';

    setRadiografiasData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(diente)
        ? (prev[field] as string[]).filter((d: string) => d !== diente)
        : [...(prev[field] as string[]), diente]
    }));
  };

  const toggleDienteDigital = (diente: string, category: 'superiores' | 'inferiores' | 'temporales') => {
    const field = category === 'superiores' ? 'dientesSuperioresDigital' :
                  category === 'inferiores' ? 'dientesInferioresDigital' :
                  'dientesTemporalesDigital';

    setRadiografiasData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(diente)
        ? (prev[field] as string[]).filter((d: string) => d !== diente)
        : [...(prev[field] as string[]), diente]
    }));
  };

  // ========================================
  // HANDLERS DE TIPO (FÍSICO/DIGITAL)
  // ========================================

  const toggleIntraoralTipo = (tipo: 'periapical' | 'fisico' | 'digital') => {
    setRadiografiasData(prev => ({
      ...prev,
      intraoralTipo: prev.intraoralTipo.includes(tipo)
        ? prev.intraoralTipo.filter(t => t !== tipo)
        : [...prev.intraoralTipo, tipo]
    }));
  };

  const toggleExtraoralTipo = (tipo: 'fisico' | 'digital') => {
    setRadiografiasData(prev => ({
      ...prev,
      extraoralTipo: prev.extraoralTipo.includes(tipo)
        ? prev.extraoralTipo.filter(t => t !== tipo)
        : [...prev.extraoralTipo, tipo]
    }));
  };

  const toggleOrtodociaTipo = (tipo: 'fisico' | 'digital') => {
    setRadiografiasData(prev => ({
      ...prev,
      ortodonciaTipo: prev.ortodonciaTipo.includes(tipo)
        ? prev.ortodonciaTipo.filter(t => t !== tipo)
        : [...prev.ortodonciaTipo, tipo]
    }));
  };

  // ========================================
  // NAVEGACIÓN
  // ========================================

  const nextStep = (): boolean => {
    // Validar datos del paciente
    if (!patientData.nombres.trim()) {
      toast.error('Los nombres del paciente son obligatorios');
      return false;
    }
    if (!patientData.apellidos.trim()) {
      toast.error('Los apellidos del paciente son obligatorios');
      return false;
    }
    if (!patientData.dni.trim()) {
      toast.error('El DNI del paciente es obligatorio');
      return false;
    }

    setCurrentStep(2);
    return true;
  };

  const previousStep = () => {
    setCurrentStep(1);
  };

  const reset = () => {
    setCurrentStep(1);
    setPatientData(INITIAL_PATIENT_DATA);
    setDoctorData(INITIAL_DOCTOR_DATA);
    setTomografiaData(INITIAL_TOMOGRAFIA_FORM);
    setRadiografiasData(INITIAL_RADIOGRAFIAS_FORM);
  };

  // ========================================
  // HELPER PARA COMPATIBILIDAD LEGACY
  // ========================================

  const getLegacyTomografiaData = () => {
    return toLegacyTomografiaFormData(patientData, doctorData, tomografiaData);
  };

  return {
    currentStep,
    patientData,
    doctorData,
    tomografiaData,
    radiografiasData,
    handlers: {
      handlePatientChange,
      handleDoctorChange,
      handleTomografiaChange,
      handleRadiografiasChange,
      toggleDienteFisico,
      toggleDienteDigital,
      toggleIntraoralTipo,
      toggleExtraoralTipo,
      toggleOrtodociaTipo,
      nextStep,
      previousStep,
      reset
    },
    getLegacyTomografiaData
  };
};
