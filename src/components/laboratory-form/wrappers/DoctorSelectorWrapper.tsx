/**
 * Wrapper de DoctorDataSection con selector de doctores
 *
 * Agrega funcionalidad de selección de doctores existentes al componente
 * unificado DoctorDataSection. Usa API backend en lugar de IndexedDB.
 *
 * @usage
 * - showSelector={false}: Solo muestra el formulario (modo cliente externo)
 * - showSelector={true}: Muestra selector + formulario (modo técnico/interno)
 */

import { useState, useEffect } from 'react';
import { Stethoscope } from 'lucide-react';
import { DoctorDataSection } from '../sections/DoctorDataSection';
import { dentistsApi } from '@/services/api/dentistsApi';
import { useAuthStore } from '@/store/authStore';
import type { DoctorData } from '../types';

interface DoctorSelectorWrapperProps {
  data: DoctorData;
  onChange: (field: keyof DoctorData, value: string) => void;
  showSelector?: boolean;
  readOnly?: boolean;
  colorTheme?: 'cyan' | 'purple';
}

interface DoctorOption {
  dentist_id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  specialty: string;
  phone: string;
  email: string;
}

export const DoctorSelectorWrapper = ({
  data,
  onChange,
  showSelector = false,
  readOnly = false,
  colorTheme = 'purple'
}: DoctorSelectorWrapperProps) => {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Cliente externo NO debe ver el selector de doctores
  const isExternalClient = user?.role === 'external_client';
  const shouldShowSelector = showSelector && !isExternalClient;

  // Cargar doctores desde la API backend
  useEffect(() => {
    if (!shouldShowSelector) return;

    const loadDoctors = async () => {
      setIsLoading(true);
      try {
        const response = await dentistsApi.getDentists({ limit: 100 });
        setDoctors(response.data || []);
      } catch (error) {
        console.error('Error cargando doctores:', error);
        setDoctors([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, [shouldShowSelector]);

  // Manejar selección de doctor
  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);

    if (!doctorId) {
      // Limpiar campos si se selecciona "Nuevo doctor"
      onChange('nombres', '');
      onChange('apellidos', '');
      onChange('cop', '');
      onChange('especialidad', '');
      onChange('telefono', '');
      onChange('email', '');
      return;
    }

    const doctor = doctors.find(d => d.dentist_id.toString() === doctorId);
    if (doctor) {
      onChange('nombres', doctor.first_name || '');
      onChange('apellidos', doctor.last_name || '');
      onChange('cop', doctor.license_number || '');
      onChange('especialidad', doctor.specialty || '');
      onChange('telefono', doctor.phone || '');
      onChange('email', doctor.email || '');
    }
  };

  const themeColors = {
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      focus: 'focus:ring-cyan-500 focus:border-cyan-500',
      icon: 'text-cyan-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      focus: 'focus:ring-purple-500 focus:border-purple-500',
      icon: 'text-purple-600'
    }
  };

  const theme = themeColors[colorTheme];

  return (
    <div className="space-y-4">
      {/* Selector de doctores - Solo visible para usuarios internos */}
      {shouldShowSelector && (
        <div className={`${theme.bg} ${theme.border} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className={`w-5 h-5 ${theme.icon}`} />
            <label className="text-sm font-medium text-gray-700">
              Seleccionar Doctor Existente
            </label>
          </div>
          <select
            value={selectedDoctorId}
            onChange={(e) => handleDoctorSelect(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.focus} transition-colors`}
            disabled={isLoading || readOnly}
          >
            <option value="">
              {isLoading ? 'Cargando doctores...' : 'Seleccione un doctor o registre uno nuevo'}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.dentist_id} value={doctor.dentist_id.toString()}>
                Dr. {doctor.first_name} {doctor.last_name} - COP: {doctor.license_number || 'N/A'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Seleccione un doctor existente o deje vacío para ingresar datos manualmente
          </p>
        </div>
      )}

      {/* Componente unificado de datos del doctor */}
      <DoctorDataSection
        data={data}
        onChange={onChange}
        readOnly={readOnly}
        colorTheme={colorTheme}
      />
    </div>
  );
};
