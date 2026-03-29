/**
 * Sección unificada de Radiografías - VERSIÓN COMPLETA
 *
 * Maneja los 3 modos:
 * - pricing: Muestra inputs de precio (SuperAdmin)
 * - edit: Muestra checkboxes para selección + selector de dientes (Doctor, Técnico, Cliente Externo)
 * - view: Muestra checkboxes deshabilitados (Paciente)
 *
 * Estructura exacta según el formulario del Técnico de Imágenes:
 * - INTRAORALES (Periapical FÍSICO/DIGITAL, Bitewing, Oclusal, Seriada, Fotografías)
 * - EXTRAORALES (FÍSICO/DIGITAL, Panorámica, Cefalométrica, Carpal, Posterior Anterior, ATM)
 * - ASESORÍA ORTODONCIA (Paquetes, Plan tratamiento, Servicios adicionales)
 * - MODELOS DE ESTUDIO 3D
 * - ANÁLISIS CEFALOMÉTRICOS
 */

import { useState, useEffect } from 'react';
import { FileImage, Save, ChevronDown, ChevronUp, Check, DollarSign } from 'lucide-react';
import { PriceInputGroup } from '../components/PriceInputGroup';
import { CheckboxItem } from '../components/CheckboxItem';
import { SubsectionTitle } from '../components/SubsectionTitle';
import { PeriapicalSection } from './PeriapicalSection';
import type {
  FormMode,
  RadiografiasFormData,
  RadiografiasPricing
} from '../types';

interface RadiogragrafiasSectionProps {
  mode: FormMode;
  colorTheme?: 'cyan' | 'purple' | 'teal' | 'indigo';
  showPrices?: boolean;

  // Datos del formulario (para edit/view)
  formData?: RadiografiasFormData;
  onFormChange?: (field: keyof RadiografiasFormData, value: any) => void;

  // Precios (para pricing o showPrices)
  pricing?: RadiografiasPricing;
  onPricingChange?: (field: keyof RadiografiasPricing, value: number) => void;

  // Acciones
  onSave?: () => void;
  loading?: boolean;

  // Solo lectura (para Admin Sede en modo pricing)
  readOnly?: boolean;
}

export const RadiografiasSection = ({
  mode,
  colorTheme = 'indigo',
  showPrices = false,
  formData,
  onFormChange,
  pricing,
  onPricingChange,
  onSave,
  loading = false,
  readOnly = false
}: RadiogragrafiasSectionProps) => {
  const isReadOnly = mode === 'view' || readOnly;
  const isPricingMode = mode === 'pricing';

  // Estados para el selector de dientes periapical
  const [modoFisicoActivo, setModoFisicoActivo] = useState(
    (formData?.periapicalFisico?.length ?? 0) > 0
  );
  const [modoDigitalActivo, setModoDigitalActivo] = useState(
    (formData?.periapicalDigital?.length ?? 0) > 0
  );

  // Estados para secciones expandibles
  const [expandedSections, setExpandedSections] = useState({
    fotografias: false,
    carpal: false,
    posteriorAnterior: false,
    alineadores: false,
    escaneoDigital: false,
    modelos3d: false
  });

  // Sincronizar estados cuando cambian los datos del formulario
  useEffect(() => {
    setModoFisicoActivo((formData?.periapicalFisico?.length ?? 0) > 0);
    setModoDigitalActivo((formData?.periapicalDigital?.length ?? 0) > 0);
  }, [formData?.periapicalFisico?.length, formData?.periapicalDigital?.length]);

  // Handlers para el selector de dientes
  const handleToggleModoFisico = () => {
    const newState = !modoFisicoActivo;
    setModoFisicoActivo(newState);
    if (!newState && onFormChange) {
      onFormChange('periapicalFisico', []);
    }
  };

  const handleToggleModoDigital = () => {
    const newState = !modoDigitalActivo;
    setModoDigitalActivo(newState);
    if (!newState && onFormChange) {
      onFormChange('periapicalDigital', []);
    }
  };

  const handleToggleToothFisico = (toothNumber: number) => {
    if (!onFormChange || !formData) return;
    const currentTeeth = formData.periapicalFisico || [];
    const newTeeth = currentTeeth.includes(toothNumber)
      ? currentTeeth.filter(t => t !== toothNumber)
      : [...currentTeeth, toothNumber];
    onFormChange('periapicalFisico', newTeeth);
  };

  const handleToggleToothDigital = (toothNumber: number) => {
    if (!onFormChange || !formData) return;
    const currentTeeth = formData.periapicalDigital || [];
    const newTeeth = currentTeeth.includes(toothNumber)
      ? currentTeeth.filter(t => t !== toothNumber)
      : [...currentTeeth, toothNumber];
    onFormChange('periapicalDigital', newTeeth);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Renderizar input de precio
  const renderPriceInput = (
    label: string,
    field: keyof RadiografiasPricing
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

  // Renderizar checkbox simple
  const renderCheckbox = (
    label: string,
    field: keyof RadiografiasFormData,
    priceField?: keyof RadiografiasPricing,
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
        colorTheme="panocef"
      >
        {children}
      </CheckboxItem>
    );
  };

  // Renderizar checkbox con sub-opciones expandibles
  const renderExpandableCheckbox = (
    label: string,
    field: keyof RadiografiasFormData,
    sectionKey: keyof typeof expandedSections,
    children: React.ReactNode,
    priceField?: keyof RadiografiasPricing
  ) => {
    if (!formData) return null;
    // En modo view no necesitamos onFormChange
    if (!isReadOnly && !onFormChange) return null;
    const isChecked = formData[field] as boolean;
    const isExpanded = expandedSections[sectionKey];

    // Estilos diferenciados para modo lectura
    const getContainerStyles = () => {
      if (isReadOnly) {
        if (isChecked) {
          return 'border-2 border-panocef-primary bg-panocef-light shadow-sm';
        } else {
          return 'border border-gray-200 bg-gray-50/50 opacity-40';
        }
      }
      return `border border-gray-200 ${isChecked ? 'bg-panocef-light' : 'bg-white hover:bg-gray-50'}`;
    };

    const getLabelStyles = () => {
      if (isReadOnly) {
        if (isChecked) {
          return 'font-semibold text-panocef-dark';
        } else {
          return 'font-normal text-gray-400';
        }
      }
      return 'font-medium text-gray-800';
    };

    return (
      <div className={`rounded-lg overflow-hidden ${getContainerStyles()}`}>
        <div
          className={`flex items-center justify-between p-3 ${isReadOnly ? '' : 'cursor-pointer'} transition-colors`}
          onClick={() => {
            if (isReadOnly) return;
            if (!isChecked) {
              onFormChange?.(field, true);
            }
            toggleSection(sectionKey);
          }}
        >
          <label className={`flex items-center gap-3 ${isReadOnly ? '' : 'cursor-pointer'} flex-1`}>
            {isReadOnly ? (
              // En modo lectura, mostrar icono visual en lugar de checkbox
              isChecked ? (
                <span className="w-5 h-5 rounded bg-panocef-light0 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </span>
              ) : (
                <span className="w-5 h-5 rounded border-2 border-gray-300 bg-gray-100" />
              )
            ) : (
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  onFormChange?.(field, e.target.checked);
                  if (e.target.checked && !isExpanded) {
                    toggleSection(sectionKey);
                  }
                }}
                className="w-4 h-4 text-panocef-primary border-gray-300 rounded focus:ring-panocef-primary"
              />
            )}
            <span className={getLabelStyles()}>{label}</span>
            {showPrices && priceField && pricing && pricing[priceField] !== undefined && (
              <span className={`flex items-center gap-1 text-sm ${isReadOnly && !isChecked ? 'text-gray-300' : 'text-gray-500'}`}>
                <DollarSign className="w-3 h-3" />
                {pricing[priceField].toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </label>
          {isChecked && (
            <button
              type="button"
              className="p-1 text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(sectionKey);
              }}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
        {isChecked && isExpanded && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // MODO PRICING (SuperAdmin)
  // ============================================================================
  if (isPricingMode) {
    return (
      <div className="bg-panocef-light border border-panocef-secondary p-6 mb-6 rounded-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-panocef-primary">
          <div className="flex items-center gap-3">
            <FileImage className="w-6 h-6 text-panocef-primary" />
            <h2 className="text-lg font-bold text-panocef-dark">Paso 2: Radiografías</h2>
            {isReadOnly && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                Solo lectura
              </span>
            )}
          </div>
          {onSave && !isReadOnly && (
            <button
              onClick={() => {
                console.log('[RadiografiasSection] Botón Guardar clickeado');
                onSave();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-panocef-primary text-white rounded hover:bg-panocef-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Intraorales - Periapical */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <SubsectionTitle title="INTRAORALES - PERIAPICAL" colorTheme="blue" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderPriceInput('Periapical Físico (por grupo hasta 3 dientes)', 'periapicalFisico')}
              {renderPriceInput('Periapical Digital (por diente)', 'periapicalDigital')}
            </div>
          </div>

          {/* Bitewing */}
          <div className="bg-panocef-light border border-panocef-secondary p-4 rounded">
            <SubsectionTitle title="BITEWING" colorTheme="panocef" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderPriceInput('Bitewing Molares (por lado)', 'bitewingMolares')}
              {renderPriceInput('Bitewing Premolares (por lado)', 'bitewingPremolares')}
            </div>
          </div>

          {/* Oclusal */}
          <div className="bg-panocef-light border border-panocef-secondary p-4 rounded">
            <SubsectionTitle title="OCLUSAL" colorTheme="panocef" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderPriceInput('Oclusal Superiores', 'oclusalSuperiores')}
              {renderPriceInput('Oclusal Inferiores', 'oclusalInferiores')}
            </div>
          </div>

          {/* Otras Intraorales */}
          <div className="bg-pink-50 border border-pink-200 p-4 rounded">
            <SubsectionTitle title="OTRAS INTRAORALES" colorTheme="pink" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {renderPriceInput('Seriada', 'seriada')}
              {renderPriceInput('Fotografía Intraoral', 'fotografiaIntraoral')}
              {renderPriceInput('Fotografía Extraoral', 'fotografiaExtraoral')}
            </div>
          </div>

          {/* Extraorales */}
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <SubsectionTitle title="EXTRAORALES" colorTheme="green" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {renderPriceInput('Radiografía Panorámica', 'panoramica')}
              {renderPriceInput('Radiografía Cefalométrica', 'cefalometrica')}
              {renderPriceInput('Radiografía Carpal', 'carpal')}
              {renderPriceInput('Posterior Anterior (Frontal)', 'posteriorAnterior')}
              {renderPriceInput('Estudio ATM (Boca abierta)', 'atmAbierta')}
              {renderPriceInput('Estudio ATM (Boca cerrada)', 'atmCerrada')}
            </div>
          </div>

          {/* Paquetes Ortodoncia */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded">
            <SubsectionTitle title="PAQUETES ORTODONCIA" colorTheme="orange" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderPriceInput('Paquete 1 Con Asesoría', 'paq1ConAsesoria')}
                {renderPriceInput('Paquete 1 Sin Asesoría', 'paq1SinAsesoria')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderPriceInput('Paquete 2 Con Asesoría', 'paq2ConAsesoria')}
                {renderPriceInput('Paquete 2 Sin Asesoría', 'paq2SinAsesoria')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderPriceInput('Paquete 3 Con Asesoría', 'paq3ConAsesoria')}
                {renderPriceInput('Paquete 3 Sin Asesoría', 'paq3SinAsesoria')}
              </div>
            </div>
          </div>

          {/* Servicios Adicionales */}
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <SubsectionTitle title="SERVICIOS ADICIONALES" colorTheme="red" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {renderPriceInput('Alineadores Invisibles', 'alineadores')}
              {renderPriceInput('Escaneo Intraoral Digital', 'escaneoIntraoral')}
              {renderPriceInput('Modelos Digitales 3D', 'modelosDigitales')}
            </div>
          </div>

          {/* Análisis Cefalométricos */}
          <div className="bg-panocef-light border border-panocef-secondary p-4 rounded">
            <SubsectionTitle title="ANÁLISIS CEFALOMÉTRICOS" colorTheme="panocef" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {renderPriceInput('Ricketts', 'ricketts')}
              {renderPriceInput('Schwartz', 'schwartz')}
              {renderPriceInput('Steiner', 'steiner')}
              {renderPriceInput('Mc Namara', 'mcNamara')}
              {renderPriceInput('Tweed', 'tweed')}
              {renderPriceInput('Downs', 'downs')}
              {renderPriceInput('Bjorks', 'bjorks')}
              {renderPriceInput('U.S.P', 'usp')}
              {renderPriceInput('Rot-h-Jarabak', 'rotJarabak')}
              {renderPriceInput('Tejidos Blancos', 'tejidosBlancos')}
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
      <div className="bg-panocef-primary p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileImage className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">Paso 2: Radiografías</h2>
            <p className="text-sm text-panocef-light">PanoCef - Centro de Imágenes Dentomaxilofacial</p>
          </div>
        </div>
        <div className="text-sm text-panocef-light">Paso 2 de 2</div>
      </div>

      <div className="p-6 space-y-6">
        {/* ================================================================== */}
        {/* SECCIÓN INTRAORALES */}
        {/* ================================================================== */}
        <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-200">
          <SubsectionTitle title="INTRAORALES" colorTheme="blue" />

          {/* PERIAPICAL - Selector de dientes */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-blue-900 mb-3">PERIAPICAL</h4>
            <PeriapicalSection
              modoFisicoActivo={modoFisicoActivo}
              modoDigitalActivo={modoDigitalActivo}
              selectedTeethFisico={formData?.periapicalFisico || []}
              selectedTeethDigital={formData?.periapicalDigital || []}
              onToggleModoFisico={handleToggleModoFisico}
              onToggleModoDigital={handleToggleModoDigital}
              onToggleToothFisico={handleToggleToothFisico}
              onToggleToothDigital={handleToggleToothDigital}
              readOnly={isReadOnly}
              showPrices={showPrices}
              pricing={pricing}
            />
          </div>

          {/* BITEWING */}
          <div className="mb-6 pt-4 border-t border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 mb-3">BITEWING</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-2">Molares</h5>
                <div className="flex gap-2">
                  <CheckboxItem
                    label="D"
                    checked={formData?.bitewingMolaresDerecha || false}
                    onChange={(val) => onFormChange?.('bitewingMolaresDerecha', val)}
                    disabled={isReadOnly}
                    showPrice={showPrices}
                    price={pricing?.bitewingMolares}
                    colorTheme="panocef"
                  />
                  <CheckboxItem
                    label="I"
                    checked={formData?.bitewingMolaresIzquierda || false}
                    onChange={(val) => onFormChange?.('bitewingMolaresIzquierda', val)}
                    disabled={isReadOnly}
                    showPrice={showPrices}
                    price={pricing?.bitewingMolares}
                    colorTheme="panocef"
                  />
                </div>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-2">Premolares</h5>
                <div className="flex gap-2">
                  <CheckboxItem
                    label="D"
                    checked={formData?.bitewingPremolaresDerecha || false}
                    onChange={(val) => onFormChange?.('bitewingPremolaresDerecha', val)}
                    disabled={isReadOnly}
                    showPrice={showPrices}
                    price={pricing?.bitewingPremolares}
                    colorTheme="panocef"
                  />
                  <CheckboxItem
                    label="I"
                    checked={formData?.bitewingPremolaresIzquierda || false}
                    onChange={(val) => onFormChange?.('bitewingPremolaresIzquierda', val)}
                    disabled={isReadOnly}
                    showPrice={showPrices}
                    price={pricing?.bitewingPremolares}
                    colorTheme="panocef"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* OCLUSAL */}
          <div className="mb-6 pt-4 border-t border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 mb-3">OCLUSAL</h4>
            <div className="flex gap-4">
              {renderCheckbox('Superiores', 'oclusalSuperiores', 'oclusalSuperiores')}
              {renderCheckbox('Inferiores', 'oclusalInferiores', 'oclusalInferiores')}
            </div>
          </div>

          {/* SERIADA */}
          <div className="mb-4 pt-4 border-t border-blue-200">
            {renderCheckbox('Seriada', 'seriada', 'seriada')}
          </div>

          {/* FOTOGRAFÍAS */}
          <div className="pt-4 border-t border-blue-200">
            {renderExpandableCheckbox(
              'Fotografías',
              'fotografias',
              'fotografias',
              <div className="space-y-2 ml-4">
                <CheckboxItem
                  label="Fotografía Intraoral"
                  checked={formData?.fotografiaIntraoral || false}
                  onChange={(val) => onFormChange?.('fotografiaIntraoral', val)}
                  disabled={isReadOnly}
                  showPrice={showPrices}
                  price={pricing?.fotografiaIntraoral}
                  colorTheme="panocef"
                />
                <CheckboxItem
                  label="Fotografía Extraoral"
                  checked={formData?.fotografiaExtraoral || false}
                  onChange={(val) => onFormChange?.('fotografiaExtraoral', val)}
                  disabled={isReadOnly}
                  showPrice={showPrices}
                  price={pricing?.fotografiaExtraoral}
                  colorTheme="panocef"
                />
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* SECCIÓN EXTRAORALES */}
        {/* ================================================================== */}
        <div className="bg-green-50/50 rounded-lg p-5 border border-green-200">
          <SubsectionTitle title="EXTRAORALES" colorTheme="green" />

          {/* Tipo FÍSICO/DIGITAL */}
          <div className="mb-4 flex gap-3">
            {(() => {
              const isFisicoSelected = (formData?.extraoralTipo || []).includes('fisico');
              const getButtonStyles = (isSelected: boolean) => {
                if (isReadOnly) {
                  if (isSelected) {
                    return 'bg-green-500 text-white shadow-md border-2 border-green-600';
                  } else {
                    return 'bg-gray-100 border border-gray-200 text-gray-400 opacity-40';
                  }
                }
                return isSelected
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50';
              };
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (isReadOnly) return;
                    const current = formData?.extraoralTipo || [];
                    const newVal = current.includes('fisico')
                      ? current.filter(t => t !== 'fisico')
                      : [...current, 'fisico'];
                    onFormChange?.('extraoralTipo', newVal);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${getButtonStyles(isFisicoSelected)} ${isReadOnly ? 'cursor-default' : ''}`}
                  disabled={isReadOnly}
                >
                  FÍSICO
                </button>
              );
            })()}
            {(() => {
              const isDigitalSelected = (formData?.extraoralTipo || []).includes('digital');
              const getButtonStyles = (isSelected: boolean) => {
                if (isReadOnly) {
                  if (isSelected) {
                    return 'bg-green-500 text-white shadow-md border-2 border-green-600';
                  } else {
                    return 'bg-gray-100 border border-gray-200 text-gray-400 opacity-40';
                  }
                }
                return isSelected
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50';
              };
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (isReadOnly) return;
                    const current = formData?.extraoralTipo || [];
                    const newVal = current.includes('digital')
                      ? current.filter(t => t !== 'digital')
                      : [...current, 'digital'];
                    onFormChange?.('extraoralTipo', newVal);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${getButtonStyles(isDigitalSelected)} ${isReadOnly ? 'cursor-default' : ''}`}
                  disabled={isReadOnly}
                >
                  DIGITAL
                </button>
              );
            })()}
          </div>

          <div className="space-y-3">
            {/* Radiografía Panorámica */}
            {renderCheckbox('Radiografía Panorámica', 'extraoralPanoramica', 'panoramica')}

            {/* Radiografía Cefalométrica */}
            {renderCheckbox('Radiografía Cefalométrica', 'extraoralCefalometrica', 'cefalometrica')}

            {/* Radiografía Carpal (edad Osea) */}
            {renderExpandableCheckbox(
              'Radiografía Carpal (edad Osea)',
              'extraoralCarpal',
              'carpal',
              <div className="space-y-2 ml-4">
                <CheckboxItem
                  label="Fishman"
                  checked={formData?.carpalFishman || false}
                  onChange={(val) => onFormChange?.('carpalFishman', val)}
                  disabled={isReadOnly}
                  colorTheme="panocef"
                />
                <CheckboxItem
                  label="TTW2"
                  checked={formData?.carpalTtw2 || false}
                  onChange={(val) => onFormChange?.('carpalTtw2', val)}
                  disabled={isReadOnly}
                  colorTheme="panocef"
                />
              </div>,
              'carpal'
            )}

            {/* Radiografía Posterior Anterior (Frontal) */}
            {renderExpandableCheckbox(
              'Radiografía Posterior Anterior (Frontal)',
              'extraoralPosteriorAnterior',
              'posteriorAnterior',
              <div className="ml-4">
                <CheckboxItem
                  label="Ricketts"
                  checked={formData?.posteriorAnteriorRicketts || false}
                  onChange={(val) => onFormChange?.('posteriorAnteriorRicketts', val)}
                  disabled={isReadOnly}
                  colorTheme="panocef"
                />
              </div>,
              'posteriorAnterior'
            )}

            {/* Estudio ATM */}
            {renderCheckbox('Estudio ATM (Boca abierta)', 'extraoralAtmAbierta', 'atmAbierta')}
            {renderCheckbox('Estudio ATM (Boca cerrada)', 'extraoralAtmCerrada', 'atmCerrada')}
          </div>
        </div>

        {/* ================================================================== */}
        {/* SECCIÓN ASESORÍA ORTODONCIA */}
        {/* ================================================================== */}
        <div className="bg-panocef-light/50 rounded-lg p-5 border border-panocef-secondary">
          <SubsectionTitle title="ASESORÍA ORTODONCIA" colorTheme="panocef" />

          {/* Tipo FÍSICO/DIGITAL */}
          <div className="mb-4 flex gap-3">
            {(() => {
              const isFisicoSelected = (formData?.ortodonciaTipo || []).includes('fisico');
              const getButtonStyles = (isSelected: boolean) => {
                if (isReadOnly) {
                  if (isSelected) {
                    return 'bg-panocef-primary text-white shadow-md border-2 border-panocef-dark';
                  } else {
                    return 'bg-gray-100 border border-gray-200 text-gray-400 opacity-40';
                  }
                }
                return isSelected
                  ? 'bg-panocef-primary text-white shadow-md'
                  : 'bg-white border-2 border-panocef-secondary text-panocef-primary hover:bg-panocef-light';
              };
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (isReadOnly) return;
                    const current = formData?.ortodonciaTipo || [];
                    const newVal = current.includes('fisico')
                      ? current.filter(t => t !== 'fisico')
                      : [...current, 'fisico'];
                    onFormChange?.('ortodonciaTipo', newVal);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${getButtonStyles(isFisicoSelected)} ${isReadOnly ? 'cursor-default' : ''}`}
                  disabled={isReadOnly}
                >
                  FÍSICO
                </button>
              );
            })()}
            {(() => {
              const isDigitalSelected = (formData?.ortodonciaTipo || []).includes('digital');
              const getButtonStyles = (isSelected: boolean) => {
                if (isReadOnly) {
                  if (isSelected) {
                    return 'bg-panocef-primary text-white shadow-md border-2 border-panocef-dark';
                  } else {
                    return 'bg-gray-100 border border-gray-200 text-gray-400 opacity-40';
                  }
                }
                return isSelected
                  ? 'bg-panocef-primary text-white shadow-md'
                  : 'bg-white border-2 border-panocef-secondary text-panocef-primary hover:bg-panocef-light';
              };
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (isReadOnly) return;
                    const current = formData?.ortodonciaTipo || [];
                    const newVal = current.includes('digital')
                      ? current.filter(t => t !== 'digital')
                      : [...current, 'digital'];
                    onFormChange?.('ortodonciaTipo', newVal);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${getButtonStyles(isDigitalSelected)} ${isReadOnly ? 'cursor-default' : ''}`}
                  disabled={isReadOnly}
                >
                  DIGITAL
                </button>
              );
            })()}
          </div>

          {/* Paquetes Ortodoncia */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-panocef-dark mb-3">Paquetes Ortodoncia</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Paquete 1 */}
              {(() => {
                const isSelected = formData?.ortodonciaPaquete === 1;
                const getContainerStyles = () => {
                  if (isReadOnly) {
                    if (isSelected) {
                      return 'border-2 border-panocef-primary bg-panocef-light shadow-sm';
                    } else {
                      return 'border border-gray-200 bg-gray-50/50 opacity-40';
                    }
                  }
                  return isSelected ? 'border-2 border-panocef-primary bg-panocef-light' : 'border-2 border-gray-200 bg-white';
                };
                const getLabelStyles = () => {
                  if (isReadOnly) {
                    return isSelected ? 'font-semibold text-panocef-dark' : 'font-normal text-gray-400';
                  }
                  return 'font-semibold text-gray-800';
                };
                const getContentStyles = () => {
                  if (isReadOnly && !isSelected) return 'text-gray-300';
                  return 'text-gray-600';
                };
                return (
                  <div className={`rounded-lg p-4 transition-colors ${getContainerStyles()}`}>
                    <label className={`flex items-center gap-2 ${isReadOnly ? '' : 'cursor-pointer'}`}>
                      {isReadOnly ? (
                        isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-panocef-primary flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-100" />
                        )
                      ) : (
                        <input
                          type="radio"
                          name="ortodonciaPaquete"
                          checked={isSelected}
                          onChange={() => onFormChange?.('ortodonciaPaquete', 1)}
                          className="w-4 h-4 text-panocef-primary"
                        />
                      )}
                      <span className={getLabelStyles()}>Paquete 1</span>
                    </label>
                    <div className={`mt-2 text-xs ${getContentStyles()}`}>
                      <p>• RX Tracephoto</p>
                      <p>• RX Panorámica</p>
                      <p>• RX Cefalométrica</p>
                      <p>• Análisis</p>
                    </div>
                    {showPrices && pricing && (
                      <p className={`text-xs mt-2 ${isReadOnly && !isSelected ? 'text-gray-300' : 'text-panocef-primary'}`}>
                        Con asesoría: S/{pricing.paq1ConAsesoria} | Sin: S/{pricing.paq1SinAsesoria}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Paquete 2 */}
              {(() => {
                const isSelected = formData?.ortodonciaPaquete === 2;
                const getContainerStyles = () => {
                  if (isReadOnly) {
                    if (isSelected) {
                      return 'border-2 border-panocef-primary bg-panocef-light shadow-sm';
                    } else {
                      return 'border border-gray-200 bg-gray-50/50 opacity-40';
                    }
                  }
                  return isSelected ? 'border-2 border-panocef-primary bg-panocef-light' : 'border-2 border-gray-200 bg-white';
                };
                const getLabelStyles = () => {
                  if (isReadOnly) {
                    return isSelected ? 'font-semibold text-panocef-dark' : 'font-normal text-gray-400';
                  }
                  return 'font-semibold text-gray-800';
                };
                const getContentStyles = () => {
                  if (isReadOnly && !isSelected) return 'text-gray-300';
                  return 'text-gray-600';
                };
                return (
                  <div className={`rounded-lg p-4 transition-colors ${getContainerStyles()}`}>
                    <label className={`flex items-center gap-2 ${isReadOnly ? '' : 'cursor-pointer'}`}>
                      {isReadOnly ? (
                        isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-panocef-primary flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-100" />
                        )
                      ) : (
                        <input
                          type="radio"
                          name="ortodonciaPaquete"
                          checked={isSelected}
                          onChange={() => onFormChange?.('ortodonciaPaquete', 2)}
                          className="w-4 h-4 text-panocef-primary"
                        />
                      )}
                      <span className={getLabelStyles()}>Paquete 2</span>
                    </label>
                    <div className={`mt-2 text-xs ${getContentStyles()}`}>
                      <p>• RX Tracephoto</p>
                      <p>• RX Panorámica</p>
                      <p>• RX Cefalométrica</p>
                      <p>• Análisis Cb</p>
                      <p>• Fotografía 3D</p>
                    </div>
                    {showPrices && pricing && (
                      <p className={`text-xs mt-2 ${isReadOnly && !isSelected ? 'text-gray-300' : 'text-panocef-primary'}`}>
                        Con asesoría: S/{pricing.paq2ConAsesoria} | Sin: S/{pricing.paq2SinAsesoria}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Paquete 3 */}
              {(() => {
                const isSelected = formData?.ortodonciaPaquete === 3;
                const getContainerStyles = () => {
                  if (isReadOnly) {
                    if (isSelected) {
                      return 'border-2 border-panocef-primary bg-panocef-light shadow-sm';
                    } else {
                      return 'border border-gray-200 bg-gray-50/50 opacity-40';
                    }
                  }
                  return isSelected ? 'border-2 border-panocef-primary bg-panocef-light' : 'border-2 border-gray-200 bg-white';
                };
                const getLabelStyles = () => {
                  if (isReadOnly) {
                    return isSelected ? 'font-semibold text-panocef-dark' : 'font-normal text-gray-400';
                  }
                  return 'font-semibold text-gray-800';
                };
                const getContentStyles = () => {
                  if (isReadOnly && !isSelected) return 'text-gray-300';
                  return 'text-gray-600';
                };
                return (
                  <div className={`rounded-lg p-4 transition-colors ${getContainerStyles()}`}>
                    <label className={`flex items-center gap-2 ${isReadOnly ? '' : 'cursor-pointer'}`}>
                      {isReadOnly ? (
                        isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-panocef-primary flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-100" />
                        )
                      ) : (
                        <input
                          type="radio"
                          name="ortodonciaPaquete"
                          checked={isSelected}
                          onChange={() => onFormChange?.('ortodonciaPaquete', 3)}
                          className="w-4 h-4 text-panocef-primary"
                        />
                      )}
                      <span className={getLabelStyles()}>Paquete 3</span>
                    </label>
                    <div className={`mt-2 text-xs ${getContentStyles()}`}>
                      <p>• RX Tracephoto</p>
                      <p>• RX Cefalométrica</p>
                      <p>• Análisis Cb</p>
                      <p>• Impresión Digital</p>
                      <p>• Escaneo Intraoral</p>
                    </div>
                    {showPrices && pricing && (
                      <p className={`text-xs mt-2 ${isReadOnly && !isSelected ? 'text-gray-300' : 'text-panocef-primary'}`}>
                        Con asesoría: S/{pricing.paq3ConAsesoria} | Sin: S/{pricing.paq3SinAsesoria}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ¿Con plan de tratamiento? */}
          {(() => {
            const isConSelected = formData?.ortodonciaPlanTratamiento === 'con';
            const isSinSelected = formData?.ortodonciaPlanTratamiento === 'sin';
            const getContainerStyles = () => {
              if (isReadOnly) {
                if (isConSelected || isSinSelected) {
                  return 'bg-amber-50 border-2 border-amber-400 shadow-sm';
                }
                return 'bg-gray-50/50 border border-gray-200 opacity-40';
              }
              return 'bg-amber-50 border border-amber-200';
            };
            const getOptionStyles = (isSelected: boolean) => {
              if (isReadOnly) {
                if (isSelected) {
                  return 'bg-amber-100 border-2 border-amber-400 shadow-sm';
                }
                return 'bg-gray-50/50 border border-gray-200 opacity-40';
              }
              return isSelected ? 'bg-amber-100 border-2 border-amber-400' : 'bg-white border border-gray-200 hover:bg-amber-50';
            };
            const getLabelStyles = (isSelected: boolean) => {
              if (isReadOnly) {
                return isSelected ? 'text-sm font-semibold text-amber-800' : 'text-sm font-normal text-gray-400';
              }
              return 'text-sm font-medium';
            };
            return (
              <div className={`mb-6 p-4 rounded-lg ${getContainerStyles()}`}>
                <p className="text-sm font-semibold text-gray-800 mb-3">¿Con plan de tratamiento o Sin plan de tratamiento?</p>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${getOptionStyles(isConSelected)} ${isReadOnly ? '' : 'cursor-pointer'}`}>
                    {isReadOnly ? (
                      isConSelected ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-100" />
                      )
                    ) : (
                      <input
                        type="radio"
                        name="planTratamiento"
                        checked={isConSelected}
                        onChange={() => onFormChange?.('ortodonciaPlanTratamiento', 'con')}
                        className="w-4 h-4 text-amber-600"
                      />
                    )}
                    <span className={getLabelStyles(isConSelected)}>Con plan de tratamiento</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${getOptionStyles(isSinSelected)} ${isReadOnly ? '' : 'cursor-pointer'}`}>
                    {isReadOnly ? (
                      isSinSelected ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-100" />
                      )
                    ) : (
                      <input
                        type="radio"
                        name="planTratamiento"
                        checked={isSinSelected}
                        onChange={() => onFormChange?.('ortodonciaPlanTratamiento', 'sin')}
                        className="w-4 h-4 text-amber-600"
                      />
                    )}
                    <span className={getLabelStyles(isSinSelected)}>Sin plan de tratamiento</span>
                  </label>
                </div>
              </div>
            );
          })()}

          {/* Servicios Adicionales */}
          <div>
            <h4 className="text-sm font-semibold text-panocef-dark mb-3">Servicios Adicionales</h4>
            <div className="space-y-3">
              {/* Alineadores Invisibles */}
              {renderExpandableCheckbox(
                'Alineadores Invisibles',
                'ortodonciaAlineadores',
                'alineadores',
                <div className="space-y-2 ml-4">
                  <CheckboxItem
                    label="Plan de tratamiento (sin archivo digital STL)"
                    checked={formData?.alineadoresPlanificacion || false}
                    onChange={(val) => onFormChange?.('alineadoresPlanificacion', val)}
                    disabled={isReadOnly}
                    colorTheme="panocef"
                  />
                  <CheckboxItem
                    label="Impresión y papel+cera"
                    checked={formData?.alineadoresImpresion || false}
                    onChange={(val) => onFormChange?.('alineadoresImpresion', val)}
                    disabled={isReadOnly}
                    colorTheme="panocef"
                  />
                </div>,
                'alineadores'
              )}

              {/* Escaneo Intraoral Digital */}
              {renderExpandableCheckbox(
                'Escaneo Intraoral Digital',
                'ortodonciaEscaneo',
                'escaneoDigital',
                <div className="space-y-2 ml-4">
                  <CheckboxItem
                    label="Escaneo Intraoral"
                    checked={formData?.escaneoIntraoral || false}
                    onChange={(val) => onFormChange?.('escaneoIntraoral', val)}
                    disabled={isReadOnly}
                    colorTheme="panocef"
                  />
                  <CheckboxItem
                    label="Escaneo Intraoral con Zócalo"
                    checked={formData?.escaneoIntraoralZocalo || false}
                    onChange={(val) => onFormChange?.('escaneoIntraoralZocalo', val)}
                    disabled={isReadOnly}
                    colorTheme="panocef"
                  />
                  <CheckboxItem
                    label="Escaneo Intraoral sin informe"
                    checked={formData?.escaneoIntraoralInforme || false}
                    onChange={(val) => onFormChange?.('escaneoIntraoralInforme', val)}
                    disabled={isReadOnly}
                    colorTheme="panocef"
                  />
                </div>,
                'escaneoIntraoral'
              )}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SECCIÓN MODELOS DE ESTUDIO 3D */}
        {/* ================================================================== */}
        <div className="bg-panocef-light/50 rounded-lg p-5 border border-panocef-secondary">
          {renderExpandableCheckbox(
            'MODELOS DE ESTUDIO 3D',
            'ortodonciaImpresion',
            'modelos3d',
            <div className="space-y-2 ml-4">
              <CheckboxItem
                label="Modelos Digitales con informe"
                checked={formData?.modelosDigitalesConInforme || false}
                onChange={(val) => onFormChange?.('modelosDigitalesConInforme', val)}
                disabled={isReadOnly}
                colorTheme="panocef"
              />
              <CheckboxItem
                label="Modelos Digitales sin informe"
                checked={formData?.modelosDigitalesSinInforme || false}
                onChange={(val) => onFormChange?.('modelosDigitalesSinInforme', val)}
                disabled={isReadOnly}
                colorTheme="panocef"
              />
              <CheckboxItem
                label="Impresión digital"
                checked={formData?.modelosImpresionDigital || false}
                onChange={(val) => onFormChange?.('modelosImpresionDigital', val)}
                disabled={isReadOnly}
                colorTheme="panocef"
              />
            </div>,
            'modelosDigitales'
          )}
        </div>

        {/* ================================================================== */}
        {/* SECCIÓN ANÁLISIS CEFALOMÉTRICOS */}
        {/* ================================================================== */}
        <div className="bg-panocef-light/50 rounded-lg p-5 border border-panocef-secondary">
          <SubsectionTitle title="ANÁLISIS CEFALOMÉTRICOS" colorTheme="panocef" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {renderCheckbox('Ricketts', 'analisisRicketts', 'ricketts')}
            {renderCheckbox('Schwartz', 'analisisSchwartz', 'schwartz')}
            {renderCheckbox('Steiner', 'analisisSteiner', 'steiner')}
            {renderCheckbox('Mc Namara', 'analisisMcNamara', 'mcNamara')}
            {renderCheckbox('Tweed', 'analisisTweed', 'tweed')}
            {renderCheckbox('Downs', 'analisisDowns', 'downs')}
            {renderCheckbox('Bjorks', 'analisisBjorks', 'bjorks')}
            {renderCheckbox('U.S.P', 'analisisUSP', 'usp')}
            {renderCheckbox('Rot-h-Jarabak', 'analisisRotJarabak', 'rotJarabak')}
            {renderCheckbox('Tejidos Blancos', 'analisisTejidosBlancos', 'tejidosBlancos')}
          </div>

          {/* Otros análisis */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Otros (especificar)
            </label>
            <textarea
              value={formData?.analisisOtros || ''}
              onChange={(e) => onFormChange?.('analisisOtros', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-panocef-primary focus:border-panocef-primary resize-none"
              rows={2}
              placeholder="Especifique otros análisis..."
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Botón Guardar (si aplica) */}
        {onSave && !isReadOnly && (
          <div className="flex justify-end pt-4">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-panocef-primary text-white rounded-lg hover:bg-panocef-dark transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Radiografías'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
