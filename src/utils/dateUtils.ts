/**
 * Utilidades para manejo de fechas
 */

/**
 * Formatea una fecha a string YYYY-MM-DD sin problemas de timezone
 *
 * @param date - Fecha a formatear
 * @returns String en formato YYYY-MM-DD
 */
export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
