/**
 * Wrapper de PatientDataSection con selector de pacientes
 *
 * Agrega funcionalidad de selección de pacientes existentes al componente
 * unificado PatientDataSection. Usa API backend en lugar de IndexedDB.
 *
 * @usage
 * - showSelector={false}: Solo muestra el formulario (modo cliente externo)
 * - showSelector={true}: Muestra selector + formulario (modo técnico/interno)
 */

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { PatientDataSection } from '../sections/PatientDataSection';
import { patientsApi } from '@/services/api/patientsApi';
import { useAuthStore } from '@/store/authStore';
import type { PatientData } from '../types';

interface PatientSelectorWrapperProps {
  data: PatientData;
  onChange: (field: keyof PatientData, value: string) => void;
  showSelector?: boolean;
  readOnly?: boolean;
  colorTheme?: 'cyan' | 'purple';
}

interface PatientOption {
  patient_id: number;
  first_name: string;
  last_name: string;
  dni: string;
  phone: string;
  email: string;
  date_of_birth: string;
}

export const PatientSelectorWrapper = ({
  data,
  onChange,
  showSelector = false,
  readOnly = false,
  colorTheme = 'purple'
}: PatientSelectorWrapperProps) => {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Cliente externo NO debe ver el selector de pacientes
  const isExternalClient = user?.role === 'external_client';
  const shouldShowSelector = showSelector && !isExternalClient;

  // Cargar pacientes desde la API backend
  useEffect(() => {
    if (!shouldShowSelector) return;

    const loadPatients = async () => {
      setIsLoading(true);
      try {
        const response = await patientsApi.getPatients({ limit: 1000 });
        setPatients(response.data || []);
      } catch (error) {
        console.error('Error cargando pacientes:', error);
        setPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, [shouldShowSelector]);

  // Calcular edad desde fecha de nacimiento
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Manejar selección de paciente
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);

    if (!patientId) {
      // Limpiar campos si se selecciona "Nuevo paciente"
      onChange('nombres', '');
      onChange('apellidos', '');
      onChange('edad', '');
      onChange('dni', '');
      onChange('telefono', '');
      onChange('email', '');
      return;
    }

    const patient = patients.find(p => p.patient_id.toString() === patientId);
    if (patient) {
      onChange('nombres', patient.first_name || '');
      onChange('apellidos', patient.last_name || '');
      onChange('edad', patient.date_of_birth ? calculateAge(patient.date_of_birth).toString() : '');
      onChange('dni', patient.dni || '');
      onChange('telefono', patient.phone || '');
      onChange('email', patient.email || '');
    }
  };

  const themeColors = {
    cyan: {
      bg: 'bg-panocef-light',
      border: 'border-panocef-secondary',
      focus: 'focus:ring-panocef-primary focus:border-panocef-primary',
      icon: 'text-panocef-primary'
    },
    purple: {
      bg: 'bg-panocef-light',
      border: 'border-panocef-secondary',
      focus: 'focus:ring-panocef-primary focus:border-panocef-primary',
      icon: 'text-panocef-primary'
    }
  };

  const theme = themeColors[colorTheme];

  return (
    <div className="space-y-4">
      {/* Selector de pacientes - Solo visible para usuarios internos */}
      {shouldShowSelector && (
        <div className={`${theme.bg} ${theme.border} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Users className={`w-5 h-5 ${theme.icon}`} />
            <label className="text-sm font-medium text-gray-700">
              Seleccionar Paciente Existente
            </label>
          </div>
          <select
            value={selectedPatientId}
            onChange={(e) => handlePatientSelect(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.focus} transition-colors`}
            disabled={isLoading || readOnly}
          >
            <option value="">
              {isLoading ? 'Cargando pacientes...' : 'Seleccione un paciente o registre uno nuevo'}
            </option>
            {patients.map((patient) => (
              <option key={patient.patient_id} value={patient.patient_id.toString()}>
                {patient.first_name} {patient.last_name} - DNI: {patient.dni || 'N/A'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Seleccione un paciente existente o deje vacío para ingresar datos manualmente
          </p>
        </div>
      )}

      {/* Componente unificado de datos del paciente */}
      <PatientDataSection
        data={data}
        onChange={onChange}
        readOnly={readOnly}
        colorTheme={colorTheme}
      />
    </div>
  );
};
