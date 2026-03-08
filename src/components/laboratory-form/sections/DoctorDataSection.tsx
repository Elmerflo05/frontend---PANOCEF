/**
 * Sección de datos del doctor para formularios públicos
 *
 * Captura información del odontólogo referente:
 * - Nombre completo (nombres y apellidos)
 * - COP (número de colegiatura)
 * - Especialidad (opcional)
 * - Teléfono (opcional)
 * - Email (opcional)
 * - Dirección (opcional)
 */

import { Stethoscope } from 'lucide-react';
import type { DoctorData } from '../types';

interface DoctorDataSectionProps {
  data: DoctorData;
  onChange: (field: keyof DoctorData, value: string) => void;
  readOnly?: boolean;
  colorTheme?: 'cyan' | 'purple';
}

export const DoctorDataSection = ({
  data,
  onChange,
  readOnly = false,
  colorTheme = 'purple'
}: DoctorDataSectionProps) => {
  const themeColors = {
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      title: 'text-cyan-900',
      focus: 'focus:ring-cyan-500 focus:border-cyan-500'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      title: 'text-purple-900',
      focus: 'focus:ring-purple-500 focus:border-purple-500'
    }
  };

  const theme = themeColors[colorTheme];

  const inputClasses = `w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.focus} transition-colors ${
    readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
  }`;

  return (
    <div className={`${theme.bg} ${theme.border} border rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <Stethoscope className={`w-5 h-5 ${theme.title}`} />
        <h3 className={`font-bold ${theme.title} text-lg`}>Datos del Odontólogo</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre completo */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Odontólogo <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={data.nombres}
              onChange={(e) => onChange('nombres', e.target.value)}
              className={inputClasses}
              placeholder="Nombres"
              disabled={readOnly}
              required
            />
            <input
              type="text"
              value={data.apellidos}
              onChange={(e) => onChange('apellidos', e.target.value)}
              className={inputClasses}
              placeholder="Apellidos"
              disabled={readOnly}
              required
            />
          </div>
        </div>

        {/* COP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            COP <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.cop}
            onChange={(e) => onChange('cop', e.target.value)}
            className={inputClasses}
            placeholder="Ej: 12345"
            disabled={readOnly}
            required
          />
        </div>

        {/* Especialidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especialidad
          </label>
          <input
            type="text"
            value={data.especialidad || ''}
            onChange={(e) => onChange('especialidad', e.target.value)}
            className={inputClasses}
            placeholder="Ej: Ortodoncia"
            disabled={readOnly}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={data.telefono || ''}
            onChange={(e) => onChange('telefono', e.target.value)}
            className={inputClasses}
            placeholder="Ej: 999 888 777"
            disabled={readOnly}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            className={inputClasses}
            placeholder="correo@ejemplo.com"
            disabled={readOnly}
          />
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección del Consultorio
          </label>
          <input
            type="text"
            value={data.direccion || ''}
            onChange={(e) => onChange('direccion', e.target.value)}
            className={inputClasses}
            placeholder="Av. Principal 123, Distrito"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};
