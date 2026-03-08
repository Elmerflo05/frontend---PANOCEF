import { Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react';

// Configuración de tipos de estudios con colores PanoCef
export const getImagingStudyTypes = (_useCyanTheme?: boolean): Record<string, { label: string; icon: string; color: string }> => ({
  rayos_x: { label: 'Rayos X', icon: '📷', color: 'bg-panocef-light text-panocef-primary border-panocef-secondary' },
  panoramica: { label: 'Panorámica', icon: '🌐', color: 'bg-panocef-light text-panocef-primary border-panocef-secondary' },
  tomografia: { label: 'Tomografía', icon: '🔬', color: 'bg-panocef-light text-panocef-accent border-panocef-secondary' },
  cefalometria: { label: 'Cefalometría', icon: '📐', color: 'bg-panocef-light text-panocef-accent border-panocef-secondary' },
  periapical: { label: 'Periapical', icon: '🦷', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  oclusal: { label: 'Oclusal', icon: '🔍', color: 'bg-panocef-light text-panocef-primary border-panocef-secondary' }
});

// Configuración de estados con colores PanoCef
// Estados automáticos:
// - pending: Recién ingresada
// - completed: Se subieron los resultados
// - delivered: El cliente ya visualizó los resultados
export const getStudyStatus = (_useCyanTheme?: boolean): Record<string, { label: string; icon: any; color: string }> => ({
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  completed: { label: 'Completado', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  delivered: { label: 'Entregado', icon: Package, color: 'bg-gray-100 text-gray-800 border-gray-200' }
});
