import { Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react';

// Configuración de tipos de estudios con colores dinámicos
export const getImagingStudyTypes = (useCyanTheme: boolean): Record<string, { label: string; icon: string; color: string }> => ({
  rayos_x: { label: 'Rayos X', icon: '📷', color: useCyanTheme ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-blue-50 text-blue-700 border-blue-200' },
  panoramica: { label: 'Panorámica', icon: '🌐', color: useCyanTheme ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-purple-50 text-purple-700 border-purple-200' },
  tomografia: { label: 'Tomografía', icon: '🔬', color: useCyanTheme ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-red-50 text-red-700 border-red-200' },
  cefalometria: { label: 'Cefalometría', icon: '📐', color: useCyanTheme ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-green-50 text-green-700 border-green-200' },
  periapical: { label: 'Periapical', icon: '🦷', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  oclusal: { label: 'Oclusal', icon: '🔍', color: useCyanTheme ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200' }
});

// Configuración de estados con colores dinámicos
// Estados automáticos:
// - pending: Recién ingresada
// - completed: Se subieron los resultados
// - delivered: El cliente ya visualizó los resultados
export const getStudyStatus = (useCyanTheme: boolean): Record<string, { label: string; icon: any; color: string }> => ({
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  completed: { label: 'Completado', icon: CheckCircle, color: useCyanTheme ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-green-100 text-green-800 border-green-200' },
  delivered: { label: 'Entregado', icon: Package, color: 'bg-gray-100 text-gray-800 border-gray-200' }
});
