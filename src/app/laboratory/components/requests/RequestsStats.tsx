import { FileImage, Clock, CheckCircle, Package } from 'lucide-react';

interface RequestsStatsProps {
  stats: {
    total: number;
    pending: number;
    completed: number;
    delivered: number;
  };
  useCyanTheme?: boolean;
  /** Si es false, oculta los cards de Completados y Entregados (para Solicitudes, ya que eso está en Resultados) */
  showCompletedAndDelivered?: boolean;
}

export const RequestsStats = ({ stats, showCompletedAndDelivered = true }: RequestsStatsProps) => {
  // Si no mostramos completados/entregados, usar grid de 2 columnas
  const gridCols = showCompletedAndDelivered ? 'md:grid-cols-4' : 'md:grid-cols-2';

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-panocef-light">
            <FileImage className="w-5 h-5 text-panocef-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>
      </div>

      {showCompletedAndDelivered && (
        <>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completados</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                <p className="text-sm text-gray-600">Entregados</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
