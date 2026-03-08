/**
 * Hook para gestión de precios de Tomografía 3D
 *
 * ACTUALIZADO: Usa la nueva API normalizada /api/laboratory/service-prices
 * Los precios se almacenan en la tabla laboratory_service_prices (una fila por servicio)
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  laboratoryServicePricesApi,
  Tomografia3DPricingLegacy
} from '@/services/api/laboratoryServicePricesApi';

// Re-exportar el tipo para compatibilidad
export type Tomografia3DPricing = Tomografia3DPricingLegacy;

const DEFAULT_TOMOGRAFIA_PRICING: Tomografia3DPricing = {
  // Tipo de Entrega
  conInforme: 150,
  sinInforme: 100,
  dicom: 50,
  soloUsb: 30,

  // CAMPO PEQUEÑO
  endodoncia: 80,
  fracturaRadicular: 75,
  anatomiaEndodontica: 85,

  // CAMPO MEDIANO
  localizacionDiente: 100,
  implantes: 120,
  maxilarSuperior: 110,

  // CAMPO MEDIANO/GRANDE
  viaAerea: 150,
  ortognatica: 160,

  // ORTODONCIA
  marpe: 140,
  miniImplantes: 130,

  // OTRAS OPCIONES
  atm: 125,
  macizoFacial: 135
};

export const useTomografia3DPricing = () => {
  const [pricing, setPricing] = useState<Tomografia3DPricing>(DEFAULT_TOMOGRAFIA_PRICING);
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

      const data = await laboratoryServicePricesApi.getTomografia3DPricing();

      // Fusionar con defaults para asegurar que todos los campos existan
      setPricing({
        ...DEFAULT_TOMOGRAFIA_PRICING,
        ...data
      });
    } catch (err: any) {
      console.error('Error al cargar precios de Tomografía 3D:', err);
      setError(err.message || 'Error al cargar precios');
      // En caso de error, usar valores por defecto
      setPricing(DEFAULT_TOMOGRAFIA_PRICING);
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

      await laboratoryServicePricesApi.updateTomografia3DPricing(pricing);
      if (!options?.silent) {
        toast.success('Configuración de Tomografía 3D guardada exitosamente');
      }
    } catch (err: any) {
      console.error('Error al guardar precios de Tomografía 3D:', err);
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
   * Actualizar un precio específico (solo en estado local)
   */
  const updatePrice = (field: keyof Tomografia3DPricing, value: number) => {
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

export { DEFAULT_TOMOGRAFIA_PRICING };
