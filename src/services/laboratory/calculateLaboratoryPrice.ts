/**
 * SERVICIO DE CÁLCULO DE PRECIOS PARA SERVICIOS DE LABORATORIO
 *
 * Este servicio utiliza los 49 campos de precios configurados por el Super Admin:
 * - Tomografía 3D (16 campos)
 * - Radiografías (33 campos)
 *
 * Almacenamiento: Base de datos PostgreSQL (tabla: laboratory_pricing)
 * Los precios se obtienen via API: /api/laboratory/pricing/tomografia3d y /radiografias
 *
 * @author Sistema Odontológico My Dent
 * @version 2.1.0 - Integración completa con BD
 */

import type { Tomografia3DPricing } from '@/app/admin/pages/laboratory-services/hooks/useTomografia3DPricing';
import type { RadiografiasPricing } from '@/app/admin/pages/laboratory-services/hooks/useRadiografiasPricing';
import { calcularFotosPeriapicales } from '@/utils/periapicalCalculator';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Item individual del desglose de precios
 */
export interface PriceBreakdownItem {
  category: 'tomografia3D' | 'radiografias';
  subcategory: string;
  itemName: string;
  itemKey: string;
  basePrice: number;
  quantity?: number;
  subtotal: number;
}

/**
 * Resultado del cálculo de precios
 */
export interface PriceCalculationResult {
  totalPrice: number;
  breakdown: PriceBreakdownItem[];
  missingPrices: string[]; // Precios no configurados
  hasAllPrices: boolean;
}

/**
 * Datos del formulario de Tomografía 3D
 */
export interface TomografiaFormData {
  // Tipo de Entrega
  conInforme?: boolean;
  sinInforme?: boolean;
  dicom?: boolean;
  soloUsb?: boolean;

  // Campo Pequeño
  endodoncia?: boolean;
  fracturaRadicular?: boolean;
  anatomiaEndodontica?: boolean;

  // Campo Mediano
  localizacionDiente?: boolean;
  implantes?: boolean;
  maxilarSuperior?: boolean;

  // Campo Mediano/Grande
  viaAerea?: boolean;
  ortognatica?: boolean;

  // Ortodoncia
  marpe?: boolean;
  miniImplantes?: boolean;

  // Otras Opciones
  atm?: boolean;
  macizoFacial?: boolean;
}

/**
 * Datos del formulario de Radiografías
 */
export interface RadiografiasFormData {
  // Intraorales Periapical
  periapicalFisico?: boolean;
  periapicalDigital?: boolean;
  dientesSuperiores?: number[];
  dientesInferiores?: number[];
  // Dientes seleccionados separados por modo (nuevo)
  selectedTeethFisico?: number[];
  selectedTeethDigital?: number[];

  // Bitewing
  bitewingAmbos?: boolean;
  bitewingDerecho?: boolean;
  bitewingIzquierdo?: boolean;

  // Oclusal
  oclusalSuperiores?: boolean;
  oclusalInferiores?: boolean;

  // Otras Intraorales
  seriada?: boolean;
  radiografias?: boolean;

  // Extraorales
  halografiaPanoramica?: boolean;
  halografiaLateral?: boolean;
  halografiaPosterior?: boolean;
  estudiosAtm?: boolean;
  radiografiaCefalometrica?: boolean;

  // Asesoría Ortodoncia - Paquete 1
  paq1ConAsesoria?: boolean;
  paq1SinAsesoria?: boolean;

  // Asesoría Ortodoncia - Paquete 2
  paq2ConAsesoria?: boolean;
  paq2SinAsesoria?: boolean;

  // Asesoría Ortodoncia - Paquete 3
  paq3ConAsesoria?: boolean;
  paq3SinAsesoria?: boolean;

  // Servicios Adicionales
  alteracionesInmediatas?: boolean;
  escaneoImpresionDigital?: boolean;
  modelosEstudio3d?: boolean;

  // Análisis Cefalométricos (9 tipos)
  ricketts?: boolean;
  powell?: boolean;
  nordEstelametal?: boolean;
  steinerBianco?: boolean;
  steiner?: boolean;
  bjork?: boolean;
  mcNamara?: boolean;
  usp?: boolean;
  especificarOtros?: boolean;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

/**
 * Calcula el precio total y desglose de una solicitud de laboratorio
 *
 * @param tomografiaData - Datos del formulario de Tomografía 3D
 * @param radiografiasData - Datos del formulario de Radiografías
 * @param tomografiaPricing - Configuración de precios de Tomografía 3D
 * @param radiografiasPricing - Configuración de precios de Radiografías
 * @returns Resultado con precio total, desglose y precios faltantes
 */
export const calculateLaboratoryPrice = (
  tomografiaData: TomografiaFormData,
  radiografiasData: RadiografiasFormData,
  tomografiaPricing: Tomografia3DPricing,
  radiografiasPricing: RadiografiasPricing
): PriceCalculationResult => {
  const breakdown: PriceBreakdownItem[] = [];
  const missingPrices: string[] = [];

  // ========================================
  // TOMOGRAFÍA 3D
  // ========================================

  // Tipo de Entrega
  if (tomografiaData.conInforme) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'tipoEntrega',
      'Con Informe', 'conInforme', tomografiaPricing.conInforme);
  }
  if (tomografiaData.sinInforme) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'tipoEntrega',
      'Sin Informe', 'sinInforme', tomografiaPricing.sinInforme);
  }
  if (tomografiaData.dicom) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'tipoEntrega',
      'DICOM', 'dicom', tomografiaPricing.dicom);
  }
  if (tomografiaData.soloUsb) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'tipoEntrega',
      'Solo USB', 'soloUsb', tomografiaPricing.soloUsb);
  }

  // Campo Pequeño
  if (tomografiaData.endodoncia) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoPequeno',
      'Endodoncia', 'endodoncia', tomografiaPricing.endodoncia);
  }
  if (tomografiaData.fracturaRadicular) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoPequeno',
      'Fractura Radicular', 'fracturaRadicular', tomografiaPricing.fracturaRadicular);
  }
  if (tomografiaData.anatomiaEndodontica) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoPequeno',
      'Anatomía Endodóntica', 'anatomiaEndodontica', tomografiaPricing.anatomiaEndodontica);
  }

  // Campo Mediano
  if (tomografiaData.localizacionDiente) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoMediano',
      'Localización Diente', 'localizacionDiente', tomografiaPricing.localizacionDiente);
  }
  if (tomografiaData.implantes) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoMediano',
      'Implantes', 'implantes', tomografiaPricing.implantes);
  }
  if (tomografiaData.maxilarSuperior) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoMediano',
      'Maxilar Superior', 'maxilarSuperior', tomografiaPricing.maxilarSuperior);
  }

  // Campo Mediano/Grande
  if (tomografiaData.viaAerea) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoMedianoGrande',
      'Vía Aérea', 'viaAerea', tomografiaPricing.viaAerea);
  }
  if (tomografiaData.ortognatica) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'campoMedianoGrande',
      'Ortognática', 'ortognatica', tomografiaPricing.ortognatica);
  }

  // Ortodoncia
  if (tomografiaData.marpe) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'ortodoncia',
      'MARPE', 'marpe', tomografiaPricing.marpe);
  }
  if (tomografiaData.miniImplantes) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'ortodoncia',
      'Mini Implantes', 'miniImplantes', tomografiaPricing.miniImplantes);
  }

  // Otras Opciones
  if (tomografiaData.atm) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'otrasOpciones',
      'ATM', 'atm', tomografiaPricing.atm);
  }
  if (tomografiaData.macizoFacial) {
    addPriceItem(breakdown, missingPrices, 'tomografia3D', 'otrasOpciones',
      'Macizo Facial', 'macizoFacial', tomografiaPricing.macizoFacial);
  }

  // ========================================
  // RADIOGRAFÍAS
  // ========================================

  // Intraorales Periapical - MODO FISICO
  // Usa logica de fotos: cada foto cubre 3 dientes consecutivos
  if (radiografiasData.periapicalFisico) {
    // Usar dientes específicos de modo físico si están disponibles
    const dientesFisico = radiografiasData.selectedTeethFisico ||
      [...(radiografiasData.dientesSuperiores || []), ...(radiografiasData.dientesInferiores || [])];

    const cantidadFotos = calcularFotosPeriapicales(dientesFisico);
    const cantidadDientes = dientesFisico.length;

    if (cantidadFotos > 0) {
      addPriceItem(breakdown, missingPrices, 'radiografias', 'periapical',
        `Periapical Físico (${cantidadDientes} dientes = ${cantidadFotos} ${cantidadFotos === 1 ? 'foto' : 'fotos'})`,
        'periapicalFisico',
        radiografiasPricing.periapicalFisico, cantidadFotos);
    }
  }

  // Intraorales Periapical - MODO DIGITAL (precio por diente individual)
  if (radiografiasData.periapicalDigital) {
    // Usar dientes específicos de modo digital si están disponibles
    const dientesDigital = radiografiasData.selectedTeethDigital ||
      [...(radiografiasData.dientesSuperiores || []), ...(radiografiasData.dientesInferiores || [])];

    const cantidad = dientesDigital.length;

    if (cantidad > 0) {
      addPriceItem(breakdown, missingPrices, 'radiografias', 'periapical',
        `Periapical Digital (${cantidad} dientes)`, 'periapicalDigital',
        radiografiasPricing.periapicalDigital, cantidad);
    }
  }

  // Bitewing
  if (radiografiasData.bitewingAmbos) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'bitewing',
      'Bitewing Ambos Lados', 'bitewingAmbos', radiografiasPricing.bitewingAmbos);
  }
  if (radiografiasData.bitewingDerecho) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'bitewing',
      'Bitewing Derecho', 'bitewingDerecho', radiografiasPricing.bitewingDerecho);
  }
  if (radiografiasData.bitewingIzquierdo) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'bitewing',
      'Bitewing Izquierdo', 'bitewingIzquierdo', radiografiasPricing.bitewingIzquierdo);
  }

  // Oclusal
  if (radiografiasData.oclusalSuperiores) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'oclusal',
      'Oclusal Superiores', 'oclusalSuperiores', radiografiasPricing.oclusalSuperiores);
  }
  if (radiografiasData.oclusalInferiores) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'oclusal',
      'Oclusal Inferiores', 'oclusalInferiores', radiografiasPricing.oclusalInferiores);
  }

  // Otras Intraorales
  if (radiografiasData.seriada) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'otras',
      'Seriada', 'seriada', radiografiasPricing.seriada);
  }
  if (radiografiasData.radiografias) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'otras',
      'Radiografías', 'radiografias', radiografiasPricing.radiografias);
  }

  // Extraorales
  if (radiografiasData.halografiaPanoramica) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'extraorales',
      'Halografía Panorámica', 'halografiaPanoramica', radiografiasPricing.halografiaPanoramica);
  }
  if (radiografiasData.halografiaLateral) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'extraorales',
      'Halografía Lateral', 'halografiaLateral', radiografiasPricing.halografiaLateral);
  }
  if (radiografiasData.halografiaPosterior) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'extraorales',
      'Halografía Posterior', 'halografiaPosterior', radiografiasPricing.halografiaPosterior);
  }
  if (radiografiasData.estudiosAtm) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'extraorales',
      'Estudios ATM', 'estudiosAtm', radiografiasPricing.estudiosAtm);
  }
  if (radiografiasData.radiografiaCefalometrica) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'extraorales',
      'Radiografía Cefalométrica', 'radiografiaCefalometrica', radiografiasPricing.radiografiaCefalometrica);
  }

  // Asesoría Ortodoncia - Paquete 1
  if (radiografiasData.paq1ConAsesoria) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'asesoriaOrtodoncia',
      'Paquete 1 Con Asesoría', 'paq1ConAsesoria', radiografiasPricing.paq1ConAsesoria);
  }
  if (radiografiasData.paq1SinAsesoria) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'asesoriaOrtodoncia',
      'Paquete 1 Sin Asesoría', 'paq1SinAsesoria', radiografiasPricing.paq1SinAsesoria);
  }

  // Asesoría Ortodoncia - Paquete 2
  if (radiografiasData.paq2ConAsesoria) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'asesoriaOrtodoncia',
      'Paquete 2 Con Asesoría', 'paq2ConAsesoria', radiografiasPricing.paq2ConAsesoria);
  }
  if (radiografiasData.paq2SinAsesoria) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'asesoriaOrtodoncia',
      'Paquete 2 Sin Asesoría', 'paq2SinAsesoria', radiografiasPricing.paq2SinAsesoria);
  }

  // Asesoría Ortodoncia - Paquete 3
  if (radiografiasData.paq3ConAsesoria) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'asesoriaOrtodoncia',
      'Paquete 3 Con Asesoría', 'paq3ConAsesoria', radiografiasPricing.paq3ConAsesoria);
  }
  if (radiografiasData.paq3SinAsesoria) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'asesoriaOrtodoncia',
      'Paquete 3 Sin Asesoría', 'paq3SinAsesoria', radiografiasPricing.paq3SinAsesoria);
  }

  // Servicios Adicionales
  if (radiografiasData.alteracionesInmediatas) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'serviciosAdicionales',
      'Alteraciones Inmediatas', 'alteracionesInmediatas', radiografiasPricing.alteracionesInmediatas);
  }
  if (radiografiasData.escaneoImpresionDigital) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'serviciosAdicionales',
      'Escaneo Impresión Digital', 'escaneoImpresionDigital', radiografiasPricing.escaneoImpresionDigital);
  }
  if (radiografiasData.modelosEstudio3d) {
    addPriceItem(breakdown, missingPrices, 'radiografias', 'serviciosAdicionales',
      'Modelos Estudio 3D', 'modelosEstudio3d', radiografiasPricing.modelosEstudio3d);
  }

  // Análisis Cefalométricos
  const analisisCefalometricos = [
    { field: 'ricketts', name: 'Ricketts', price: radiografiasPricing.ricketts },
    { field: 'powell', name: 'Powell', price: radiografiasPricing.powell },
    { field: 'nordEstelametal', name: 'Nord Estelametal', price: radiografiasPricing.nordEstelametal },
    { field: 'steinerBianco', name: 'Steiner Bianco', price: radiografiasPricing.steinerBianco },
    { field: 'steiner', name: 'Steiner', price: radiografiasPricing.steiner },
    { field: 'bjork', name: 'Bjork', price: radiografiasPricing.bjork },
    { field: 'mcNamara', name: 'McNamara', price: radiografiasPricing.mcNamara },
    { field: 'usp', name: 'USP', price: radiografiasPricing.usp },
    { field: 'especificarOtros', name: 'Especificar Otros', price: radiografiasPricing.especificarOtros }
  ];

  analisisCefalometricos.forEach(analisis => {
    if (radiografiasData[analisis.field as keyof RadiografiasFormData]) {
      addPriceItem(breakdown, missingPrices, 'radiografias', 'analisisCefalometrico',
        analisis.name, analisis.field, analisis.price);
    }
  });

  // ========================================
  // CALCULAR TOTAL
  // ========================================

  const totalPrice = breakdown.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    totalPrice,
    breakdown,
    missingPrices,
    hasAllPrices: missingPrices.length === 0
  };
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Agrega un item al desglose de precios
 */
function addPriceItem(
  breakdown: PriceBreakdownItem[],
  missingPrices: string[],
  category: 'tomografia3D' | 'radiografias',
  subcategory: string,
  itemName: string,
  itemKey: string,
  price: number | undefined,
  quantity: number = 1
): void {
  if (price === undefined || price === 0) {
    missingPrices.push(`${itemName} (${itemKey})`);
    return;
  }

  breakdown.push({
    category,
    subcategory,
    itemName,
    itemKey,
    basePrice: price,
    quantity: quantity > 1 ? quantity : undefined,
    subtotal: price * quantity
  });
}

/**
 * Calcula la cantidad de dientes seleccionados
 */
function calcularCantidadDientes(
  dientesSuperiores?: number[],
  dientesInferiores?: number[]
): number {
  const superiores = dientesSuperiores?.length || 0;
  const inferiores = dientesInferiores?.length || 0;
  return superiores + inferiores;
}

/**
 * Formatea un precio para visualización
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}
