/**
 * Hook para gestión de precios de Radiografías
 *
 * ACTUALIZADO: Usa la nueva API normalizada /api/laboratory/service-prices
 * Los precios se almacenan en la tabla laboratory_service_prices (una fila por servicio)
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  laboratoryServicePricesApi,
  RadiografiasPricingLegacy
} from '@/services/api/laboratoryServicePricesApi';

// Re-exportar el tipo para compatibilidad
export type RadiografiasPricing = RadiografiasPricingLegacy;

const DEFAULT_RADIOGRAFIAS_PRICING: RadiografiasPricing = {
  // INTRAORALES - PERIAPICAL
  periapicalFisico: 50,
  periapicalDigital: 20,

  // BITEWING - Campos legacy
  bitewingAmbos: 60,
  bitewingDerecho: 35,
  bitewingIzquierdo: 35,
  // BITEWING - Campos nuevos UI
  bitewingMolares: 35,
  bitewingPremolares: 35,

  // OCLUSAL
  oclusalSuperiores: 40,
  oclusalInferiores: 40,

  // Otras Intraorales
  seriada: 280,
  radiografias: 50,
  // Fotografias - Campos nuevos UI
  fotografiaIntraoral: 30,
  fotografiaExtraoral: 30,

  // EXTRAORALES - Campos legacy
  halografiaPanoramica: 80,
  halografiaLateral: 70,
  halografiaPosterior: 75,
  estudiosAtm: 120,
  radiografiaCefalometrica: 90,
  // EXTRAORALES - Campos nuevos UI (alias)
  panoramica: 80,
  cefalometrica: 90,
  carpal: 70,
  posteriorAnterior: 75,
  atmAbierta: 60,
  atmCerrada: 60,

  // ASESORÍA ORTODONCIA - Paquete 1
  paq1ConAsesoria: 400,
  paq1SinAsesoria: 350,

  // ASESORÍA ORTODONCIA - Paquete 2
  paq2ConAsesoria: 300,
  paq2SinAsesoria: 250,

  // ASESORÍA ORTODONCIA - Paquete 3
  paq3ConAsesoria: 450,
  paq3SinAsesoria: 400,

  // Servicios Adicionales - Campos legacy
  alteracionesInmediatas: 50,
  escaneoImpresionDigital: 80,
  modelosEstudio3d: 100,
  // Servicios Adicionales - Campos nuevos UI
  alineadores: 150,
  escaneoIntraoral: 80,
  modelosDigitales: 100,

  // ANÁLISIS CEFALOMÉTRICOS - Campos legacy
  ricketts: 50,
  powell: 50,
  nordEstelametal: 50,
  steinerBianco: 50,
  steiner: 50,
  bjork: 50,
  mcNamara: 50,
  usp: 50,
  especificarOtros: 50,
  // ANÁLISIS CEFALOMÉTRICOS - Campos nuevos UI
  schwartz: 50,
  tweed: 50,
  downs: 50,
  bjorks: 50,
  rotJarabak: 50,
  tejidosBlancos: 50
};

export const useRadiografiasPricing = () => {
  const [pricing, setPricing] = useState<RadiografiasPricing>(DEFAULT_RADIOGRAFIAS_PRICING);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar precios desde el backend (tabla normalizada)
   */
  const fetchPricing = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);

      console.log('[useRadiografiasPricing] Cargando precios desde API...');
      const data = await laboratoryServicePricesApi.getRadiografiasPricing();
      console.log('[useRadiografiasPricing] Datos recibidos:', data);
      console.log('[useRadiografiasPricing] bitewingMolares:', data.bitewingMolares);
      console.log('[useRadiografiasPricing] panoramica:', data.panoramica);

      // Fusionar con defaults para asegurar que todos los campos existan
      setPricing({
        ...DEFAULT_RADIOGRAFIAS_PRICING,
        ...data
      });
    } catch (err: any) {
      console.error('[useRadiografiasPricing] Error al cargar precios:', err);
      setError(err.message || 'Error al cargar precios');
      // En caso de error, usar valores por defecto
      setPricing(DEFAULT_RADIOGRAFIAS_PRICING);
    } finally {
      setFetching(false);
    }
  }, []);

  // Cargar precios al montar el componente
  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  /**
   * Guardar precios en el backend (actualización bulk)
   * @param options.silent - Si true, no muestra toasts (usado por "Guardar Todo")
   */
  const handleSave = async (options?: { silent?: boolean }) => {
    try {
      setLoading(true);
      setError(null);

      const result = await laboratoryServicePricesApi.updateRadiografiasPricing(pricing);

      if (!options?.silent) {
        toast.success('Configuración de Radiografías guardada exitosamente');
      }
    } catch (err: any) {
      console.error('[useRadiografiasPricing] Error al guardar precios:', err);
      const errorMessage = err.message || 'Error al guardar configuración';
      setError(errorMessage);
      if (!options?.silent) {
        toast.error(errorMessage);
      }
      throw err; // Re-lanzar para que handleSaveAll lo capture
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar un precio específico
   */
  const updatePrice = (field: keyof RadiografiasPricing, value: number) => {
    setPricing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Recargar precios desde el backend
   */
  const refresh = () => {
    fetchPricing();
  };

  return {
    pricing,
    setPricing,
    updatePrice,
    handleSave,
    loading,
    fetching,
    error,
    refresh
  };
};

export { DEFAULT_RADIOGRAFIAS_PRICING };
