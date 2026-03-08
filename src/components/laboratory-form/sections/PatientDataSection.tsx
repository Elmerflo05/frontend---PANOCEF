/**
 * Sección de datos del paciente para formularios públicos
 *
 * Captura información básica del paciente:
 * - Nombre completo
 * - Edad
 * - DNI
 * - Teléfono
 * - Email (opcional)
 * - Motivo de consulta (opcional)
 */

import { User } from 'lucide-react';
import type { PatientData } from '../types';

interface PatientDataSectionProps {
  data: PatientData;
  onChange: (field: keyof PatientData, value: string) => void;
  readOnly?: boolean;
  colorTheme?: 'cyan' | 'purple';
}

export const PatientDataSection = ({
  data,
  onChange,
  readOnly = false,
  colorTheme = 'purple'
}: PatientDataSectionProps) => {
  const themeColors = {
    cyan: {
      bg: 'bg-panocef-light',
      border: 'border-panocef-secondary',
      title: 'text-panocef-dark',
      focus: 'focus:ring-panocef-primary focus:border-panocef-primary'
    },
    purple: {
      bg: 'bg-panocef-light',
      border: 'border-panocef-secondary',
      title: 'text-panocef-dark',
      focus: 'focus:ring-panocef-primary focus:border-panocef-primary'
    }
  };

  const theme = themeColors[colorTheme];

  const inputClasses = `w-full px-3 py-2 border border-gray-300 rounded-lg ${theme.focus} transition-colors ${
    readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
  }`;

  return (
    <div className={`${theme.bg} ${theme.border} border rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <User className={`w-5 h-5 ${theme.title}`} />
        <h3 className={`font-bold ${theme.title} text-lg`}>Datos del Paciente</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre completo */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo <span className="text-red-500">*</span>
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

        {/* Edad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edad
          </label>
          <input
            type="text"
            value={data.edad}
            onChange={(e) => onChange('edad', e.target.value)}
            className={inputClasses}
            placeholder="Ej: 25 años"
            disabled={readOnly}
          />
        </div>

        {/* DNI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.dni}
            onChange={(e) => onChange('dni', e.target.value)}
            className={inputClasses}
            placeholder="Ej: 12345678"
            disabled={readOnly}
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.telefono}
            onChange={(e) => onChange('telefono', e.target.value)}
            className={inputClasses}
            placeholder="Ej: 999 888 777"
            disabled={readOnly}
            required
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

        {/* Motivo de consulta */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de Consulta
          </label>
          <textarea
            value={data.motivoConsulta || ''}
            onChange={(e) => onChange('motivoConsulta', e.target.value)}
            className={`${inputClasses} resize-none`}
            rows={2}
            placeholder="Describa brevemente el motivo de la consulta..."
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};
