/**
 * TomografiaFormStepUnified - Paso 1 del formulario de nueva solicitud
 *
 * Versión UNIFICADA del formulario de tomografía 3D.
 *
 * Incluye:
 * - PatientSelectorWrapper (con selector opcional de pacientes existentes)
 * - Tomografia3DSection (sección de estudios de tomografía)
 * - DoctorSelectorWrapper (con selector opcional de doctores existentes)
 *
 * @usage
 * <TomografiaFormStepUnified
 *   patientData={patientData}
 *   doctorData={doctorData}
 *   tomografiaData={tomografiaData}
 *   onPatientChange={handlePatientChange}
 *   onDoctorChange={handleDoctorChange}
 *   onTomografiaChange={handleTomografiaChange}
 *   showSelectors={true} // false para cliente externo
 *   colorTheme="cyan"
 * />
 */

import { PatientSelectorWrapper } from '../wrappers/PatientSelectorWrapper';
import { DoctorSelectorWrapper } from '../wrappers/DoctorSelectorWrapper';
import { Tomografia3DSection } from '../sections/Tomografia3DSection';
import type {
  PatientData,
  DoctorData,
  Tomografia3DFormData,
  Tomografia3DPricing
} from '../types';

interface TomografiaFormStepUnifiedProps {
  // Datos
  patientData: PatientData;
  doctorData: DoctorData;
  tomografiaData: Tomografia3DFormData;

  // Handlers
  onPatientChange: (field: keyof PatientData, value: string) => void;
  onDoctorChange: (field: keyof DoctorData, value: string) => void;
  onTomografiaChange: (field: keyof Tomografia3DFormData, value: any) => void;

  // Precios (opcional)
  pricing?: Tomografia3DPricing;
  showPrices?: boolean;

  // Opciones
  showSelectors?: boolean;
  readOnly?: boolean;
  colorTheme?: 'cyan' | 'purple';
}

export const TomografiaFormStepUnified = ({
  patientData,
  doctorData,
  tomografiaData,
  onPatientChange,
  onDoctorChange,
  onTomografiaChange,
  pricing,
  showPrices = false,
  showSelectors = true,
  readOnly = false,
  colorTheme = 'purple'
}: TomografiaFormStepUnifiedProps) => {
  return (
    <div className="space-y-6">
      {/* Sección de Paciente con selector opcional */}
      <PatientSelectorWrapper
        data={patientData}
        onChange={onPatientChange}
        showSelector={showSelectors}
        readOnly={readOnly}
        colorTheme={colorTheme}
      />

      {/* Sección de Tomografía 3D */}
      <Tomografia3DSection
        mode={readOnly ? 'view' : 'edit'}
        colorTheme={colorTheme}
        showPrices={showPrices}
        formData={tomografiaData}
        onFormChange={onTomografiaChange}
        pricing={pricing}
      />

      {/* Sección de Doctor con selector opcional */}
      <DoctorSelectorWrapper
        data={doctorData}
        onChange={onDoctorChange}
        showSelector={showSelectors}
        readOnly={readOnly}
        colorTheme={colorTheme}
      />
    </div>
  );
};
