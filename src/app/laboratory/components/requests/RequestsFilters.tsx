import { Search } from 'lucide-react';

interface RequestsFiltersProps {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  useCyanTheme: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

export const RequestsFilters = ({
  searchTerm,
  statusFilter,
  typeFilter,
  useCyanTheme,
  onSearchChange,
  onStatusChange,
  onTypeChange
}: RequestsFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative col-span-2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por paciente, doctor o tipo de estudio..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${useCyanTheme ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'}`}
        />
      </div>

      <div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${useCyanTheme ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'}`}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="completed">Completados</option>
          <option value="delivered">Entregados</option>
        </select>
      </div>

      <div>
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${useCyanTheme ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'}`}
        >
          <option value="all">Todos los tipos</option>
          <option value="rayos_x">Rayos X</option>
          <option value="panoramica">Panorámica</option>
          <option value="tomografia">Tomografía</option>
          <option value="cefalometria">Cefalometría</option>
          <option value="periapical">Periapical</option>
          <option value="oclusal">Oclusal</option>
        </select>
      </div>
    </div>
  );
};
