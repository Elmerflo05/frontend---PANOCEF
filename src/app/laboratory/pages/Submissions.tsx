/**
 * Solicitudes Externas - Página para técnico de imágenes y clientes externos
 *
 * Esta página usa el MISMO formato que Requests.tsx (Solicitudes Internas)
 * para mantener consistencia en la interfaz de usuario.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileImage, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { Appointment } from '@/types';
import { radiographyApi } from '@/services/api/radiographyApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';
import { UploadResultsModal } from '@/components/laboratory/UploadResultsModal';
import { ViewResultsModal } from '@/components/laboratory/ViewResultsModal';
import { SetPriceModal } from '@/components/laboratory/SetPriceModal';
import { useAuthStore } from '@/store/authStore';

// Import modular components - MISMO formato que Requests.tsx
import { RequestsHeader } from '../components/requests/RequestsHeader';
import { RequestsFilters } from '../components/requests/RequestsFilters';
import { RequestsStats } from '../components/requests/RequestsStats';
import { RequestCard } from '../components/requests/RequestCard';
import { RequestDetailsModal } from '../components/requests/RequestDetailsModal';
import { getImagingStudyTypes, getStudyStatus } from '../components/requests/constants';
import { formatRadiographyInfo } from '../components/requests/utils/formatRadiographyInfo';
import { exportToExcel, exportToPDF, handlePrintRequest } from '../components/requests/utils/exportFunctions';

interface ImagingRequestWithDetails extends Appointment {
  patientName?: string;
  doctorName?: string;
  radiographyData?: any;
}

const SubmissionsPage = () => {
  const { user } = useAuthStore();
  const isExternalClient = user?.role === 'external_client';

  const IMAGING_STUDY_TYPES = getImagingStudyTypes();
  const STUDY_STATUS = getStudyStatus();

  const [requests, setRequests] = useState<ImagingRequestWithDetails[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ImagingRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<ImagingRequestWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewResultsModal, setShowViewResultsModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);

      // Debug: Verificar datos del usuario
      console.log('[Submissions] Usuario actual:', {
        user_id: user?.id,
        role: user?.role,
        dentist_id: user?.dentist_id,
        isExternalClient
      });

      // Cargar solicitudes de radiografía
      const radiographyRes = await radiographyApi.getRadiographyRequests({
        limit: 1000,
        source: isExternalClient ? undefined : 'external'
      });

      console.log('[Submissions] Respuesta del backend:', {
        success: radiographyRes.success,
        totalSolicitudes: radiographyRes.data?.length || 0
      });

      // Para external_client: NO necesita cargar pacientes/dentistas
      // Los datos ya vienen en request_data de cada solicitud
      // Para imaging_technician: cargar datos adicionales
      let patientsMap = new Map();
      let dentistsMap = new Map();

      if (!isExternalClient) {
        try {
          const [patientsRes, dentistsRes] = await Promise.all([
            patientsApi.getPatients({ limit: 1000 }),
            dentistsApi.getDentists({ limit: 100 })
          ]);
          patientsMap = new Map(patientsRes.data.map(p => [p.patient_id, p]));
          dentistsMap = new Map(dentistsRes.data.map(d => [d.dentist_id, d]));
        } catch (error) {
          console.warn('[Submissions] No se pudieron cargar pacientes/dentistas:', error);
          // Continuar sin estos datos - se usarán los de request_data
        }
      }

      // Convertir solicitudes de radiografía al formato de ImagingRequestWithDetails
      // MISMO formato que usa Requests.tsx
      const radiographyAsAppointments: ImagingRequestWithDetails[] = radiographyRes.data.map(req => {
        const patient = patientsMap.get(req.patient_id);
        const dentist = dentistsMap.get(req.dentist_id);
        // Usar date_time_registration (fecha de llegada real) en lugar de request_date
        const reqDate = new Date(req.date_time_registration || req.request_date);

        // Determinar tipo de estudio basado en radiography_type
        let studyType: 'rayos_x' | 'panoramica' | 'tomografia' | 'cefalometria' | 'periapical' | 'oclusal' = 'panoramica';
        const radType = req.radiography_type?.toLowerCase() || '';
        if (radType.includes('tomografía') || radType.includes('tomografia')) {
          studyType = 'tomografia';
        } else if (radType.includes('panorámica') || radType.includes('panoramica')) {
          studyType = 'panoramica';
        } else if (radType.includes('cefalométrica') || radType.includes('cefalometrica')) {
          studyType = 'cefalometria';
        } else if (radType.includes('periapical')) {
          studyType = 'periapical';
        } else if (radType.includes('oclusal')) {
          studyType = 'oclusal';
        } else if (radType.includes('rayos') || radType.includes('rx')) {
          studyType = 'rayos_x';
        }

        // Obtener datos desde request_data si existe
        const requestData = req.request_data as any;
        const pricingData = req.pricing_data as any;
        const patientFromData = requestData?.patientData || requestData?.patient;
        const doctorFromData = requestData?.doctorData || requestData?.doctor;

        // Determinar nombre del paciente
        const patientName = patient
          ? `${patient.first_name} ${patient.last_name}`
          : req.patient_name
          || (patientFromData
            ? (patientFromData.nombre || `${patientFromData.nombres || ''} ${patientFromData.apellidos || ''}`.trim())
            : 'Paciente');

        // Determinar nombre del doctor
        const doctorName = dentist
          ? `Dr. ${dentist.first_name} ${dentist.last_name}`
          : req.dentist_name
          || (doctorFromData
            ? `Dr. ${doctorFromData.doctor?.replace('Dr. ', '') || doctorFromData.nombre || `${doctorFromData.nombres || ''} ${doctorFromData.apellidos || ''}`.trim()}`
            : 'Doctor externo');

        return {
          id: (req.radiography_request_id || req.request_id)?.toString() || '',
          patientId: req.patient_id?.toString() || '',
          doctorId: req.dentist_id?.toString() || '',
          date: reqDate,
          startTime: reqDate.toTimeString().slice(0, 5),
          endTime: reqDate.toTimeString().slice(0, 5),
          duration: 30,
          status: 'scheduled' as const,
          services: [req.radiography_type || 'Radiografía'],
          notes: req.notes || '',
          paymentStatus: 'pending' as const,
          totalAmount: pricingData?.finalPrice || 0,
          type: 'imaging_study' as const,
          imagingStudy: {
            studyType: studyType,
            studyStatus: req.request_status || 'pending',
            requestedBy: req.dentist_id?.toString(),
            findings: req.findings || undefined,
            images: req.image_url ? [req.image_url] : undefined,
            completedAt: req.performed_date ? new Date(req.performed_date) : undefined,
            deliveredAt: undefined,
            technicianNotes: req.notes || undefined
          },
          createdAt: reqDate,
          updatedAt: new Date(req.date_time_modification || req.request_date),
          patientName: patientName,
          doctorName: doctorName,
          radiographyData: {
            id: (req.radiography_request_id || req.request_id)?.toString() || '',
            requesterId: req.dentist_id?.toString() || '',
            radiographyType: req.radiography_type,
            patientData: patientFromData || {
              nombre: patientName,
              dni: patient?.identification || patientFromData?.dni || ''
            },
            doctorData: doctorFromData || {
              doctor: doctorName
            },
            tomografia3D: requestData?.tomografia3D,
            radiografias: requestData?.radiografias,
            status: req.request_status || 'pending',
            notes: req.notes,
            images: req.image_url ? [req.image_url] : undefined,
            pricing: pricingData,
            createdAt: reqDate,
            updatedAt: new Date(req.date_time_modification || req.request_date),
            completedAt: req.performed_date ? new Date(req.performed_date) : undefined
          }
        };
      });

      setRequests(radiographyAsAppointments);
    } catch (error: any) {
      console.error('[Submissions] Error al cargar solicitudes:', error);
      toast.error(error?.message || 'Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // IMPORTANTE: Excluir solicitudes completadas o entregadas
    // Estas solicitudes deben mostrarse en la página de "Resultados", no aquí
    filtered = filtered.filter(request => {
      const status = request.imagingStudy?.studyStatus;
      return status !== 'completed' && status !== 'delivered';
    });

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        IMAGING_STUDY_TYPES[request.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES]?.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.imagingStudy?.studyStatus === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(request => request.imagingStudy?.studyType === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const getPriorityColor = (date: Date) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    const diffDays = Math.ceil((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'border-l-red-500 bg-red-50';
    if (diffDays <= 1) return 'border-l-orange-500 bg-orange-50';
    if (diffDays <= 3) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-green-500 bg-green-50';
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        toast.error('Solicitud no encontrada');
        return;
      }

      // Actualizar vía radiographyApi
      if (request.radiographyData) {
        await radiographyApi.updateRadiographyRequest(parseInt(requestId), {
          request_status: newStatus,
          performed_date: newStatus === 'completed' ? formatDateToYMD(new Date()) : undefined
        });
      }

      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? {
            ...req,
            imagingStudy: {
              ...req.imagingStudy!,
              studyStatus: newStatus as any
            }
          }
          : req
      ));

      toast.success('Estado actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  // Verificar si el usuario external_client tiene dentist_id
  const hasNoDentistId = isExternalClient && !user?.dentist_id;

  // Mostrar advertencia si el usuario external_client no tiene dentist_id
  if (hasNoDentistId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-amber-800 mb-2">
                Configuración de cuenta incompleta
              </h2>
              <p className="text-amber-700 mb-4">
                Tu cuenta de cliente externo no tiene un número de colegiatura (COP) vinculado correctamente.
                Esto puede ocurrir si tu cuenta fue creada manualmente por un administrador.
              </p>
              <p className="text-amber-700 mb-4">
                Por favor, contacta al administrador del sistema para que complete la configuración de tu cuenta.
              </p>
              <div className="bg-white rounded-lg p-4 text-sm text-gray-600">
                <p><strong>ID de usuario:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Rol:</strong> {user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panocef-primary"></div>
        <span className="ml-2 text-gray-600">Cargando solicitudes...</span>
      </div>
    );
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.imagingStudy?.studyStatus === 'pending').length,
    completed: requests.filter(r => r.imagingStudy?.studyStatus === 'completed').length,
    delivered: requests.filter(r => r.imagingStudy?.studyStatus === 'delivered').length
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header - MISMO componente que Requests.tsx */}
      <RequestsHeader
        useCyanTheme={true}
        title={isExternalClient ? 'Mis Solicitudes' : 'Solicitudes Externas'}
        subtitle={isExternalClient
          ? 'Gestiona tus solicitudes de radiografía y tomografía'
          : 'Solicitudes de clientes externos (odontólogos)'}
        onExportPDF={() => exportToPDF(filteredRequests, formatRadiographyInfo, STUDY_STATUS, IMAGING_STUDY_TYPES)}
        onExportExcel={() => exportToExcel(filteredRequests, formatRadiographyInfo, STUDY_STATUS, IMAGING_STUDY_TYPES)}
        onNewRequest={() => window.location.href = '/laboratory/new-request'}
        onRefresh={loadRequests}
      />

      {/* Filters - MISMO componente que Requests.tsx */}
      <RequestsFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        useCyanTheme={true}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />

      {/* Stats Summary - Sin Completados/Entregados (eso está en Resultados) */}
      <RequestsStats stats={stats} useCyanTheme={true} showCompletedAndDelivered={false} />

      {/* Requests List - MISMO formato que Requests.tsx */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Solicitudes ({filteredRequests.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : isExternalClient
                    ? 'Aún no tienes solicitudes registradas'
                    : 'Aún no se han recibido solicitudes de clientes externos'
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                useCyanTheme={true}
                userRole={user?.role}
                formatRadiographyInfo={formatRadiographyInfo}
                getPriorityColor={getPriorityColor}
                onViewDetails={() => {
                  setSelectedRequest(request);
                  setShowDetailsModal(true);
                }}
                onPrint={() => handlePrintRequest(request, formatRadiographyInfo, STUDY_STATUS, IMAGING_STUDY_TYPES)}
                onSetPrice={() => {
                  setSelectedRequest(request);
                  setShowPriceModal(true);
                }}
                onUploadResults={() => {
                  setSelectedRequest(request);
                  setShowUploadModal(true);
                }}
                onViewResults={() => {
                  setSelectedRequest(request);
                  setShowViewResultsModal(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Details Modal - MISMO componente que Requests.tsx */}
      {selectedRequest && (
        <RequestDetailsModal
          isOpen={showDetailsModal}
          request={selectedRequest}
          IMAGING_STUDY_TYPES={IMAGING_STUDY_TYPES}
          STUDY_STATUS={STUDY_STATUS}
          useCyanTheme={true}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Upload Results Modal */}
      {selectedRequest && (
        <UploadResultsModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            loadRequests();
            setShowUploadModal(false);
            setSelectedRequest(null);
          }}
          requestId={selectedRequest.id}
          patientName={selectedRequest.patientName || 'Paciente'}
          studyType={IMAGING_STUDY_TYPES[selectedRequest.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES]?.label || 'Estudio'}
        />
      )}

      {/* View Results Modal */}
      {selectedRequest && (
        <ViewResultsModal
          isOpen={showViewResultsModal}
          onClose={() => {
            setShowViewResultsModal(false);
            setSelectedRequest(null);
          }}
          onMarkAsDelivered={() => {
            loadRequests();
            setShowViewResultsModal(false);
            setSelectedRequest(null);
          }}
          requestId={selectedRequest.id}
          patientName={selectedRequest.patientName || 'Paciente'}
          studyType={IMAGING_STUDY_TYPES[selectedRequest.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES]?.label || 'Estudio'}
          images={selectedRequest.radiographyData?.images || selectedRequest.imagingStudy?.images}
          reportDocument={selectedRequest.imagingStudy?.reportDocument}
          reportDocuments={selectedRequest.radiographyData?.reportDocuments}
          externalLinks={selectedRequest.radiographyData?.externalLinks}
          status={selectedRequest.radiographyData?.status || selectedRequest.imagingStudy?.studyStatus || 'pending'}
          canMarkAsDelivered={user?.role === 'imaging_technician' || user?.role === 'external_client'}
        />
      )}

      {/* Set Price Modal */}
      {selectedRequest && selectedRequest.radiographyData && (
        <SetPriceModal
          isOpen={showPriceModal}
          onClose={() => {
            setShowPriceModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            loadRequests();
            setShowPriceModal(false);
            setSelectedRequest(null);
          }}
          requestId={selectedRequest.radiographyData.id || selectedRequest.id}
          patientName={selectedRequest.patientName || 'Paciente'}
          currentPricing={selectedRequest.radiographyData.pricing}
        />
      )}
    </motion.div>
  );
};

export default SubmissionsPage;
