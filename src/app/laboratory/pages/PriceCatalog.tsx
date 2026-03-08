/**
 * CATÁLOGO DE PRECIOS (SOLO LECTURA)
 *
 * Permite a los técnicos de imágenes y clientes externos
 * ver los precios configurados por el Super Administrador
 * sin poder editarlos.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Search, AlertCircle, CheckCircle, FileImage } from 'lucide-react';
import { useLaboratoryPricing } from '@/hooks/useLaboratoryPricing';
import { formatPrice } from '@/services/laboratory';
import { useAuth } from '@/hooks/useAuth';

const PriceCatalog = () => {
  const { user } = useAuth();
  const { tomografia, radiografias, isLoading, hasAllPrices } = useLaboratoryPricing();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tomografia' | 'radiografias'>('tomografia');

  // PanoCef branding - always use navy blue theme

  // Filtrar precios según búsqueda
  const filterPrices = (prices: Record<string, number>, search: string) => {
    if (!search) return Object.entries(prices);
    return Object.entries(prices).filter(([key]) =>
      key.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredTomografia = filterPrices(tomografia.pricing, searchTerm);
  const filteredRadiografias = filterPrices(radiografias.pricing, searchTerm);

  // Formatear nombre de campo (camelCase → texto legible)
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Verificar si un precio está configurado
  const isPriceConfigured = (price: number): boolean => price > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando precios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-panocef-light">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-panocef-primary text-white px-6 py-6 shadow-md"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Catálogo de Precios</h1>
                <p className="text-sm opacity-90 mt-1">
                  Precios configurados por el administrador (solo lectura)
                </p>
              </div>
            </div>
            {!hasAllPrices && (
              <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Algunos precios sin configurar</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Barra de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-4 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar precio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-6"
        >
          <button
            onClick={() => setActiveTab('tomografia')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'tomografia'
                ? 'bg-panocef-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tomografía 3D ({Object.keys(tomografia.pricing).length} precios)
          </button>
          <button
            onClick={() => setActiveTab('radiografias')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'radiografias'
                ? 'bg-panocef-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Radiografías ({Object.keys(radiografias.pricing).length} precios)
          </button>
        </motion.div>

        {/* Lista de Precios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-panocef-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === 'tomografia' && filteredTomografia.map(([key, price], index) => (
                  <tr
                    key={key}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPriceConfigured(price) ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatFieldName(key)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isPriceConfigured(price) ? (
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(price)}
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-600 italic">
                          No configurado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {activeTab === 'radiografias' && filteredRadiografias.map(([key, price], index) => (
                  <tr
                    key={key}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPriceConfigured(price) ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatFieldName(key)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isPriceConfigured(price) ? (
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(price)}
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-600 italic">
                          No configurado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sin resultados */}
          {((activeTab === 'tomografia' && filteredTomografia.length === 0) ||
            (activeTab === 'radiografias' && filteredRadiografias.length === 0)) && (
            <div className="text-center py-12">
              <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron resultados</p>
            </div>
          )}
        </motion.div>

        {/* Nota informativa */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Los precios son configurados por el Super Administrador</li>
                <li>Los precios marcados como "No configurado" no podrán usarse en solicitudes</li>
                <li>Esta página es de solo lectura, no puedes modificar los precios</li>
                <li>Contacta al administrador si necesitas cambios en los precios</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PriceCatalog;
