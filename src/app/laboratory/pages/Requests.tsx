import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileImage } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment } from '@/types';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { radiographyApi } from '@/services/api/radiographyApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';
import { NewRequestModal } from '@/components/laboratory/NewRequestModal';
import { UploadResultsModal } from '@/components/laboratory/UploadResultsModal';
import { ViewResultsModal } from '@/components/laboratory/ViewResultsModal';
import { SetPriceModal } from '@/components/laboratory/SetPriceModal';
import { useAuth } from '@/hooks/useAuth';

// Import modular components
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

const ImagingRequests = () => {
  const { user } = useAuth();
  const useCyanTheme = user?.role === 'imaging_technician' || user?.role === 'external_client';

  // SuperAdmin y Admin pueden ver todas las solicitudes (internas + externas)
  const isSuperAdminOrAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const IMAGING_STUDY_TYPES = getImagingStudyTypes(useCyanTheme);
  const STUDY_STATUS = getStudyStatus(useCyanTheme);

  const [requests, setRequests] = useState<ImagingRequestWithDetails[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ImagingRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  // SuperAdmin/Admin pueden ver solicitudes completadas/entregadas
  const [showCompletedDelivered, setShowCompletedDelivered] = useState(isSuperAdminOrAdmin);
  const [selectedRequest, setSelectedRequest] = useState<ImagingRequestWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
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

      // SuperAdmin/Admin ven TODAS las solicitudes, otros roles solo las internas
      const radiographyParams: { limit: number; source?: string } = { limit: 1000 };
      if (!isSuperAdminOrAdmin) {
        radiographyParams.source = 'internal';
      }

      const [appointmentsRes, radiographyRes, patientsRes, dentistsRes] = await Promise.all([
        appointmentsApi.getAppointments({ limit: 1000 }),
        radiographyApi.getRadiographyRequests(radiographyParams),
        patientsApi.getPatients({ limit: 1000 }),
        dentistsApi.getDentists({ limit: 100 })
      ]);

      // Crear mapas para búsqueda rápida
      const patientsMap = new Map(patientsRes.data.map(p => [p.patient_id, p]));
      const dentistsMap = new Map(dentistsRes.data.map(d => [d.dentist_id, d]));

      // Filtrar solo citas de tipo imaging_study
      const imagingAppointments = appointmentsRes.data
        .filter(apt => apt.appointment_type === 'imaging_study' || apt.services?.includes('Radiografía'))
        .map(apt => {
          const patient = patientsMap.get(apt.patient_id);
          const dentist = dentistsMap.get(apt.dentist_id);

          // IMPORTANTE: Parsear fecha sin problemas de timezone
          const dateOnly = (apt.appointment_date || '').split('T')[0];
          const [year, month, day] = dateOnly.split('-').map(Number);
          const timeParts = (apt.appointment_time || '00:00').split(':').map(Number);
          const hours = timeParts[0] || 0;
          const minutes = timeParts[1] || 0;
          const appointmentDate = new Date(year, month - 1, day, hours, minutes);

          // Parsear fechas auxiliares de manera segura
          const parseAuxDate = (dateStr: string | null | undefined) => {
            if (!dateStr) return new Date();
            const auxDateOnly = dateStr.split('T')[0];
            const [y, m, d] = auxDateOnly.split('-').map(Number);
            return new Date(y, m - 1, d);
          };

          return {
            id: apt.appointment_id?.toString() || '',
            patientId: apt.patient_id?.toString() || '',
            doctorId: apt.dentist_id?.toString() || '',
            date: appointmentDate,
            startTime: apt.appointment_time || '00:00',
            endTime: apt.appointment_time || '00:00',
            duration: apt.duration || 0,
            status: 'scheduled' as const,
            services: ['Radiografía'],
            notes: apt.notes || '',
            paymentStatus: 'pending' as const,
            totalAmount: 0,
            type: 'imaging_study' as const,
            imagingStudy: {
              studyType: 'panoramica' as const,
              studyStatus: apt.appointment_status_id === 3 ? 'completed' : 'pending',
              requestedBy: apt.dentist_id?.toString(),
              findings: undefined,
              images: undefined,
              completedAt: apt.appointment_status_id === 3 ? parseAuxDate(apt.updated_at || apt.appointment_date) : undefined,
              deliveredAt: undefined,
              technicianNotes: undefined
            },
            createdAt: parseAuxDate(apt.created_at || apt.appointment_date),
            updatedAt: parseAuxDate(apt.updated_at || apt.appointment_date),
            patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente',
            doctorName: dentist ? `Dr. ${dentist.first_name} ${dentist.last_name}` : 'Doctor'
          };
        });

      // Convertir solicitudes de radiografía a formato de appointment
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

        // Obtener datos desde request_data si existe (solicitudes PanoCef o DiagnosticPlanStep)
        const requestData = req.request_data as any;
        const pricingData = req.pricing_data as any;
        // Buscar en ambas estructuras: 'patient'/'doctor' (PanoCef) o 'patientData'/'doctorData' (DiagnosticPlanStep)
        const patientFromData = requestData?.patientData || requestData?.patient;
        const doctorFromData = requestData?.doctorData || requestData?.doctor;

        // Determinar nombre del paciente (prioridad: BD > request_data > default)
        // Soporta ambos formatos: 'nombre' (completo) o 'nombres'/'apellidos' (separados)
        const patientName = patient
          ? `${patient.first_name} ${patient.last_name}`
          : req.patient_name
          || (patientFromData
            ? (patientFromData.nombre || `${patientFromData.nombres || ''} ${patientFromData.apellidos || ''}`.trim())
            : 'Paciente');

        // Determinar nombre del doctor (prioridad: BD > request_data > default)
        // Soporta ambos formatos: 'doctor' (completo) o 'nombre'/'nombres'/'apellidos' (separados)
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
          duration: 0,
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

      // Combinar ambas listas
      // SuperAdmin/Admin ven TODAS las solicitudes incluyendo completadas/entregadas
      // Otros roles solo ven las pendientes (completadas/entregadas van a Resultados)
      const allRequests = [...imagingAppointments, ...radiographyAsAppointments].filter(req => {
        const status = req.imagingStudy?.studyStatus;
        // SuperAdmin/Admin ven todas, otros roles excluyen completadas/entregadas
        if (isSuperAdminOrAdmin) {
          return true; // Ver todas
        }
        return status !== 'completed' && status !== 'delivered';
      });

      setRequests(allRequests);
    } catch (error) {
      toast.error('Error al cargar las solicitudes de estudios');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para enviar contraoferta
  const handleCounterOffer = async (requestId: number, counterOfferPrice: number) => {
    try {
      await radiographyApi.submitCounterOffer(requestId, counterOfferPrice);
      // Recargar solicitudes para actualizar los datos
      await loadRequests();
      // Cerrar modal de detalles
      setShowDetailsModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      throw error; // Re-throw para que el modal muestre el error
    }
  };

  const filterRequests = () => {
    let filtered = requests;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${useCyanTheme ? 'border-cyan-600' : 'border-purple-600'}`}></div>
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
      {/* Header with modular component */}
      <RequestsHeader
        useCyanTheme={useCyanTheme}
        title={isSuperAdminOrAdmin ? 'Todas las Solicitudes de Laboratorio' : 'Solicitudes de Estudios de Imágenes'}
        subtitle={isSuperAdminOrAdmin ? 'Vista completa: internas + externas, todos los estados' : 'Gestión de órdenes de estudios radiológicos'}
        onExportPDF={() => exportToPDF(filteredRequests, formatRadiographyInfo, STUDY_STATUS, IMAGING_STUDY_TYPES, useCyanTheme)}
        onExportExcel={() => exportToExcel(filteredRequests, formatRadiographyInfo, STUDY_STATUS, IMAGING_STUDY_TYPES, useCyanTheme)}
        onNewRequest={() => setShowNewRequestModal(true)}
        onRefresh={loadRequests}
      />

      {/* Filters with modular component */}
      <RequestsFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        useCyanTheme={useCyanTheme}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />

      {/* Stats Summary with modular component - Sin Completados/Entregados (eso está en Resultados) */}
      <RequestsStats stats={stats} useCyanTheme={useCyanTheme} showCompletedAndDelivered={false} />

      {/* Requests List */}
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
                  : 'Aún no hay solicitudes de estudios registradas'
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                useCyanTheme={useCyanTheme}
                userRole={user?.role}
                formatRadiographyInfo={formatRadiographyInfo}
                getPriorityColor={getPriorityColor}
                onViewDetails={() => {
                  setSelectedRequest(request);
                  setShowDetailsModal(true);
                }}
                onPrint={() => handlePrintRequest(request, formatRadiographyInfo, STUDY_STATUS, IMAGING_STUDY_TYPES, useCyanTheme)}
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

      {/* Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          isOpen={showDetailsModal}
          request={selectedRequest}
          IMAGING_STUDY_TYPES={IMAGING_STUDY_TYPES}
          STUDY_STATUS={STUDY_STATUS}
          useCyanTheme={useCyanTheme}
          onClose={() => setShowDetailsModal(false)}
          userRole={user?.role}
          onCounterOffer={handleCounterOffer}
        />
      )}

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSuccess={() => {
          loadRequests();
          setShowNewRequestModal(false);
        }}
      />

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

export default ImagingRequests;
