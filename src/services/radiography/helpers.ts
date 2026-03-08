/**
 * Funciones auxiliares para formularios de radiografía
 *
 * Este módulo contiene funciones helper reutilizables para determinar
 * estados y realizar cálculos basados en los datos del formulario.
 */

import type {
  RadiografiasFormData
} from '@/components/laboratory-form/types';

/**
 * Verifica si hay estudios intraorales seleccionados
 */
export const hasIntraoralSelected = (data: RadiografiasFormData): boolean => {
  return data.intraoralTipo.length > 0 ||
         data.dientesSuperioresFisico.length > 0 ||
         data.dientesInferioresFisico.length > 0 ||
         data.dientesTemporalesFisico.length > 0 ||
         data.dientesSuperioresDigital.length > 0 ||
         data.dientesInferioresDigital.length > 0 ||
         data.dientesTemporalesDigital.length > 0 ||
         data.bitewingMolaresDerecha ||
         data.bitewingMolaresIzquierda ||
         data.bitewingPremolaresDerecha ||
         data.bitewingPremolaresIzquierda ||
         data.oclusalSuperiores ||
         data.oclusalInferiores ||
         data.seriada ||
         data.fotografiaIntraoral;
};

/**
 * Verifica si hay estudios extraorales seleccionados
 */
export const hasExtraoralSelected = (data: RadiografiasFormData): boolean => {
  return data.extraoralPanoramica ||
         data.extraoralCefalometrica ||
         data.extraoralCarpal ||
         data.extraoralPosteriorAnterior ||
         data.extraoralAtmAbierta ||
         data.extraoralAtmCerrada ||
         data.extraoralFotografia;
};

/**
 * Verifica si hay servicios de ortodoncia seleccionados
 */
export const hasOrtodonciaSelected = (data: RadiografiasFormData): boolean => {
  return data.ortodonciaPaquete > 0 ||
         data.ortodonciaAlineadores ||
         data.ortodonciaEscaneo ||
         data.ortodonciaImpresion;
};

/**
 * Verifica si hay análisis cefalométricos seleccionados
 */
export const hasAnalisisSelected = (data: RadiografiasFormData): boolean => {
  return data.analisisRicketts ||
         data.analisisSchwartz ||
         data.analisisSteiner ||
         data.analisisMcNamara ||
         data.analisisTweed ||
         data.analisisDowns ||
         data.analisisBjorks ||
         data.analisisUSP ||
         data.analisisRotJarabak ||
         data.analisisTejidosBlancos ||
         data.analisisOtros.trim() !== '';
};
