/**
 * Sección de selección de dientes para radiografías periapicales
 *
 * Permite seleccionar dientes individuales para radiografías físicas y/o digitales.
 * Muestra precios por grupo (físico) o por diente (digital) cuando showPrices=true.
 *
 * LOGICA DE PRECIOS MODO FISICO:
 * - Una foto periapical cubre 3 dientes consecutivos
 * - 3 dientes juntos = 1 foto (1 precio)
 * - 4 dientes juntos = 2 fotos (no caben en 1 foto de 3)
 * - 2 dientes separados por 1 = 1 foto (el diente intermedio se incluye)
 *
 * Estructura según las imágenes de referencia del técnico:
 * - Dientes Superiores: D | 1.8 - 2.8 | I
 * - Dientes Inferiores: D | 4.8 - 3.8 | I
 * - Dientes Temporales (2 filas separadas)
 */

import type { RadiografiasPricing } from '../types';
import { calcularFotosPeriapicales, getDesgloseFotosPeriapicales } from '@/utils/periapicalCalculator';

// Definición de dientes por cuadrante (usando notación FDI numérica)
// Los labels se mostrarán con formato decimal (1.8, 1.7, etc.)
const DIENTES_SUPERIORES = [
  { num: 18, label: '1.8' }, { num: 17, label: '1.7' }, { num: 16, label: '1.6' },
  { num: 15, label: '1.5' }, { num: 14, label: '1.4' }, { num: 13, label: '1.3' },
  { num: 12, label: '1.2' }, { num: 11, label: '1.1' },
  { num: 21, label: '2.1' }, { num: 22, label: '2.2' }, { num: 23, label: '2.3' },
  { num: 24, label: '2.4' }, { num: 25, label: '2.5' }, { num: 26, label: '2.6' },
  { num: 27, label: '2.7' }, { num: 28, label: '2.8' }
];

const DIENTES_INFERIORES = [
  { num: 48, label: '4.8' }, { num: 47, label: '4.7' }, { num: 46, label: '4.6' },
  { num: 45, label: '4.5' }, { num: 44, label: '4.4' }, { num: 43, label: '4.3' },
  { num: 42, label: '4.2' }, { num: 41, label: '4.1' },
  { num: 31, label: '3.1' }, { num: 32, label: '3.2' }, { num: 33, label: '3.3' },
  { num: 34, label: '3.4' }, { num: 35, label: '3.5' }, { num: 36, label: '3.6' },
  { num: 37, label: '3.7' }, { num: 38, label: '3.8' }
];

const DIENTES_TEMPORALES_SUPERIOR = [
  { num: 55, label: '5.5' }, { num: 54, label: '5.4' }, { num: 53, label: '5.3' },
  { num: 52, label: '5.2' }, { num: 51, label: '5.1' },
  { num: 61, label: '6.1' }, { num: 62, label: '6.2' }, { num: 63, label: '6.3' },
  { num: 64, label: '6.4' }, { num: 65, label: '6.5' }
];

const DIENTES_TEMPORALES_INFERIOR = [
  { num: 85, label: '8.5' }, { num: 84, label: '8.4' }, { num: 83, label: '8.3' },
  { num: 82, label: '8.2' }, { num: 81, label: '8.1' },
  { num: 71, label: '7.1' }, { num: 72, label: '7.2' }, { num: 73, label: '7.3' },
  { num: 74, label: '7.4' }, { num: 75, label: '7.5' }
];

interface PeriapicalSectionProps {
  /** Modo físico activo (checkbox marcado) */
  modoFisicoActivo: boolean;
  /** Modo digital activo (checkbox marcado) */
  modoDigitalActivo: boolean;
  /** Dientes seleccionados en modo físico */
  selectedTeethFisico: number[];
  /** Dientes seleccionados en modo digital */
  selectedTeethDigital: number[];
  /** Callback para toggle modo físico */
  onToggleModoFisico: () => void;
  /** Callback para toggle modo digital */
  onToggleModoDigital: () => void;
  /** Callback para toggle diente en modo físico */
  onToggleToothFisico: (toothNumber: number) => void;
  /** Callback para toggle diente en modo digital */
  onToggleToothDigital: (toothNumber: number) => void;
  /** Solo lectura */
  readOnly?: boolean;
  /** Mostrar precios */
  showPrices?: boolean;
  /** Precios (opcional, para mostrar costos) */
  pricing?: RadiografiasPricing;
  /** Tema de colores */
  colorTheme?: 'cyan' | 'purple' | 'pink';
}

export const PeriapicalSection = ({
  modoFisicoActivo,
  modoDigitalActivo,
  selectedTeethFisico,
  selectedTeethDigital,
  onToggleModoFisico,
  onToggleModoDigital,
  onToggleToothFisico,
  onToggleToothDigital,
  readOnly = false,
  showPrices = false,
  pricing,
  colorTheme = 'pink'
}: PeriapicalSectionProps) => {
  // Calcular precio estimado para modo físico usando lógica de fotos de 3 dientes
  const calcularPrecioFisico = () => {
    if (!pricing || selectedTeethFisico.length === 0) return 0;
    const fotos = calcularFotosPeriapicales(selectedTeethFisico);
    return fotos * pricing.periapicalFisico;
  };

  // Obtener desglose de fotos para mostrar info detallada
  const desgloseFisico = getDesgloseFotosPeriapicales(selectedTeethFisico);
  const fotosFisico = desgloseFisico.total;

  // Calcular precio estimado para modo digital (por diente)
  const calcularPrecioDigital = () => {
    if (!pricing || selectedTeethDigital.length === 0) return 0;
    return selectedTeethDigital.length * pricing.periapicalDigital;
  };

  const renderToothGrid = (
    teeth: { num: number; label: string }[],
    title: string,
    selectedTeeth: number[],
    onToggle: (tooth: number) => void,
    mode: 'fisico' | 'digital'
  ) => {
    const getToothStyles = (isSelected: boolean) => {
      if (readOnly) {
        if (isSelected) {
          return {
            backgroundColor: mode === 'fisico' ? '#ec4899' : '#1F4391',
            borderColor: mode === 'fisico' ? '#db2777' : '#1D2864',
            color: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          };
        } else {
          return {
            backgroundColor: '#f9fafb',
            borderColor: '#e5e7eb',
            color: '#9ca3af',
            opacity: 0.4
          };
        }
      }
      if (isSelected) {
        return {
          backgroundColor: mode === 'fisico' ? '#ec4899' : '#1F4391',
          borderColor: mode === 'fisico' ? '#db2777' : '#1D2864',
          color: 'white'
        };
      }
      return undefined;
    };

    return (
      <div className="mb-4">
        {title && <h5 className="font-semibold text-gray-700 mb-2 text-sm">{title}</h5>}
        <div className="flex flex-wrap items-center gap-1">
          {/* Indicador D (Derecha) */}
          <span className="w-8 h-10 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 rounded">
            D
          </span>

          {teeth.map(({ num, label }) => {
            const isSelected = selectedTeeth.includes(num);
            const styles = getToothStyles(isSelected);
            return (
              <button
                key={num}
                onClick={() => !readOnly && onToggle(num)}
                disabled={readOnly}
                className={`
                  w-10 h-10 border-2 rounded flex items-center justify-center
                  text-xs font-semibold transition-all duration-200
                  ${!isSelected && !readOnly ? 'bg-white border-gray-300 text-gray-700 hover:border-pink-400' : ''}
                  ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                `}
                style={styles}
              >
                {label}
              </button>
            );
          })}

          {/* Indicador I (Izquierda) */}
          <span className="w-8 h-10 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 rounded">
            I
          </span>
        </div>
      </div>
    );
  };

  // Estilos para los toggle buttons en modo lectura
  const getToggleButtonStyles = (isActive: boolean, color: 'pink' | 'indigo') => {
    if (readOnly) {
      if (isActive) {
        return color === 'pink'
          ? 'bg-pink-500 text-white shadow-md border-2 border-pink-600'
          : 'bg-panocef-primary text-white shadow-md border-2 border-panocef-dark';
      } else {
        return 'bg-gray-100 border border-gray-200 text-gray-400 opacity-40';
      }
    }
    if (isActive) {
      return color === 'pink'
        ? 'bg-pink-500 text-white shadow-md'
        : 'bg-panocef-primary text-white shadow-md';
    }
    return color === 'pink'
      ? 'bg-white border-2 border-pink-300 text-pink-700 hover:bg-pink-50'
      : 'bg-white border-2 border-panocef-secondary text-panocef-primary hover:bg-panocef-light';
  };

  return (
    <div className="bg-pink-50/30 rounded-lg p-4 border border-pink-200">
      {/* Botones para activar modos FÍSICO/DIGITAL */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => !readOnly && onToggleModoFisico()}
          disabled={readOnly}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${getToggleButtonStyles(modoFisicoActivo, 'pink')} ${readOnly ? 'cursor-default' : ''}`}
        >
          FÍSICO
          {showPrices && pricing && (
            <span className={`text-xs ${readOnly && !modoFisicoActivo ? 'text-gray-300' : 'opacity-80'}`}>
              (S/{pricing.periapicalFisico}/grupo)
            </span>
          )}
        </button>
        <button
          onClick={() => !readOnly && onToggleModoDigital()}
          disabled={readOnly}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${getToggleButtonStyles(modoDigitalActivo, 'indigo')} ${readOnly ? 'cursor-default' : ''}`}
        >
          DIGITAL
          {showPrices && pricing && (
            <span className={`text-xs ${readOnly && !modoDigitalActivo ? 'text-gray-300' : 'opacity-80'}`}>
              (S/{pricing.periapicalDigital}/diente)
            </span>
          )}
        </button>
      </div>

      {/* Panel de selección de dientes - MODO FÍSICO */}
      {modoFisicoActivo && (
        <div className="mb-6 bg-white rounded-lg p-4 border-2 border-pink-300">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-pink-700 text-base flex items-center gap-2">
              MODO FÍSICO - Selección de Dientes
              {selectedTeethFisico.length > 0 && (
                <>
                  <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                    {selectedTeethFisico.length} dientes
                  </span>
                  <span className="bg-pink-200 text-pink-900 text-xs px-2 py-1 rounded-full font-bold">
                    {fotosFisico} {fotosFisico === 1 ? 'foto' : 'fotos'}
                  </span>
                </>
              )}
            </h4>
            {showPrices && pricing && selectedTeethFisico.length > 0 && (
              <span className="text-sm font-semibold text-pink-700 bg-pink-100 px-3 py-1 rounded-lg">
                Subtotal: S/{calcularPrecioFisico().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          {/* Info de agrupacion de fotos */}
          {selectedTeethFisico.length > 0 && (
            <div className="mb-3 p-2 bg-pink-50 rounded-lg text-xs text-pink-700">
              <span className="font-medium">Cada foto cubre 3 dientes consecutivos.</span>
              {desgloseFisico.desglose.length > 0 && (
                <span className="ml-2">
                  {desgloseFisico.desglose.map((d, i) => (
                    <span key={d.arcada}>
                      {i > 0 && ' | '}
                      {d.arcada}: {d.fotos} {d.fotos === 1 ? 'foto' : 'fotos'}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )}

          {renderToothGrid(DIENTES_SUPERIORES, 'Dientes Superiores', selectedTeethFisico, onToggleToothFisico, 'fisico')}
          {renderToothGrid(DIENTES_INFERIORES, 'Dientes Inferiores', selectedTeethFisico, onToggleToothFisico, 'fisico')}

          <div className="pt-3 border-t border-gray-200">
            <h5 className="font-semibold text-gray-700 mb-3 text-sm">Dientes Temporales</h5>
            {renderToothGrid(DIENTES_TEMPORALES_SUPERIOR, '', selectedTeethFisico, onToggleToothFisico, 'fisico')}
            {renderToothGrid(DIENTES_TEMPORALES_INFERIOR, '', selectedTeethFisico, onToggleToothFisico, 'fisico')}
          </div>
        </div>
      )}

      {/* Panel de selección de dientes - MODO DIGITAL */}
      {modoDigitalActivo && (
        <div className="mb-6 bg-white rounded-lg p-4 border-2 border-panocef-secondary">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-panocef-primary text-base flex items-center gap-2">
              MODO DIGITAL - Selección de Dientes
              {selectedTeethDigital.length > 0 && (
                <span className="bg-panocef-light text-panocef-dark text-xs px-2 py-1 rounded-full">
                  {selectedTeethDigital.length} seleccionados
                </span>
              )}
            </h4>
            {showPrices && pricing && selectedTeethDigital.length > 0 && (
              <span className="text-sm font-semibold text-panocef-primary bg-panocef-light px-3 py-1 rounded-lg">
                Subtotal: S/{calcularPrecioDigital().toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {renderToothGrid(DIENTES_SUPERIORES, 'Dientes Superiores', selectedTeethDigital, onToggleToothDigital, 'digital')}
          {renderToothGrid(DIENTES_INFERIORES, 'Dientes Inferiores', selectedTeethDigital, onToggleToothDigital, 'digital')}

          <div className="pt-3 border-t border-gray-200">
            <h5 className="font-semibold text-gray-700 mb-3 text-sm">Dientes Temporales</h5>
            {renderToothGrid(DIENTES_TEMPORALES_SUPERIOR, '', selectedTeethDigital, onToggleToothDigital, 'digital')}
            {renderToothGrid(DIENTES_TEMPORALES_INFERIOR, '', selectedTeethDigital, onToggleToothDigital, 'digital')}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay modo seleccionado */}
      {!modoFisicoActivo && !modoDigitalActivo && (
        <p className="text-gray-500 text-sm italic">
          Seleccione un modo (Físico o Digital) para elegir los dientes
        </p>
      )}
    </div>
  );
};
