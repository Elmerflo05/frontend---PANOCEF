import { User, Calendar, Clock, Eye, Printer, DollarSign, Upload } from 'lucide-react';
import type { Appointment } from '@/types';
import { getImagingStudyTypes, getStudyStatus } from './constants';

interface ImagingRequestWithDetails extends Appointment {
  patientName?: string;
  doctorName?: string;
  radiographyData?: any;
}

interface RequestCardProps {
  request: ImagingRequestWithDetails;
  useCyanTheme: boolean;
  userRole?: string;
  formatRadiographyInfo: (data: any) => any[];
  getPriorityColor: (date: Date) => string;
  onViewDetails: () => void;
  onPrint: () => void;
  onSetPrice: () => void;
  onUploadResults: () => void;
  onViewResults: () => void;
}

export const RequestCard = ({
  request,
  useCyanTheme,
  userRole,
  formatRadiographyInfo,
  getPriorityColor,
  onViewDetails,
  onPrint,
  onSetPrice,
  onUploadResults,
  onViewResults
}: RequestCardProps) => {
  const IMAGING_STUDY_TYPES = getImagingStudyTypes(useCyanTheme);
  const STUDY_STATUS = getStudyStatus(useCyanTheme);

  const studyType = IMAGING_STUDY_TYPES[request.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES];
  const studyStatus = STUDY_STATUS[request.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS];
  const StatusIcon = studyStatus?.icon || Clock;
  const appointmentDate = new Date(request.date);
  const today = new Date();
  const isOverdue = appointmentDate < today && request.imagingStudy?.studyStatus !== 'completed' && request.imagingStudy?.studyStatus !== 'delivered';

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(request.date)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${useCyanTheme ? 'bg-cyan-100' : 'bg-purple-100'}`}>
              {studyType?.icon || '📷'}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.patientName}
                </h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${studyType?.color || 'bg-gray-100'}`}>
                  {studyType?.icon} {studyType?.label || 'Estudio'}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${studyStatus?.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {studyStatus?.label}
                </span>
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ⚠️ Vencido
                  </span>
                )}
                {request.radiographyData?.requestedDiscount && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 border-2 border-orange-300 shadow-sm">
                    💰 Solicitó Promoción
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Solicitado por:</span>
                  <span className="font-medium text-gray-900">{request.doctorName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Llegada:</span>
                  <span className="font-medium text-gray-900">
                    {appointmentDate.toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la solicitud de radiografía formateada */}
          {request.radiographyData && formatRadiographyInfo(request.radiographyData) && (
            <div className="mb-3 ml-16">
              <div className={`bg-gradient-to-r rounded-lg p-4 border ${useCyanTheme ? 'from-cyan-50 to-teal-50 border-cyan-200' : 'from-purple-50 to-indigo-50 border-purple-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formatRadiographyInfo(request.radiographyData)?.map((section: any, idx) => (
                    <div key={idx} className={section.items.length > 3 || section.dientes ? 'md:col-span-2' : ''}>
                      <h4 className={`text-sm font-semibold mb-2 ${useCyanTheme ? 'text-cyan-900' : 'text-purple-900'}`}>{section.title}</h4>

                      {/* Items de texto */}
                      {section.items.length > 0 && (
                        <ul className="space-y-1 mb-3">
                          {section.items.map((item: string, itemIdx: number) => (
                            <li key={itemIdx} className="text-xs text-gray-700 flex items-start gap-2">
                              <span className={`mt-0.5 ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`}>•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Selector visual de dientes */}
                      {section.dientes && (
                        <div className="space-y-3">
                          {/* Dientes Superiores */}
                          {section.dientes.superiores.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1.5">Dientes Superiores:</p>
                              <div className="flex flex-wrap gap-1">
                                {['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'].map(diente => (
                                  <span
                                    key={diente}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                      section.dientes.superiores.includes(diente)
                                        ? (useCyanTheme ? 'bg-cyan-600 text-white font-semibold border-2 border-cyan-700' : 'bg-purple-600 text-white font-semibold border-2 border-purple-700')
                                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                                    }`}
                                  >
                                    {diente}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dientes Inferiores */}
                          {section.dientes.inferiores.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1.5">Dientes Inferiores:</p>
                              <div className="flex flex-wrap gap-1">
                                {['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8'].map(diente => (
                                  <span
                                    key={diente}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                      section.dientes.inferiores.includes(diente)
                                        ? (useCyanTheme ? 'bg-cyan-600 text-white font-semibold border-2 border-cyan-700' : 'bg-purple-600 text-white font-semibold border-2 border-purple-700')
                                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                                    }`}
                                  >
                                    {diente}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dientes Temporales */}
                          {section.dientes.temporales.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1.5">Dientes Temporales:</p>
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-xs text-gray-600 px-1">Superiores:</span>
                                  {['5.5', '5.4', '5.3', '5.2', '5.1', '6.1', '6.2', '6.3', '6.4', '6.5'].map(diente => (
                                    <span
                                      key={diente}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        section.dientes.temporales.includes(diente)
                                          ? (useCyanTheme ? 'bg-cyan-600 text-white font-semibold border-2 border-cyan-700' : 'bg-purple-600 text-white font-semibold border-2 border-purple-700')
                                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                                      }`}
                                    >
                                      {diente}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-xs text-gray-600 px-1">Inferiores:</span>
                                  {['8.5', '8.4', '8.3', '8.2', '8.1', '7.1', '7.2', '7.3', '7.4', '7.5'].map(diente => (
                                    <span
                                      key={diente}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        section.dientes.temporales.includes(diente)
                                          ? (useCyanTheme ? 'bg-cyan-600 text-white font-semibold border-2 border-cyan-700' : 'bg-purple-600 text-white font-semibold border-2 border-purple-700')
                                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                                      }`}
                                    >
                                      {diente}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Indicaciones tradicionales (para solicitudes antiguas) */}
          {request.notes && !request.radiographyData && (
            <div className="mb-3 ml-16">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Indicaciones:</span> {request.notes}
              </p>
            </div>
          )}

          {request.imagingStudy?.findings && (
            <div className="mb-3 ml-16 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Hallazgos:</span> {request.imagingStudy.findings}
              </p>
            </div>
          )}

        </div>

        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onViewDetails}
              className={`p-2 text-gray-600 rounded-lg transition-colors ${useCyanTheme ? 'hover:text-cyan-600 hover:bg-cyan-50' : 'hover:text-purple-600 hover:bg-purple-50'}`}
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Botón de imprimir - Solo para staff interno */}
            {userRole !== 'external_client' && (
              <button
                onClick={onPrint}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Imprimir solicitud"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {/* Botón para establecer/modificar precio - Solo para staff interno */}
            {userRole !== 'external_client' && request.radiographyData && (request.radiographyData.status === 'pending' || request.radiographyData.status === 'price_approved' || request.radiographyData.status === 'completed') && (
              <button
                onClick={onSetPrice}
                className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title={request.radiographyData.pricing?.finalPrice ? 'Modificar precio' : 'Establecer precio'}
              >
                <DollarSign className="w-4 h-4" />
              </button>
            )}

            {/* Botón de subir resultados - Solo para staff interno y si NO está completado */}
            {userRole !== 'external_client' && request.imagingStudy?.studyStatus !== 'completed' && request.imagingStudy?.studyStatus !== 'delivered' && (
              <button
                onClick={onUploadResults}
                className="p-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                title="Subir resultados"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}

            {/* Botón de ver resultados - Solo si está completado o entregado */}
            {(request.imagingStudy?.studyStatus === 'completed' || request.imagingStudy?.studyStatus === 'delivered') && (
              <button
                onClick={onViewResults}
                className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Ver resultados"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mostrar precio si está aprobado */}
          {request.radiographyData?.pricing?.finalPrice && (
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                💰 S/. {request.radiographyData.pricing.finalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Estados automáticos - No hay selector manual
              - pending: recién ingresada
              - completed: se subieron los resultados (automático al subir)
              - delivered: el cliente visualizó (automático al ver)
          */}
        </div>
      </div>
    </div>
  );
};
