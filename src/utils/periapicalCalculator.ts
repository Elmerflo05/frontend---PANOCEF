/**
 * Calculador de fotos periapicales
 *
 * Logica: Una foto periapical cubre 3 dientes consecutivos.
 * - 3 dientes juntos = 1 foto
 * - 4 dientes juntos = 2 fotos (no caben en 1)
 * - 2 dientes separados por 1 = 1 foto (el diente intermedio se incluye en la foto)
 * - Dientes separados por mas de 1 posicion = fotos separadas
 */

// Orden anatomico de dientes por arcada (de derecha a izquierda del paciente)
const ORDEN_SUPERIORES = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ORDEN_INFERIORES = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const ORDEN_TEMPORALES_SUPERIOR = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const ORDEN_TEMPORALES_INFERIOR = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

/**
 * Obtiene el indice de un diente en su arcada correspondiente
 */
function getToothIndex(toothNumber: number): { arcada: string; index: number } | null {
  let index = ORDEN_SUPERIORES.indexOf(toothNumber);
  if (index !== -1) return { arcada: 'superior', index };

  index = ORDEN_INFERIORES.indexOf(toothNumber);
  if (index !== -1) return { arcada: 'inferior', index };

  index = ORDEN_TEMPORALES_SUPERIOR.indexOf(toothNumber);
  if (index !== -1) return { arcada: 'temporal_superior', index };

  index = ORDEN_TEMPORALES_INFERIOR.indexOf(toothNumber);
  if (index !== -1) return { arcada: 'temporal_inferior', index };

  return null;
}

/**
 * Agrupa dientes seleccionados por arcada
 */
function agruparPorArcada(dientes: number[]): Record<string, number[]> {
  const grupos: Record<string, number[]> = {
    superior: [],
    inferior: [],
    temporal_superior: [],
    temporal_inferior: []
  };

  dientes.forEach(diente => {
    const info = getToothIndex(diente);
    if (info) {
      grupos[info.arcada].push(diente);
    }
  });

  return grupos;
}

/**
 * Ordena dientes por su posicion anatomica en la arcada
 */
function ordenarPorPosicion(dientes: number[], arcada: string): number[] {
  let ordenArcada: number[];

  switch (arcada) {
    case 'superior':
      ordenArcada = ORDEN_SUPERIORES;
      break;
    case 'inferior':
      ordenArcada = ORDEN_INFERIORES;
      break;
    case 'temporal_superior':
      ordenArcada = ORDEN_TEMPORALES_SUPERIOR;
      break;
    case 'temporal_inferior':
      ordenArcada = ORDEN_TEMPORALES_INFERIOR;
      break;
    default:
      return dientes;
  }

  return dientes.sort((a, b) => {
    const indexA = ordenArcada.indexOf(a);
    const indexB = ordenArcada.indexOf(b);
    return indexA - indexB;
  });
}

/**
 * Calcula cuantas fotos se necesitan para una arcada
 * Cada foto cubre un rango de 3 posiciones consecutivas
 */
function calcularFotosParaArcada(dientes: number[], arcada: string): number {
  if (dientes.length === 0) return 0;
  if (dientes.length === 1) return 1;

  let ordenArcada: number[];

  switch (arcada) {
    case 'superior':
      ordenArcada = ORDEN_SUPERIORES;
      break;
    case 'inferior':
      ordenArcada = ORDEN_INFERIORES;
      break;
    case 'temporal_superior':
      ordenArcada = ORDEN_TEMPORALES_SUPERIOR;
      break;
    case 'temporal_inferior':
      ordenArcada = ORDEN_TEMPORALES_INFERIOR;
      break;
    default:
      return Math.ceil(dientes.length / 3);
  }

  // Obtener indices de los dientes seleccionados
  const indices = dientes
    .map(d => ordenArcada.indexOf(d))
    .filter(i => i !== -1)
    .sort((a, b) => a - b);

  if (indices.length === 0) return 0;
  if (indices.length === 1) return 1;

  // Algoritmo greedy: colocar fotos de 3 dientes consecutivos
  // Cada foto cubre desde posicion X hasta X+2 (3 posiciones)
  let fotos = 0;
  let i = 0;

  while (i < indices.length) {
    fotos++;
    const inicioFoto = indices[i];
    const finFoto = inicioFoto + 2; // Una foto cubre 3 posiciones consecutivas

    // Avanzar mientras los dientes esten dentro del rango de la foto actual
    while (i < indices.length && indices[i] <= finFoto) {
      i++;
    }
  }

  return fotos;
}

/**
 * Calcula el numero total de fotos periapicales necesarias
 * basado en los dientes seleccionados
 *
 * @param selectedTeeth - Array de numeros de dientes seleccionados
 * @returns Numero de fotos necesarias
 */
export function calcularFotosPeriapicales(selectedTeeth: number[]): number {
  if (!selectedTeeth || selectedTeeth.length === 0) return 0;

  // Agrupar dientes por arcada
  const grupos = agruparPorArcada(selectedTeeth);

  // Calcular fotos para cada arcada
  let totalFotos = 0;

  Object.entries(grupos).forEach(([arcada, dientes]) => {
    if (dientes.length > 0) {
      const ordenados = ordenarPorPosicion(dientes, arcada);
      totalFotos += calcularFotosParaArcada(ordenados, arcada);
    }
  });

  return totalFotos;
}

/**
 * Obtiene un desglose detallado de las fotos por arcada
 */
export function getDesgloseFotosPeriapicales(selectedTeeth: number[]): {
  total: number;
  desglose: { arcada: string; dientes: number[]; fotos: number }[];
} {
  if (!selectedTeeth || selectedTeeth.length === 0) {
    return { total: 0, desglose: [] };
  }

  const grupos = agruparPorArcada(selectedTeeth);
  const desglose: { arcada: string; dientes: number[]; fotos: number }[] = [];
  let total = 0;

  Object.entries(grupos).forEach(([arcada, dientes]) => {
    if (dientes.length > 0) {
      const ordenados = ordenarPorPosicion(dientes, arcada);
      const fotos = calcularFotosParaArcada(ordenados, arcada);
      total += fotos;

      const nombreArcada = {
        superior: 'Superiores',
        inferior: 'Inferiores',
        temporal_superior: 'Temporales Sup.',
        temporal_inferior: 'Temporales Inf.'
      }[arcada] || arcada;

      desglose.push({
        arcada: nombreArcada,
        dientes: ordenados,
        fotos
      });
    }
  });

  return { total, desglose };
}
