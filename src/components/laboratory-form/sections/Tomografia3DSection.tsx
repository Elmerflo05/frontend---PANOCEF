/**
 * Sección unificada de Tomografía 3D
 *
 * Maneja los 3 modos:
 * - pricing: Muestra inputs de precio (SuperAdmin)
 * - edit: Muestra checkboxes para selección con campos expandibles (Doctor, Técnico, Cliente Externo)
 * - view: Muestra checkboxes deshabilitados (Paciente)
 *
 * Compatible con la estructura del Doctor (DiagnosticPlanStep)
 */

import { FileImage, Save } from 'lucide-react';
import { PriceInputGroup } from '../components/PriceInputGroup';
import { CheckboxItem } from '../components/CheckboxItem';
import { RadioOption } from '../components/RadioOption';
import { SubsectionTitle } from '../components/SubsectionTitle';
import type {
  FormMode,
  Tomografia3DFormData,
  Tomografia3DPricing
} from '../types';

interface Tomografia3DSectionProps {
  mode: FormMode;
  colorTheme?: 'cyan' | 'purple';
  showPrices?: boolean;

  // Datos del formulario (para edit/view)
  formData?: Tomografia3DFormData;
  onFormChange?: (field: keyof Tomografia3DFormData, value: any) => void;

  // Precios (para pricing o showPrices)
  pricing?: Tomografia3DPricing;
  onPricingChange?: (field: keyof Tomografia3DPricing, value: number) => void;

  // Acciones
  onSave?: () => void;
  loading?: boolean;

  // Solo lectura (para Admin Sede en modo pricing)
  readOnly?: boolean;
}

export const Tomografia3DSection = ({
  mode,
  colorTheme = 'purple',
  showPrices = false,
  formData,
  onFormChange,
  pricing,
  onPricingChange,
  onSave,
  loading = false,
  readOnly = false
}: Tomografia3DSectionProps) => {
  const isReadOnly = mode === 'view' || readOnly;
  const isPricingMode = mode === 'pricing';

  const headerBg = colorTheme === 'cyan' ? 'bg-cyan-600' : 'bg-purple-600';
  const headerText = colorTheme === 'cyan' ? 'text-cyan-100' : 'text-purple-100';
  const buttonColor = colorTheme === 'cyan'
    ? 'bg-white text-cyan-600 hover:bg-cyan-50'
    : 'bg-white text-purple-600 hover:bg-purple-50';

  // Renderizar input de precio
  const renderPriceInput = (
    label: string,
    field: keyof Tomografia3DPricing
  ) => {
    if (!pricing) return null;
    // En modo readOnly, mostrar el valor sin permitir edición
    if (isReadOnly) {
      return (
        <PriceInputGroup
          label={label}
          value={pricing[field]}
          onChange={() => {}}
          disabled={true}
        />
      );
    }
    if (!onPricingChange) return null;
    return (
      <PriceInputGroup
        label={label}
        value={pricing[field]}
        onChange={(val) => onPricingChange(field, val)}
        disabled={loading}
      />
    );
  };

  // Renderizar checkbox con precio opcional
  const renderCheckbox = (
    label: string,
    field: keyof Tomografia3DFormData,
    priceField?: keyof Tomografia3DPricing,
    children?: React.ReactNode
  ) => {
    if (!formData) return null;
    // En modo view no necesitamos onFormChange
    if (!isReadOnly && !onFormChange) return null;
    return (
      <CheckboxItem
        label={label}
        checked={formData[field] as boolean}
        onChange={(val) => onFormChange?.(field, val)}
        disabled={isReadOnly}
        showPrice={showPrices && !!priceField}
        price={priceField && pricing ? pricing[priceField] : undefined}
        colorTheme={colorTheme}
      >
        {children}
      </CheckboxItem>
    );
  };

  // ============================================================================
  // MODO PRICING (SuperAdmin)
  // ============================================================================
  if (isPricingMode) {
    return (
      <div className="bg-cyan-50 border border-cyan-200 p-6 mb-6 rounded-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-cyan-400">
          <div className="flex items-center gap-3">
            <FileImage className="w-6 h-6 text-cyan-700" />
            <h2 className="text-lg font-bold text-cyan-900">Paso 1: Tomografía 3D</h2>
            {isReadOnly && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                Solo lectura
              </span>
            )}
          </div>
          {onSave && !isReadOnly && (
            <button
              onClick={onSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Tipo de Entrega */}
          <div className="bg-white border border-gray-200 p-4 rounded">
            <SubsectionTitle title="Tipo de Estudio" colorTheme="gray" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderPriceInput('Con Informe', 'conInforme')}
              {renderPriceInput('Sin Informe', 'sinInforme')}
              {renderPriceInput('DICOM', 'dicom')}
              {renderPriceInput('Solo USB', 'soloUsb')}
            </div>
          </div>

          {/* Campo Pequeño */}
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <SubsectionTitle title="Campos Pequeños" colorTheme="green" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {renderPriceInput('Endodoncia', 'endodoncia')}
              {renderPriceInput('Fractura Radicular', 'fracturaRadicular')}
              {renderPriceInput('Anatomía Endodóntica', 'anatomiaEndodontica')}
            </div>
          </div>

          {/* Campo Mediano */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <SubsectionTitle title="Campos Medianos" colorTheme="yellow" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {renderPriceInput('Localización de Diente', 'localizacionDiente')}
              {renderPriceInput('Implantes', 'implantes')}
              {renderPriceInput('Maxilar Superior', 'maxilarSuperior')}
            </div>
          </div>

          {/* Campo Mediano/Grande */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded">
            <SubsectionTitle title="Campos Medianos-Grandes" colorTheme="orange" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderPriceInput('Vía Aérea', 'viaAerea')}
              {renderPriceInput('Ortognática', 'ortognatica')}
            </div>
          </div>

          {/* Ortodoncia */}
          <div className="bg-purple-50 border border-purple-200 p-4 rounded">
            <SubsectionTitle title="Ortodoncia" colorTheme="purple" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderPriceInput('MARPE', 'marpe')}
              {renderPriceInput('Mini Implantes', 'miniImplantes')}
            </div>
          </div>

          {/* Otras Opciones */}
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <SubsectionTitle title="Otras Opciones" colorTheme="red" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderPriceInput('ATM', 'atm')}
              {renderPriceInput('Macizo Facial', 'macizoFacial')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODO EDIT/VIEW (Doctor, Técnico, Cliente Externo, Paciente)
  // ============================================================================
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`${headerBg} p-5 text-white flex items-center justify-between`}>
        <div>
          <h2 className="text-xl font-bold">Paso 1: Tomografía 3D</h2>
          <p className={`text-sm ${headerText}`}>PanoCef - Centro de Imágenes Dentomaxilofacial</p>
        </div>
        {onSave && !isReadOnly && (
          <button
            onClick={onSave}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 ${buttonColor} rounded-lg transition-colors font-medium disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Tipo de Entrega */}
        <div className={`rounded-lg p-5 border ${colorTheme === 'cyan' ? 'bg-cyan-50/50 border-cyan-200' : 'bg-purple-50/50 border-purple-200'}`}>
          <h3 className={`font-semibold mb-4 ${colorTheme === 'cyan' ? 'text-cyan-900' : 'text-purple-900'}`}>
            Tipo de Entrega
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox('Con Informe', 'conInforme', 'conInforme')}
            {renderCheckbox('Sin Informe', 'sinInforme', 'sinInforme')}
            {renderCheckbox('DICOM', 'dicom', 'dicom')}
            {renderCheckbox('Solo USB', 'soloUsb', 'soloUsb')}
          </div>
        </div>

        {/* CAMPO PEQUEÑO */}
        <div className="bg-green-50/50 rounded-lg p-5 border border-green-200">
          <SubsectionTitle title="CAMPO PEQUEÑO" colorTheme="green" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCheckbox('Endodoncia', 'endodoncia', 'endodoncia',
              formData?.endodoncia && onFormChange && (
                <input
                  type="text"
                  value={formData.numeroPiezasEndo || ''}
                  onChange={(e) => onFormChange('numeroPiezasEndo', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  placeholder="N° Piezas"
                  disabled={isReadOnly}
                />
              )
            )}
            {renderCheckbox('Fractura Radicular', 'fracturaRadicular', 'fracturaRadicular',
              formData?.fracturaRadicular && onFormChange && (
                <input
                  type="text"
                  value={formData.numeroPiezasFractura || ''}
                  onChange={(e) => onFormChange('numeroPiezasFractura', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  placeholder="N° Piezas"
                  disabled={isReadOnly}
                />
              )
            )}
            {renderCheckbox('Anatomía Endodóntica', 'anatomiaEndodontica', 'anatomiaEndodontica',
              formData?.anatomiaEndodontica && onFormChange && (
                <input
                  type="text"
                  value={formData.numeroPiezasAnatEndo || ''}
                  onChange={(e) => onFormChange('numeroPiezasAnatEndo', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  placeholder="N° Piezas"
                  disabled={isReadOnly}
                />
              )
            )}
          </div>
        </div>

        {/* CAMPO MEDIANO */}
        <div className="bg-yellow-50/50 rounded-lg p-5 border border-yellow-200">
          <SubsectionTitle title="CAMPO MEDIANO" colorTheme="yellow" />
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderCheckbox('Localización de Diente Incluido', 'localizacionDiente', 'localizacionDiente',
                formData?.localizacionDiente && onFormChange && (
                  <input
                    type="text"
                    value={formData.numeroPiezasLoc || ''}
                    onChange={(e) => onFormChange('numeroPiezasLoc', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    placeholder="N° Piezas"
                    disabled={isReadOnly}
                  />
                )
              )}

              {/* Implantes con subopciones */}
              {renderCheckbox('Implantes', 'implantes', 'implantes',
                formData?.implantes && onFormChange && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.numeroCortes || ''}
                      onChange={(e) => onFormChange('numeroCortes', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                      placeholder="N° Cortes"
                      disabled={isReadOnly}
                    />
                    <CheckboxItem
                      label="Con guía QX"
                      checked={formData.conGuiaQx || false}
                      onChange={(val) => onFormChange('conGuiaQx', val)}
                      disabled={isReadOnly}
                      colorTheme={colorTheme}
                    >
                      {formData.conGuiaQx && (
                        <div className="space-y-1.5">
                          <RadioOption
                            label="Guía Tomográfica"
                            name="tipoGuiaImplante"
                            value="guiaTomografica"
                            checked={formData.tipoGuiaImplante === 'guiaTomografica'}
                            onChange={(val) => onFormChange('tipoGuiaImplante', val)}
                            disabled={isReadOnly}
                            colorTheme={colorTheme}
                          />
                          <RadioOption
                            label="Sin Guía"
                            name="tipoGuiaImplante"
                            value="sinGuia"
                            checked={formData.tipoGuiaImplante === 'sinGuia'}
                            onChange={(val) => onFormChange('tipoGuiaImplante', val)}
                            disabled={isReadOnly}
                            colorTheme={colorTheme}
                          />
                        </div>
                      )}
                    </CheckboxItem>
                  </div>
                )
              )}
            </div>

            {renderCheckbox('Maxilar Superior o Inferior (Sin informe)', 'maxilarSuperior', 'maxilarSuperior')}
          </div>
        </div>

        {/* CAMPO MEDIANO/GRANDE */}
        <div className="bg-orange-50/50 rounded-lg p-5 border border-orange-200">
          <SubsectionTitle title="CAMPO MEDIANO/GRANDE" colorTheme="orange" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Vía Aérea con subopciones */}
            {renderCheckbox('Vía Aérea', 'viaAerea', 'viaAerea',
              formData?.viaAerea && onFormChange && (
                <div className="space-y-1.5">
                  <RadioOption
                    label="Con guía"
                    name="tipoGuiaViaAerea"
                    value="conGuia"
                    checked={formData.tipoGuiaViaAerea === 'conGuia'}
                    onChange={(val) => onFormChange('tipoGuiaViaAerea', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                  <RadioOption
                    label="Sin guía"
                    name="tipoGuiaViaAerea"
                    value="sinGuia"
                    checked={formData.tipoGuiaViaAerea === 'sinGuia'}
                    onChange={(val) => onFormChange('tipoGuiaViaAerea', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                </div>
              )
            )}

            {/* Ortognática con subopciones */}
            {renderCheckbox('Ortognática', 'ortognatica', 'ortognatica',
              formData?.ortognatica && onFormChange && (
                <div className="space-y-1.5">
                  <RadioOption
                    label="Con guía"
                    name="tipoOrtognatica"
                    value="conGuia"
                    checked={formData.tipoOrtognatica === 'conGuia'}
                    onChange={(val) => onFormChange('tipoOrtognatica', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                  <RadioOption
                    label="Sin guía"
                    name="tipoOrtognatica"
                    value="sinGuia"
                    checked={formData.tipoOrtognatica === 'sinGuia'}
                    onChange={(val) => onFormChange('tipoOrtognatica', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                  <RadioOption
                    label="Con planificación quirúrgica que incluya splint quirúrgico"
                    name="tipoOrtognatica"
                    value="conPlanificacionQuirurgica"
                    checked={formData.tipoOrtognatica === 'conPlanificacionQuirurgica'}
                    onChange={(val) => onFormChange('tipoOrtognatica', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* ORTODONCIA */}
        <div className="bg-indigo-50/50 rounded-lg p-5 border border-indigo-200">
          <SubsectionTitle title="ORTODONCIA" colorTheme="indigo" />
          <div className="space-y-3">
            {renderCheckbox('MARPE', 'marpe', 'marpe')}

            {/* Mini-implantes con subopciones */}
            {renderCheckbox('Mini-implantes', 'miniImplantes', 'miniImplantes',
              formData?.miniImplantes && onFormChange && (
                <div className="space-y-2">
                  <CheckboxItem
                    label="Intra-alveolares"
                    checked={formData.intraAlveolares || false}
                    onChange={(val) => onFormChange('intraAlveolares', val)}
                    disabled={isReadOnly}
                    colorTheme="indigo"
                  />
                  <CheckboxItem
                    label="Extra-alveolares"
                    checked={formData.extraAlveolares || false}
                    onChange={(val) => onFormChange('extraAlveolares', val)}
                    disabled={isReadOnly}
                    colorTheme="indigo"
                  />
                  <CheckboxItem
                    label="Infracigomático"
                    checked={formData.infracigomatico || false}
                    onChange={(val) => onFormChange('infracigomatico', val)}
                    disabled={isReadOnly}
                    colorTheme="indigo"
                  />
                  <CheckboxItem
                    label="Buccal Shelf"
                    checked={formData.buccalShelf || false}
                    onChange={(val) => onFormChange('buccalShelf', val)}
                    disabled={isReadOnly}
                    colorTheme="indigo"
                  />
                </div>
              )
            )}

            {/* Opciones de guía (si alguna opción de ortodoncia está seleccionada) */}
            {formData && (formData.marpe || formData.miniImplantes) && onFormChange && (
              <div className="pt-3 mt-3 space-y-4 border-t border-gray-200">
                <div className="p-4 border-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                  <p className="mb-3 text-sm font-semibold text-gray-900">¿Con guía o Sin guía?</p>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 p-3 transition-colors border-2 rounded-lg cursor-pointer hover:bg-amber-100 flex-1">
                      <input
                        type="radio"
                        name="tipoGuiaOrtodoncia"
                        checked={formData.tipoGuiaOrtodoncia === 'conGuia'}
                        onChange={() => onFormChange('tipoGuiaOrtodoncia', 'conGuia')}
                        className="text-amber-600 border-gray-300 focus:ring-amber-500"
                        disabled={isReadOnly}
                      />
                      <span className="text-sm font-medium">Con guía</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 transition-colors border-2 rounded-lg cursor-pointer hover:bg-amber-100 flex-1">
                      <input
                        type="radio"
                        name="tipoGuiaOrtodoncia"
                        checked={formData.tipoGuiaOrtodoncia === 'sinGuia'}
                        onChange={() => onFormChange('tipoGuiaOrtodoncia', 'sinGuia')}
                        className="text-amber-600 border-gray-300 focus:ring-amber-500"
                        disabled={isReadOnly}
                      />
                      <span className="text-sm font-medium">Sin guía</span>
                    </label>
                  </div>
                </div>

                {/* Segunda pregunta: ¿Impreso o Digital? */}
                {formData.tipoGuiaOrtodoncia === 'conGuia' && (
                  <div className="p-4 border-2 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                    <p className="mb-3 text-sm font-semibold text-gray-900">¿Impreso o No impreso (digital)?</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 p-3 transition-colors border-2 rounded-lg cursor-pointer hover:bg-blue-100 flex-1">
                        <input
                          type="radio"
                          name="guiaImpresa"
                          checked={formData.guiaImpresa === 'impreso'}
                          onChange={() => onFormChange('guiaImpresa', 'impreso')}
                          className="text-blue-600 border-gray-300 focus:ring-blue-500"
                          disabled={isReadOnly}
                        />
                        <span className="text-sm font-medium">Impreso</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 transition-colors border-2 rounded-lg cursor-pointer hover:bg-blue-100 flex-1">
                        <input
                          type="radio"
                          name="guiaImpresa"
                          checked={formData.guiaImpresa === 'digital'}
                          onChange={() => onFormChange('guiaImpresa', 'digital')}
                          className="text-blue-600 border-gray-300 focus:ring-blue-500"
                          disabled={isReadOnly}
                        />
                        <span className="text-sm font-medium">No impreso (digital)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* OTRAS OPCIONES */}
        <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-200">
          <SubsectionTitle title="OTRAS OPCIONES" colorTheme="blue" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* ATM con subopciones */}
            {renderCheckbox('ATM', 'atm', 'atm',
              formData?.atm && onFormChange && (
                <div className="space-y-1.5">
                  <RadioOption
                    label="Boca abierta"
                    name="tipoAtm"
                    value="bocaAbierta"
                    checked={formData.tipoAtm === 'bocaAbierta'}
                    onChange={(val) => onFormChange('tipoAtm', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                  <RadioOption
                    label="Boca cerrada"
                    name="tipoAtm"
                    value="bocaCerrada"
                    checked={formData.tipoAtm === 'bocaCerrada'}
                    onChange={(val) => onFormChange('tipoAtm', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                </div>
              )
            )}

            {/* Macizo Facial con subopciones */}
            {renderCheckbox('Macizo Facial', 'macizoFacial', 'macizoFacial',
              formData?.macizoFacial && onFormChange && (
                <div className="space-y-1.5">
                  <RadioOption
                    label="Tercio medio superior"
                    name="tipoMacizoFacial"
                    value="tercioMedioSuperior"
                    checked={formData.tipoMacizoFacial === 'tercioMedioSuperior'}
                    onChange={(val) => onFormChange('tipoMacizoFacial', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                  <RadioOption
                    label="Tercio medio inferior"
                    name="tipoMacizoFacial"
                    value="tercioMedioInferior"
                    checked={formData.tipoMacizoFacial === 'tercioMedioInferior'}
                    onChange={(val) => onFormChange('tipoMacizoFacial', val)}
                    disabled={isReadOnly}
                    colorTheme={colorTheme}
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* Otros (especificar) */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Otros (especificar)</h3>
          <textarea
            value={formData?.otros || ''}
            onChange={(e) => onFormChange?.('otros', e.target.value)}
            className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 ${
              colorTheme === 'cyan' ? 'focus:ring-cyan-500 focus:border-cyan-500' : 'focus:ring-purple-500 focus:border-purple-500'
            }`}
            rows={3}
            placeholder="Especifique otros estudios..."
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
};
