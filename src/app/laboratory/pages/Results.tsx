import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TestTube,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Badge,
  Share,
  Mail,
  Printer,
  RefreshCw,
  ImageIcon,
  Paperclip
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ViewResultsModal } from '@/components/laboratory/ViewResultsModal';
import { RadiographyRequest } from '@/types';
import { radiographyApi, RadiographyResult } from '@/services/api/radiographyApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';

// Mapa para almacenar los resultados por solicitud
interface ResultsMap {
  [requestId: string]: {
    images: string[];
    documents: string[];
    externalLinks: string[];
    hasResults: boolean;
  };
}

interface LabResult {
  id: string;
  requestId: string;
  patientName: string;
  patientId: string;
  dentistName: string;
  testType: string;
  status: 'completed' | 'pending_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completedDate: Date;
  approvedDate?: Date;
  reportUrl: string;
  findings: string;
  conclusion: string;
  recommendations: string[];
  technician: string;
  reviewer: string;
  attachments: string[];
  report?: string; // Informe del técnico
}

const getImagingStudyTypes = () => ({
  rayos_x: { label: 'Rayos X', color: 'bg-panocef-light text-panocef-primary' },
  panoramica: { label: 'Panorámica', color: 'bg-panocef-light text-panocef-primary' },
  tomografia: { label: 'Tomografía', color: 'bg-panocef-light text-panocef-accent' },
  cefalometria: { label: 'Cefalometría', color: 'bg-pink-100 text-pink-800' },
  periapical: { label: 'Periapical', color: 'bg-green-100 text-green-800' },
  oclusal: { label: 'Oclusal', color: 'bg-yellow-100 text-yellow-800' }
} as const);

// Función para convertir tipos técnicos a nombres amigables
const formatRadiographyType = (type?: string): string => {
  if (!type) return 'Estudio';

  const typeMap: Record<string, string> = {
    'diagnostic_plan': 'Plan Diagnóstico',
    'panoramica': 'Panorámica',
    'tomografia': 'Tomografía 3D',
    'cefalometria': 'Cefalometría',
    'periapical': 'Periapical',
    'oclusal': 'Oclusal',
    'rayos_x': 'Rayos X',
    'panoramica_cefalometrica': 'Panorámica + Cefalometría'
  };

  // Buscar coincidencia exacta primero
  if (typeMap[type.toLowerCase()]) {
    return typeMap[type.toLowerCase()];
  }

  // Si no hay coincidencia exacta, devolver el tipo capitalizado
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
};

const Results = () => {
  const { user } = useAuth();
  const isExternalClient = user?.role === 'external_client';

  const IMAGING_STUDY_TYPES = getImagingStudyTypes();

  // Estados para clientes externos (solicitudes de radiografía)
  const [radiographyRequests, setRadiographyRequests] = useState<RadiographyRequest[]>([]);
  const [filteredRadiographyRequests, setFilteredRadiographyRequests] = useState<RadiographyRequest[]>([]);

  // Estados para técnicos (resultados de laboratorio tradicional)
  const [results, setResults] = useState<LabResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<LabResult[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [selectedRadiographyRequest, setSelectedRadiographyRequest] = useState<RadiographyRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Estado para almacenar los resultados cargados por solicitud
  const [resultsMap, setResultsMap] = useState<ResultsMap>({});

  // Estado para controlar qué precio está expandido
  const [expandedPricing, setExpandedPricing] = useState<string | null>(null);

  // Estado para el conteo de solicitudes pendientes (internas + externas)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, radiographyRequests, searchTerm, statusFilter, typeFilter]);

  const loadResults = async () => {
    try {
      setIsLoading(true);

      // Si es cliente externo, cargar SOLO sus solicitudes de radiografía
      // El external_client NO tiene acceso a la lista de pacientes ni dentistas
      // Usa los datos que vienen incluidos en cada solicitud de radiografía
      if (isExternalClient && user) {
        let radiographyRes = { data: [] as any[] };

        // Cargar solicitudes (el backend ya filtra por dentist_id del external_client)
        try {
          radiographyRes = await radiographyApi.getRadiographyRequests({ limit: 1000 });
        } catch (error) {
          console.error('[Results] Error al cargar solicitudes de radiografía:', error);
        }

        // Para external_client: NO cargar pacientes ni dentistas
        // Usar solo los datos que vienen en request_data de cada solicitud

        // Para clientes externos, el backend ya filtra por su dentist_id
        // Solo mostrar solicitudes COMPLETADAS o ENTREGADAS (que tienen resultados)
        // Las solicitudes pendientes se muestran en "Solicitudes Externas"
        const mappedRequests: RadiographyRequest[] = radiographyRes.data
          .filter(req => {
            const status = req.request_status;
            return status === 'completed' || status === 'delivered';
          })
          .map(req => {
            // Usar date_time_registration (fecha de llegada real) en lugar de request_date
            const reqDate = new Date(req.date_time_registration || req.request_date);
            const requestData = req.request_data as any;
            const pricingData = req.pricing_data as any;
            const patientFromData = requestData?.patient || requestData?.patientData;
            const doctorFromData = requestData?.doctor || requestData?.doctorData;

            // Obtener nombre del paciente desde los datos de la solicitud
            const patientName = req.patient_name
              || (patientFromData
                ? (patientFromData.nombre || `${patientFromData.nombres || ''} ${patientFromData.apellidos || ''}`.trim())
                : 'Paciente');

            // Obtener nombre del doctor desde los datos de la solicitud
            const doctorName = req.dentist_name
              || (doctorFromData
                ? `Dr. ${doctorFromData.doctor?.replace('Dr. ', '') || doctorFromData.nombre || ''}`.trim()
                : 'Doctor');

            return {
              id: (req.radiography_request_id || req.request_id)?.toString() || '',
              requesterId: req.dentist_id?.toString() || '',
              radiographyType: req.radiography_type,
              patientData: {
                nombre: patientName,
                dni: patientFromData?.dni || ''
              },
              doctorData: {
                doctor: doctorName
              },
              status: req.request_status || 'pending', // Usar request_status, NO status
              notes: req.notes,
              images: req.image_url ? [req.image_url] : undefined,
              pricing: pricingData,
              createdAt: reqDate,
              updatedAt: new Date(req.date_time_modification || req.request_date),
              completedAt: req.performed_date ? new Date(req.performed_date) : undefined,
              deliveredAt: undefined,
              source: 'external' // Las solicitudes de cliente externo siempre son externas
            };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setRadiographyRequests(mappedRequests);

        // Cargar resultados para cada solicitud completada del cliente externo
        const newResultsMap: ResultsMap = {};
        await Promise.all(
          mappedRequests.map(async (request) => {
            try {
              const resultsResponse = await radiographyApi.getResults(parseInt(request.id));
              if (resultsResponse.success && resultsResponse.data) {
                const results = resultsResponse.data.results || [];
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

                newResultsMap[request.id] = {
                  images: results
                    .filter((r: RadiographyResult) => r.result_type === 'image' && r.file_path)
                    .map((r: RadiographyResult) => `${baseUrl}${r.file_path}`),
                  documents: results
                    .filter((r: RadiographyResult) => r.result_type === 'document' && r.file_path)
                    .map((r: RadiographyResult) => `${baseUrl}${r.file_path}`),
                  externalLinks: results
                    .filter((r: RadiographyResult) => r.result_type === 'external_link' && r.external_url)
                    .map((r: RadiographyResult) => r.external_url as string),
                  hasResults: results.length > 0
                };
              }
            } catch (err) {
              console.warn(`[Results] No se pudieron cargar resultados para solicitud ${request.id}:`, err);
              newResultsMap[request.id] = {
                images: [],
                documents: [],
                externalLinks: [],
                hasResults: false
              };
            }
          })
        );

        setResultsMap(newResultsMap);
        setIsLoading(false);
        return;
      }

      // Si es técnico de imágenes, cargar solicitudes COMPLETADAS (internas Y externas)
      // Estas son las solicitudes a las que ya se les subieron resultados
      try {
        // Cargar AMBAS fuentes: internas y externas
        // Usar llamadas individuales con manejo de errores para evitar que un fallo bloquee todo
        let internalRes = { data: [] as any[] };
        let externalRes = { data: [] as any[] };
        let patientsRes = { data: [] as any[] };
        let dentistsRes = { data: [] as any[] };

        // Cargar solicitudes de radiografía (crítico)
        try {
          const [internal, external] = await Promise.all([
            radiographyApi.getRadiographyRequests({ limit: 1000, source: 'internal' }),
            radiographyApi.getRadiographyRequests({ limit: 1000, source: 'external' })
          ]);
          internalRes = internal;
          externalRes = external;
        } catch (error) {
          console.error('[Results] Error al cargar solicitudes de radiografía:', error);
        }

        // Cargar pacientes y dentistas (no crítico - usar datos de respaldo si falla)
        try {
          patientsRes = await patientsApi.getPatients({ limit: 1000 });
        } catch (error) {
          console.warn('[Results] No se pudieron cargar pacientes, usando datos de la solicitud:', error);
        }

        try {
          dentistsRes = await dentistsApi.getDentists({ limit: 100 });
        } catch (error) {
          console.warn('[Results] No se pudieron cargar dentistas, usando datos de la solicitud:', error);
        }

        // Combinar solicitudes internas y externas
        const allRequests = [
          ...internalRes.data.map(r => ({ ...r, _source: 'internal' })),
          ...externalRes.data.map(r => ({ ...r, _source: 'external' }))
        ];

        // Contar solicitudes pendientes (internas + externas) para el card de estadísticas
        const pendingCount = allRequests.filter(req => {
          const status = req.request_status;
          return status === 'pending' || status === 'price_pending' || status === 'price_approved';
        }).length;
        setPendingRequestsCount(pendingCount);

        console.log('[Results] Solicitudes cargadas:', {
          internas: internalRes.data?.length,
          externas: externalRes.data?.length,
          total: allRequests.length,
          pendientes: pendingCount
        });

        // Crear alias para compatibilidad
        const radiographyRes = { data: allRequests };

        console.log('[Results] Solicitudes totales cargadas:', radiographyRes.data?.length);
        console.log('[Results] Estados de solicitudes:', radiographyRes.data?.map(r => ({
          id: r.radiography_request_id || r.request_id,
          status: r.request_status
        })));

        // Crear mapas para búsqueda rápida
        const patientsMap = new Map(patientsRes.data.map(p => [p.patient_id, p]));
        const dentistsMap = new Map(dentistsRes.data.map(d => [d.dentist_id, d]));

        // Filtrar solo solicitudes completadas o entregadas
        const completedRequests: RadiographyRequest[] = radiographyRes.data
          .filter(req => {
            const status = req.request_status;
            const isCompleted = status === 'completed' || status === 'delivered';
            console.log(`[Results] Solicitud ${req.radiography_request_id}: status=${status}, incluida=${isCompleted}`);
            return isCompleted;
          })
          .map(req => {
            const patient = patientsMap.get(req.patient_id);
            const dentist = dentistsMap.get(req.dentist_id);
            // Usar date_time_registration (fecha de llegada real) en lugar de request_date
            const reqDate = new Date(req.date_time_registration || req.request_date);
            const requestData = req.request_data as any;
            const pricingData = req.pricing_data as any;
            const patientFromData = requestData?.patientData || requestData?.patient;
            const doctorFromData = requestData?.doctorData || requestData?.doctor;

            const patientName = patient
              ? `${patient.first_name} ${patient.last_name}`
              : req.patient_name
              || (patientFromData
                ? (patientFromData.nombre || `${patientFromData.nombres || ''} ${patientFromData.apellidos || ''}`.trim())
                : 'Paciente');

            const doctorName = dentist
              ? `Dr. ${dentist.first_name} ${dentist.last_name}`
              : req.dentist_name
              || (doctorFromData
                ? `Dr. ${doctorFromData.doctor?.replace('Dr. ', '') || doctorFromData.nombre || ''}`.trim()
                : 'Doctor');

            return {
              id: (req.radiography_request_id || req.request_id)?.toString() || '',
              requesterId: req.dentist_id?.toString() || '',
              radiographyType: req.radiography_type,
              patientData: {
                nombre: patientName,
                dni: patient?.identification_number || patientFromData?.dni || ''
              },
              doctorData: {
                doctor: doctorName
              },
              status: req.request_status || 'completed',
              notes: req.notes,
              images: req.image_url ? [req.image_url] : undefined,
              pricing: pricingData,
              createdAt: reqDate,
              updatedAt: new Date(req.date_time_modification || req.request_date),
              completedAt: req.performed_date ? new Date(req.performed_date) : undefined,
              deliveredAt: undefined,
              // Indicador de si es solicitud externa o interna
              source: (req as any)._source || 'internal'
            };
          })
          .sort((a, b) => {
            // Ordenar por fecha de completado (más reciente primero)
            const dateA = a.completedAt?.getTime() || a.createdAt.getTime();
            const dateB = b.completedAt?.getTime() || b.createdAt.getTime();
            return dateB - dateA;
          });

        console.log('[Results] Solicitudes completadas encontradas:', completedRequests.length);
        setRadiographyRequests(completedRequests);

        // Cargar resultados para cada solicitud completada
        const newResultsMap: ResultsMap = {};

        await Promise.all(
          completedRequests.map(async (request) => {
            try {
              const resultsResponse = await radiographyApi.getResults(parseInt(request.id));
              if (resultsResponse.success && resultsResponse.data) {
                const results = resultsResponse.data.results || [];
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

                newResultsMap[request.id] = {
                  images: results
                    .filter((r: RadiographyResult) => r.result_type === 'image' && r.file_path)
                    .map((r: RadiographyResult) => `${baseUrl}${r.file_path}`),
                  documents: results
                    .filter((r: RadiographyResult) => r.result_type === 'document' && r.file_path)
                    .map((r: RadiographyResult) => `${baseUrl}${r.file_path}`),
                  externalLinks: results
                    .filter((r: RadiographyResult) => r.result_type === 'external_link' && r.external_url)
                    .map((r: RadiographyResult) => r.external_url as string),
                  hasResults: results.length > 0
                };
              }
            } catch (err) {
              console.warn(`[Results] No se pudieron cargar resultados para solicitud ${request.id}:`, err);
              newResultsMap[request.id] = {
                images: [],
                documents: [],
                externalLinks: [],
                hasResults: false
              };
            }
          })
        );

        setResultsMap(newResultsMap);
        console.log('[Results] Mapa de resultados cargado:', newResultsMap);
      } catch (error) {
        console.error('Error al cargar resultados:', error);
        setRadiographyRequests([]);
      }
    } catch (error) {
      console.error('[Results] Error general:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterResults = () => {
    // Filtrado para clientes externos y técnicos de imágenes (radiografía)
    const useRadiographyView = isExternalClient || user?.role === 'imaging_technician';

    if (useRadiographyView) {
      let filtered = radiographyRequests;

      if (searchTerm) {
        filtered = filtered.filter(request =>
          request.patientData?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.patientData?.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.doctorData?.doctor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(request => request.status === statusFilter);
      }

      setFilteredRadiographyRequests(filtered);
      return;
    }

    // Filtrado para otros roles (laboratorio tradicional)
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.dentistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.requestId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(result =>
        result.testType.toLowerCase().includes(typeFilter.toLowerCase())
      );
    }

    setFilteredResults(filtered);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Aprobado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'completed':
        return { label: 'Completado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle };
      case 'pending_review':
        return { label: 'Pendiente Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'pending':
        return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'price_pending':
        return { label: 'Evaluando Precio', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
      case 'price_approved':
        return { label: 'Precio Aprobado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle };
      case 'delivered':
        return { label: 'Entregado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'rejected':
        return { label: 'Rechazado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle };
      case 'cancelled':
        return { label: 'Cancelado', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const openDetailModal = (result: LabResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const openViewResultsModal = (request: RadiographyRequest) => {
    setSelectedRadiographyRequest(request);
    setShowResultsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Cargando resultados...</span>
      </div>
    );
  }

  // Vista para clientes externos y técnicos de imágenes (solicitudes de radiografía)
  // El técnico ve las solicitudes internas completadas, el cliente externo ve sus propias solicitudes
  const showRadiographyView = isExternalClient || user?.role === 'imaging_technician';

  if (showRadiographyView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-panocef-light`}>
                <ImageIcon className={`w-6 h-6 text-panocef-primary`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isExternalClient ? 'Mis Solicitudes' : 'Resultados de Estudios'}
                </h1>
                <p className="text-gray-600">
                  {isExternalClient
                    ? 'Consulta y descarga los resultados de tus estudios radiográficos'
                    : 'Solicitudes internas y externas con resultados adjuntos'}
                </p>
              </div>
            </div>
            <button
              onClick={loadResults}
              className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-panocef-primary hover:bg-panocef-dark`}
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Search Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por paciente, DNI, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:ring-panocef-primary`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:ring-panocef-primary`}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingRequestsCount}
                </p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-panocef-light`}>
                <CheckCircle className={`w-5 h-5 text-panocef-accent`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {radiographyRequests.filter(r => r.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Completados</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {radiographyRequests.filter(r => r.status === 'delivered').length}
                </p>
                <p className="text-sm text-gray-600">Entregados</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{radiographyRequests.length}</p>
                <p className="text-sm text-gray-600">Total Solicitudes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Mis Solicitudes ({filteredRadiographyRequests.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredRadiographyRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;
              // Verificar si hay resultados en el mapa cargado
              const requestResults = resultsMap[request.id];
              const hasResults = requestResults?.hasResults || false;

              return (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-panocef-light`}>
                          <ImageIcon className={`w-6 h-6 text-panocef-primary`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatRadiographyType(request.radiographyType)} #{request.id}
                            </h3>
                            {/* Badge para indicar si es solicitud externa o interna */}
                            {(request as any).source === 'external' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-panocef-light text-panocef-primary border border-panocef-secondary">
                                Externa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                Interna
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </span>
                            {hasResults && request.status === 'completed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                <Download className="w-3 h-3 mr-1" />
                                Disponible
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Paciente:</span>
                              <span className="font-medium text-gray-900">{request.patientData.nombre}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Doctor:</span>
                              <span className="font-medium text-gray-900">{request.doctorData.doctor}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Llegada:</span>
                              <span className="font-medium text-gray-900">
                                {new Date(request.createdAt).toLocaleDateString('es-PE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Mostrar precio con opción de ver desglose */}
                          {request.pricing?.finalPrice && request.status !== 'pending' && (
                            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-900">Precio del Servicio</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xl font-bold text-green-700">
                                    S/. {request.pricing.finalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  {request.pricing.breakdown && request.pricing.breakdown.length > 0 && (
                                    <button
                                      onClick={() => setExpandedPricing(expandedPricing === request.id ? null : request.id)}
                                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                      title="Ver detalle"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Desglose expandible */}
                              {expandedPricing === request.id && request.pricing.breakdown && (
                                <div className="mt-3 pt-3 border-t border-green-200">
                                  <p className="text-xs font-medium text-green-800 mb-2">Detalle de servicios:</p>
                                  <div className="space-y-1">
                                    {request.pricing.breakdown.map((item: any, idx: number) => {
                                      const itemName = item.itemName || item.service || 'Servicio';
                                      const itemPrice = item.subtotal ?? item.price ?? 0;
                                      return (
                                        <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-green-700">{itemName}</span>
                                          <span className="text-green-800 font-medium">
                                            S/. {Number(itemPrice).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {request.pricing.notes && (
                                <p className="text-xs text-green-600 mt-2">
                                  Nota: {request.pricing.notes}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Mensaje cuando el precio está pendiente */}
                          {request.status === 'pending' && !request.pricing?.finalPrice && (
                            <div className={`mb-3 p-3 rounded-lg border bg-panocef-light border-panocef-secondary`}>
                              <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 text-panocef-primary`} />
                                <span className={`text-sm text-panocef-dark`}>
                                  El precio del servicio está siendo evaluado por nuestro equipo
                                </span>
                              </div>
                            </div>
                          )}

                          {request.completedAt && (
                            <div className="text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                              Completado: {new Date(request.completedAt).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {hasResults ? (
                        <button
                          onClick={() => openViewResultsModal(request)}
                          className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 bg-panocef-primary hover:bg-panocef-dark`}
                        >
                          <Eye className="w-4 h-4" />
                          Ver Resultados
                        </button>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          {request.status === 'pending' && 'Esperando procesamiento'}
                          {request.status === 'cancelled' && 'Solicitud cancelada'}
                          {(request.status === 'completed' || request.status === 'delivered') && 'Cargando resultados...'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRadiographyRequests.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no has realizado ninguna solicitud'}
              </p>
            </div>
          )}
        </div>

        {/* Modal de visualización de resultados */}
        {selectedRadiographyRequest && (
          <ViewResultsModal
            isOpen={showResultsModal}
            onClose={() => {
              setShowResultsModal(false);
              setSelectedRadiographyRequest(null);
            }}
            onMarkAsDelivered={loadResults}
            requestId={selectedRadiographyRequest.id}
            patientName={selectedRadiographyRequest.patientData.nombre}
            studyType={formatRadiographyType(selectedRadiographyRequest.radiographyType)}
            images={resultsMap[selectedRadiographyRequest.id]?.images || []}
            reportDocuments={resultsMap[selectedRadiographyRequest.id]?.documents || []}
            externalLinks={resultsMap[selectedRadiographyRequest.id]?.externalLinks || []}
            status={selectedRadiographyRequest.status}
            canMarkAsDelivered={isExternalClient || user?.role === 'imaging_technician'}
          />
        )}
      </motion.div>
    );
  }

  // Vista para técnicos (resultados de laboratorio tradicional)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TestTube className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resultados de Laboratorio</h1>
              <p className="text-gray-600">Consulta, revisión y descarga de resultados</p>
            </div>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por paciente, ID o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="approved">Aprobado</option>
            <option value="completed">Completado</option>
            <option value="pending_review">Pendiente Revisión</option>
            <option value="rejected">Rechazado</option>
          </select>

          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="biopsia">Biopsia</option>
            <option value="cultivo">Cultivo</option>
            <option value="citología">Citología</option>
            <option value="sensibilidad">Sensibilidad</option>
          </select>

          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-600">Aprobados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-panocef-light`}>
              <TestTube className={`w-5 h-5 text-panocef-primary`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.status === 'pending_review').length}
              </p>
              <p className="text-sm text-gray-600">Pendiente Revisión</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              <p className="text-sm text-gray-600">Total Resultados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Resultados Disponibles ({filteredResults.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredResults.map((result) => {
            const statusConfig = getStatusConfig(result.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={result.id} className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(result.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <TestTube className="w-6 h-6 text-green-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{result.id}</h3>
                          <span className="text-sm text-gray-500">#{result.requestId}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Paciente:</span>
                            <span className="font-medium text-gray-900">{result.patientName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Médico:</span>
                            <span className="font-medium text-gray-900">{result.dentistName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Completado:</span>
                            <span className="font-medium text-gray-900">{result.completedDate.toLocaleDateString('es-ES')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Técnico:</span>
                            <span className="font-medium text-gray-900">{result.technician}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">{result.testType}</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">{result.conclusion}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openDetailModal(result)}
                      className={`p-2 text-gray-600 rounded-lg transition-colors hover:text-panocef-primary hover:bg-panocef-light`}
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Descargar">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className={`p-2 text-gray-600 rounded-lg transition-colors hover:text-panocef-primary hover:bg-panocef-light`} title="Compartir">
                      <Share className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Imprimir">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay resultados disponibles'
              }
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedResult && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TestTube className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedResult.id}</h2>
                    <p className="text-gray-600">{selectedResult.testType}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Paciente</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Nombre:</span> <span className="font-medium">{selectedResult.patientName}</span></div>
                    <div><span className="text-gray-600">ID:</span> <span className="font-medium">{selectedResult.patientId}</span></div>
                    <div><span className="text-gray-600">Médico:</span> <span className="font-medium">{selectedResult.dentistName}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Estudio</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Técnico:</span> <span className="font-medium">{selectedResult.technician}</span></div>
                    <div><span className="text-gray-600">Revisor:</span> <span className="font-medium">{selectedResult.reviewer}</span></div>
                    <div><span className="text-gray-600">Completado:</span> <span className="font-medium">{selectedResult.completedDate.toLocaleDateString('es-ES')}</span></div>
                    {selectedResult.approvedDate && (
                      <div><span className="text-gray-600">Aprobado:</span> <span className="font-medium">{selectedResult.approvedDate.toLocaleDateString('es-ES')}</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Hallazgos</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedResult.findings}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Conclusión</h3>
                <p className={`text-gray-700 p-4 rounded-lg bg-panocef-light`}>{selectedResult.conclusion}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recomendaciones</h3>
                <ul className="space-y-2">
                  {selectedResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Attachments */}
              {selectedResult.attachments && selectedResult.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Archivos Adjuntos ({selectedResult.attachments.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedResult.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-panocef-light`}>
                          <FileText className={`w-5 h-5 text-panocef-primary`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attachment}</p>
                          <p className="text-xs text-gray-500">Archivo adjunto</p>
                        </div>
                        <button
                          className={`p-2 rounded-lg transition-colors text-panocef-primary hover:text-panocef-dark hover:bg-panocef-light`}
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
                <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Enviar por Email
                </button>
                <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Results;