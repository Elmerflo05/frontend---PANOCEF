/**
 * Hook wrapper unificado para precios de laboratorio
 *
 * Combina los hooks de Tomografía 3D y Radiografías en una sola interfaz
 * para facilitar su uso en componentes que necesiten acceso a ambos precios.
 *
 * @example
 * ```tsx
 * const { tomografia, radiografias, isLoading, hasAllPrices } = useLaboratoryPricing();
 * ```
 */

import { useTomografia3DPricing } from '@/app/admin/pages/laboratory-services/hooks/useTomografia3DPricing';
import { useRadiografiasPricing } from '@/app/admin/pages/laboratory-services/hooks/useRadiografiasPricing';

export interface LaboratoryPricingResult {
  tomografia: {
    pricing: ReturnType<typeof useTomografia3DPricing>['pricing'];
    updatePrice: ReturnType<typeof useTomografia3DPricing>['updatePrice'];
    handleSave: ReturnType<typeof useTomografia3DPricing>['handleSave'];
    loading: ReturnType<typeof useTomografia3DPricing>['loading'];
  };
  radiografias: {
    pricing: ReturnType<typeof useRadiografiasPricing>['pricing'];
    updatePrice: ReturnType<typeof useRadiografiasPricing>['updatePrice'];
    handleSave: ReturnType<typeof useRadiografiasPricing>['handleSave'];
    loading: ReturnType<typeof useRadiografiasPricing>['loading'];
  };
  isLoading: boolean;
  hasAllPrices: boolean; // true si todos los precios están configurados (> 0)
}

/**
 * Hook unificado para acceder a los precios de laboratorio
 */
export const useLaboratoryPricing = (): LaboratoryPricingResult => {
  const tomografia3D = useTomografia3DPricing();
  const radiografias = useRadiografiasPricing();

  // Verificar si hay algún precio sin configurar (= 0)
  const hasAllTomografiaPrices = Object.values(tomografia3D.pricing).every(price => price > 0);
  const hasAllRadiografiasPrices = Object.values(radiografias.pricing).every(price => price > 0);

  return {
    tomografia: {
      pricing: tomografia3D.pricing,
      updatePrice: tomografia3D.updatePrice,
      handleSave: tomografia3D.handleSave,
      loading: tomografia3D.loading
    },
    radiografias: {
      pricing: radiografias.pricing,
      updatePrice: radiografias.updatePrice,
      handleSave: radiografias.handleSave,
      loading: radiografias.loading
    },
    isLoading: tomografia3D.loading || radiografias.loading,
    hasAllPrices: hasAllTomografiaPrices && hasAllRadiografiasPrices
  };
};

/**
 * Verifica si un precio específico está configurado
 */
export const isPriceConfigured = (price: number | undefined): boolean => {
  return price !== undefined && price > 0;
};

/**
 * Obtiene un mensaje descriptivo para precios no configurados
 */
export const getMissingPriceMessage = (priceKey: string): string => {
  return `El precio de "${priceKey}" no ha sido configurado por el Super Administrador`;
};
