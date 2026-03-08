/**
 * RadiografiasFormStepUnified - Paso 2 del formulario de nueva solicitud
 *
 * Versión UNIFICADA del formulario de radiografías.
 *
 * Incluye:
 * - RadiografiasSection (sección completa de radiografías)
 * - PriceBreakdown opcional (resumen de precios)
 *
 * @usage
 * <RadiografiasFormStepUnified
 *   formData={radiografiasData}
 *   onFormChange={handleRadiografiasChange}
 *   pricing={pricing}
 *   showPrices={true}
 *   priceBreakdown={priceBreakdown}
 *   totalPrice={totalPrice}
 *   colorTheme="cyan"
 * />
 */

import { RadiografiasSection } from '../sections/RadiografiasSection';
import type {
  RadiografiasFormData,
  RadiografiasPricing
} from '../types';
import type { PriceBreakdownItem } from '@/services/laboratory';

interface RadiografiasFormStepUnifiedProps {
  // Datos
  formData: RadiografiasFormData;

  // Handler
  onFormChange: (field: keyof RadiografiasFormData, value: any) => void;

  // Precios (opcional)
  pricing?: RadiografiasPricing;
  showPrices?: boolean;

  // Resumen de precios (opcional)
  priceBreakdown?: PriceBreakdownItem[];
  totalPrice?: number;

  // Opciones
  readOnly?: boolean;
  colorTheme?: 'cyan' | 'purple' | 'teal' | 'indigo';
}

export const RadiografiasFormStepUnified = ({
  formData,
  onFormChange,
  pricing,
  showPrices = false,
  priceBreakdown = [],
  totalPrice = 0,
  readOnly = false,
  colorTheme = 'teal'
}: RadiografiasFormStepUnifiedProps) => {
  return (
    <div className="space-y-6">
      {/* Sección de Radiografías */}
      <RadiografiasSection
        mode={readOnly ? 'view' : 'edit'}
        colorTheme={colorTheme}
        showPrices={showPrices}
        formData={formData}
        onFormChange={onFormChange}
        pricing={pricing}
      />

      {/* Resumen de precios (si hay items) */}
      {showPrices && priceBreakdown.length > 0 && (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200 shadow-lg">
          <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Resumen de Cotización
          </h3>

          {/* Lista de items */}
          <div className="space-y-2 mb-4">
            {priceBreakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-teal-100">
                <span className="text-gray-700">
                  {item.itemName}
                  {item.quantity && item.quantity > 1 && (
                    <span className="text-xs text-gray-500 ml-1">x{item.quantity}</span>
                  )}
                </span>
                <span className="font-semibold text-teal-700">
                  S/ {(item.subtotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t-2 border-teal-300">
            <span className="text-xl font-bold text-teal-900">TOTAL</span>
            <span className="text-2xl font-bold text-teal-600">
              S/ {totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Nota */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            * Los precios pueden variar según disponibilidad. Consulte con el técnico para confirmar.
          </p>
        </div>
      )}
    </div>
  );
};
