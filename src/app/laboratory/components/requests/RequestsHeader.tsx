import { FileImage, FileText, Download, Plus, RefreshCw } from 'lucide-react';

interface RequestsHeaderProps {
  useCyanTheme: boolean;
  title?: string;
  subtitle?: string;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onNewRequest: () => void;
  onRefresh: () => void;
}

export const RequestsHeader = ({
  useCyanTheme,
  title = 'Solicitudes de Estudios de Imágenes',
  subtitle = 'Gestión de órdenes de estudios radiológicos',
  onExportPDF,
  onExportExcel,
  onNewRequest,
  onRefresh
}: RequestsHeaderProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${useCyanTheme ? 'bg-cyan-100' : 'bg-purple-100'}`}>
            <FileImage className={`w-6 h-6 ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Botones de exportación */}
          <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
            <button
              onClick={onExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              title="Exportar a PDF"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={onExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              title="Exportar a Excel"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>

          <button
            onClick={onNewRequest}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </button>
          <button
            onClick={onRefresh}
            className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${useCyanTheme ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};
