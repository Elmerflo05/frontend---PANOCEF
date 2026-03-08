/**
 * Componente unificado de Formulario de Laboratorio
 *
 * Este componente centraliza la funcionalidad del formulario de laboratorio
 * para los 5 flujos de usuario:
 *
 * 1. SuperAdmin: mode='pricing' - Configura precios
 * 2. Doctor: mode='edit', userRole='doctor' - Selecciona estudios en consulta
 * 3. Paciente: mode='view' - Ve lo que el doctor registró (solo lectura)
 * 4. Técnico Imagenología: mode='edit', showPrices=true - Crea solicitudes + ve precios
 * 5. Cliente Externo: mode='edit', showPatientSection=true - Envía solicitudes públicas
 */

import { Tomografia3DSection } from './sections/Tomografia3DSection';
import { RadiografiasSection } from './sections/RadiografiasSection';
import type { LaboratoryFormProps } from './types';

export const LaboratoryFormUnified = ({
  mode,
  userRole,
  showPatientSection = false,
  showDoctorSection = false,
  showPrices = false,
  colorTheme,
  tomografiaData,
  radiografiasData,
  patientData,
  doctorData,
  tomografiaPricing,
  radiografiasPricing,
  onTomografiaChange,
  onRadiografiasChange,
  onPatientChange,
  onDoctorChange,
  onTomografiaPricingChange,
  onRadiografiasPricingChange,
  onSave,
  onCancel,
  loading = false,
  error
}: LaboratoryFormProps) => {
  // Determinar tema de colores - siempre PanoCef (cyan/purple ya no se usan como diferenciador)
  const theme = colorTheme || 'cyan';

  // En modo pricing, mostrar los precios con showPrices automáticamente
  const shouldShowPrices = mode === 'pricing' || showPrices;

  return (
    <div className="space-y-6">
      {/* Mensaje de error si existe */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Sección de datos del paciente (para Cliente Externo y Técnico) */}
      {showPatientSection && patientData && onPatientChange && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
            Datos del Paciente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombres
              </label>
              <input
                type="text"
                value={patientData.nombres}
                onChange={(e) => onPatientChange('nombres', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Nombres del paciente"
                disabled={mode === 'view'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos
              </label>
              <input
                type="text"
                value={patientData.apellidos}
                onChange={(e) => onPatientChange('apellidos', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Apellidos del paciente"
                disabled={mode === 'view'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad
              </label>
              <input
                type="text"
                value={patientData.edad}
                onChange={(e) => onPatientChange('edad', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Edad"
                disabled={mode === 'view'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                value={patientData.dni}
                onChange={(e) => onPatientChange('dni', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Documento de identidad"
                disabled={mode === 'view'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={patientData.telefono}
                onChange={(e) => onPatientChange('telefono', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Teléfono de contacto"
                disabled={mode === 'view'}
              />
            </div>
            {patientData.email !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={patientData.email}
                  onChange={(e) => onPatientChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                  placeholder="Correo electrónico"
                  disabled={mode === 'view'}
                />
              </div>
            )}
            {patientData.motivoConsulta !== undefined && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de Consulta
                </label>
                <textarea
                  value={patientData.motivoConsulta}
                  onChange={(e) => onPatientChange('motivoConsulta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary resize-none"
                  rows={2}
                  placeholder="Motivo de la consulta"
                  disabled={mode === 'view'}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sección de Tomografía 3D */}
      <Tomografia3DSection
        mode={mode}
        colorTheme={theme}
        showPrices={shouldShowPrices && mode !== 'pricing'}
        formData={tomografiaData}
        onFormChange={onTomografiaChange}
        pricing={tomografiaPricing}
        onPricingChange={onTomografiaPricingChange}
        onSave={mode === 'pricing' ? onSave : undefined}
        loading={loading}
      />

      {/* Sección de Radiografías */}
      <RadiografiasSection
        mode={mode}
        colorTheme={theme}
        showPrices={shouldShowPrices && mode !== 'pricing'}
        formData={radiografiasData}
        onFormChange={onRadiografiasChange}
        pricing={radiografiasPricing}
        onPricingChange={onRadiografiasPricingChange}
        onSave={mode === 'pricing' ? onSave : undefined}
        loading={loading}
      />

      {/* Sección de datos del doctor (para Cliente Externo) */}
      {showDoctorSection && doctorData && onDoctorChange && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
            Datos del Odontólogo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombres
              </label>
              <input
                type="text"
                value={doctorData.nombres}
                onChange={(e) => onDoctorChange('nombres', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Nombres del doctor"
                disabled={mode === 'view'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos
              </label>
              <input
                type="text"
                value={doctorData.apellidos}
                onChange={(e) => onDoctorChange('apellidos', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Apellidos del doctor"
                disabled={mode === 'view'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                COP (Colegio Odontológico)
              </label>
              <input
                type="text"
                value={doctorData.cop}
                onChange={(e) => onDoctorChange('cop', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                placeholder="Número de colegiatura"
                disabled={mode === 'view'}
              />
            </div>
            {doctorData.especialidad !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={doctorData.especialidad}
                  onChange={(e) => onDoctorChange('especialidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                  placeholder="Especialidad médica"
                  disabled={mode === 'view'}
                />
              </div>
            )}
            {doctorData.telefono !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={doctorData.telefono}
                  onChange={(e) => onDoctorChange('telefono', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                  placeholder="Teléfono de contacto"
                  disabled={mode === 'view'}
                />
              </div>
            )}
            {doctorData.email !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={doctorData.email}
                  onChange={(e) => onDoctorChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                  placeholder="Correo electrónico"
                  disabled={mode === 'view'}
                />
              </div>
            )}
            {doctorData.direccion !== undefined && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={doctorData.direccion}
                  onChange={(e) => onDoctorChange('direccion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary"
                  placeholder="Dirección del consultorio"
                  disabled={mode === 'view'}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botones de acción (para modo edit/view) */}
      {mode !== 'pricing' && (onSave || onCancel) && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
          )}
          {onSave && mode === 'edit' && (
            <button
              onClick={onSave}
              disabled={loading}
              className="px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-panocef-primary hover:bg-panocef-dark"
            >
              {loading ? 'Guardando...' : 'Guardar Solicitud'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
