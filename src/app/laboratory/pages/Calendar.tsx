import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  RefreshCw,
  Eye,
  FileImage,
  User,
  Filter,
  CheckCircle2,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { radiographyApi } from '@/services/api/radiographyApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';
import type { Appointment, Patient, User as UserType } from '@/types';
import { NewRequestModal } from '@/components/laboratory/NewRequestModal';
import { useAuth } from '@/hooks/useAuth';

// Función para obtener tipos de estudios con colores condicionales
const getImagingStudyTypes = (useCyanTheme: boolean): Record<string, { label: string; icon: string; color: string }> => ({
  rayos_x: { label: 'Rayos X', icon: '📷', color: useCyanTheme ? 'bg-cyan-50 text-cyan-700' : 'bg-blue-50 text-blue-700' },
  panoramica: { label: 'Panorámica', icon: '🌐', color: useCyanTheme ? 'bg-cyan-50 text-cyan-700' : 'bg-purple-50 text-purple-700' },
  tomografia: { label: 'Tomografía', icon: '🔬', color: useCyanTheme ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700' },
  cefalometria: { label: 'Cefalometría', icon: '📐', color: useCyanTheme ? 'bg-teal-50 text-teal-700' : 'bg-green-50 text-green-700' },
  periapical: { label: 'Periapical', icon: '🦷', color: 'bg-yellow-50 text-yellow-700' },
  oclusal: { label: 'Oclusal', icon: '🔍', color: useCyanTheme ? 'bg-cyan-50 text-cyan-700' : 'bg-indigo-50 text-indigo-700' }
});

// Función para obtener estados de estudios con colores condicionales
// Estados automáticos:
// - pending: Recién ingresada
// - completed: Se subieron los resultados
// - delivered: El cliente ya visualizó los resultados
const getStudyStatus = (useCyanTheme: boolean): Record<string, { label: string; icon: any; color: string }> => ({
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completado', icon: CheckCircle2, color: useCyanTheme ? 'bg-teal-100 text-teal-800' : 'bg-green-100 text-green-800' },
  delivered: { label: 'Entregado', icon: Package, color: 'bg-gray-100 text-gray-800' }
});

interface ImagingRequestWithDetails extends Appointment {
  patientName?: string;
  doctorName?: string;
}

const ImagingCalendar = () => {
  const { user } = useAuth();
  const useCyanTheme = user?.role === 'imaging_technician' || user?.role === 'external_client';

  const [appointments, setAppointments] = useState<ImagingRequestWithDetails[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<ImagingRequestWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const IMAGING_STUDY_TYPES = getImagingStudyTypes(useCyanTheme);
  const STUDY_STATUS = getStudyStatus(useCyanTheme);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // El técnico de imágenes y external_client solo ven solicitudes de radiografía
      // NO deben ver citas médicas de doctores
      const isImagingTechnician = user?.role === 'imaging_technician';
      const isExternalClient = user?.role === 'external_client';

      // Determinar qué solicitudes cargar según el rol:
      // - imaging_technician: ve TODAS las solicitudes (internas + externas)
      // - external_client: solo sus propias solicitudes (filtrado automático en backend)
      // - admin/super_admin: pueden ver todo
      const radiographyParams: { limit: number; source?: string } = { limit: 1000 };
      // Para external_client, el backend ya filtra automáticamente por su dentist_id
      // Para imaging_technician, cargar todas las solicitudes (sin filtro de source)

      const [radiographyRes, patientsRes, dentistsRes] = await Promise.all([
        radiographyApi.getRadiographyRequests(radiographyParams),
        patientsApi.getPatients({ limit: 1000 }),
        dentistsApi.getDentists({ limit: 100 })
      ]);

      // Crear mapas para búsqueda rápida
      const patientsMap = new Map(patientsRes.data.map(p => [p.patient_id, p]));
      const dentistsMap = new Map(dentistsRes.data.map(d => [d.dentist_id, d]));

      // Convertir solicitudes de radiografía a formato de appointment
      // MISMO formato que usan Requests.tsx y Submissions.tsx
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
        const patientName = patient
          ? `${patient.first_name} ${patient.last_name}`
          : req.patient_name
          || (patientFromData
            ? (patientFromData.nombre || `${patientFromData.nombres || ''} ${patientFromData.apellidos || ''}`.trim())
            : 'Paciente');

        // Determinar nombre del doctor (prioridad: BD > request_data > default)
        const doctorName = dentist
          ? `Dr. ${dentist.first_name} ${dentist.last_name}`
          : req.dentist_name
          || (doctorFromData
            ? `Dr. ${doctorFromData.doctor?.replace('Dr. ', '') || doctorFromData.nombre || `${doctorFromData.nombres || ''} ${doctorFromData.apellidos || ''}`.trim()}`
            : 'Doctor externo');

        return {
          id: (req.radiography_request_id || req.request_id)?.toString() || '',
          patientId: req.patient_id?.toString() || '',
          dentistId: req.dentist_id?.toString() || '',
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
          doctorName: doctorName
        };
      });

      // Map patients and doctors para funciones de búsqueda
      const patientsData: Patient[] = patientsRes.data.map(p => ({
        id: p.patient_id?.toString() || '',
        dni: p.identification || '',
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        email: p.email || '',
        phone: p.phone || '',
        birthDate: p.birth_date ? new Date(p.birth_date) : new Date(),
        gender: (p.gender || 'M') as 'M' | 'F' | 'O',
        address: p.address || '',
        registrationDate: new Date(),
        isActive: true
      }));

      const doctorsData: UserType[] = dentistsRes.data.map(d => ({
        id: d.dentist_id?.toString() || '',
        email: d.email || '',
        firstName: d.first_name || '',
        lastName: d.last_name || '',
        role: 'doctor',
        profile: {
          phone: d.phone || '',
          licenseNumber: d.license_number || '',
          specialties: d.specialization ? [d.specialization] : [],
          firstName: d.first_name || '',
          lastName: d.last_name || '',
          department: 'Odontología'
        },
        isActive: d.is_active !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Solo mostrar solicitudes de radiografía (sincronizado con Requests.tsx y Submissions.tsx)
      setAppointments(radiographyAsAppointments);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      toast.error('Error al cargar los estudios de imágenes');
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientName = (appointment: ImagingRequestWithDetails) => {
    // Si tiene el nombre pre-cargado (de radiography request), usarlo
    if (appointment.patientName) {
      return appointment.patientName;
    }
    // Si no, buscar en la lista de pacientes
    const patient = patients.find(p => p.id === appointment.patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente desconocido';
  };

  const getDoctorName = (appointment: ImagingRequestWithDetails) => {
    // Si tiene el nombre pre-cargado (de radiography request), usarlo
    if (appointment.doctorName) {
      return `Dr. ${appointment.doctorName}`;
    }
    // Si no, buscar en la lista de doctores
    const doctor = doctors.find(d => d.id === appointment.doctorId);
    return doctor ? `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}` : 'Doctor desconocido';
  };

  // Filtrar citas
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = selectedStatus === 'all' || apt.imagingStudy?.studyStatus === selectedStatus;
    const matchesSearch = searchTerm === '' ||
      getPatientName(apt).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDoctorName(apt).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Vista de día
  const getDayViewAppointments = () => {
    return filteredAppointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === currentDate.toDateString();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Vista de semana
  const getWeekViewAppointments = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return filteredAppointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= weekStart && aptDate < weekEnd;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Vista de mes - generar días del calendario
  const generateMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getAppointmentsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === targetDate.toDateString();
    });
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Estadísticas
  const getStats = () => {
    const pending = filteredAppointments.filter(a => a.imagingStudy?.studyStatus === 'pending').length;
    const completed = filteredAppointments.filter(a => a.imagingStudy?.studyStatus === 'completed').length;
    const delivered = filteredAppointments.filter(a => a.imagingStudy?.studyStatus === 'delivered').length;

    return { pending, completed, delivered };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${useCyanTheme ? 'border-cyan-600' : 'border-purple-600'}`}></div>
      </div>
    );
  }

  const stats = getStats();
  const monthDays = generateMonthCalendar();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${useCyanTheme ? 'bg-cyan-100' : 'bg-purple-100'}`}>
                <FileImage className={`w-6 h-6 ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendario de Solicitudes</h1>
                <p className="text-gray-600">Vista calendario de solicitudes de radiografía (internas + externas)</p>
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentDate(new Date());
                loadData();
              }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${useCyanTheme ? 'text-cyan-600 border-cyan-300 hover:bg-cyan-50' : 'text-purple-600 border-purple-300 hover:bg-purple-50'}`}
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${useCyanTheme ? 'bg-teal-50 border-teal-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${useCyanTheme ? 'text-teal-700' : 'text-green-700'}`}>Completados</p>
                  <p className={`text-2xl font-bold ${useCyanTheme ? 'text-teal-900' : 'text-green-900'}`}>{stats.completed}</p>
                </div>
                <CheckCircle2 className={`w-8 h-8 ${useCyanTheme ? 'text-teal-600' : 'text-green-600'}`} />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Entregados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                </div>
                <Package className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex gap-4">
            <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por paciente o doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="completed">Completado</option>
                <option value="delivered">Entregado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateCalendar('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold text-gray-900 min-w-[300px]">
                {viewMode === 'day' && (
                  currentDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                )}
                {viewMode === 'week' && (
                  `Semana del ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                )}
                {viewMode === 'month' && (
                  currentDate.toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                  }).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                )}
              </h2>

              <button
                onClick={() => navigateCalendar('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'day'
                    ? `bg-white shadow-sm ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? `bg-white shadow-sm ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? `bg-white shadow-sm ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="p-4">
            {/* Vista de Día */}
            {viewMode === 'day' && (
              <div className="space-y-3">
                {getDayViewAppointments().length === 0 ? (
                  <div className="text-center py-12">
                    <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay estudios programados</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No hay estudios de imágenes para este día.
                    </p>
                  </div>
                ) : (
                  getDayViewAppointments().map(appointment => {
                    const studyType = IMAGING_STUDY_TYPES[appointment.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES];
                    const studyStatus = STUDY_STATUS[appointment.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS];
                    const StatusIcon = studyStatus?.icon || Clock;
                    // Usar startTime o time directamente, no extraer de date
                    const time = appointment.startTime || (appointment as any).time || '00:00';

                    return (
                      <div
                        key={appointment.id}
                        className={`p-4 border-2 border-gray-200 rounded-lg transition-all hover:shadow-md cursor-pointer ${useCyanTheme ? 'hover:border-cyan-300' : 'hover:border-purple-300'}`}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailsModal(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="text-2xl">{studyType?.icon || '📷'}</div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-lg font-semibold text-gray-900">{time}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${studyType?.color || 'bg-gray-100'}`}>
                                {studyType?.label || 'Estudio'}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${studyStatus?.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {studyStatus?.label}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900">
                              {getPatientName(appointment)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Solicitado por: {getDoctorName(appointment)}
                            </div>
                          </div>

                          <button className={`font-medium text-sm flex items-center gap-1 ${useCyanTheme ? 'text-cyan-600 hover:text-cyan-700' : 'text-purple-600 hover:text-purple-700'}`}>
                            <Eye className="w-4 h-4" />
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Vista de Semana */}
            {viewMode === 'week' && (
              <div className="space-y-4">
                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dayName, index) => {
                  const weekStart = new Date(currentDate);
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                  const dayDate = new Date(weekStart);
                  dayDate.setDate(dayDate.getDate() + index);

                  const dayAppointments = filteredAppointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate.toDateString() === dayDate.toDateString();
                  });

                  const isToday = dayDate.toDateString() === new Date().toDateString();

                  return (
                    <div key={index} className={`border rounded-lg ${isToday ? (useCyanTheme ? 'border-cyan-300 bg-cyan-50' : 'border-purple-300 bg-purple-50') : 'border-gray-200'}`}>
                      <div className={`p-3 border-b ${isToday ? (useCyanTheme ? 'bg-cyan-100 border-cyan-200' : 'bg-purple-100 border-purple-200') : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${isToday ? (useCyanTheme ? 'text-cyan-900' : 'text-purple-900') : 'text-gray-900'}`}>
                            {dayName}, {dayDate.getDate()} de {dayDate.toLocaleDateString('es-ES', { month: 'long' })}
                          </span>
                          <span className={`text-sm ${isToday ? (useCyanTheme ? 'text-cyan-700' : 'text-purple-700') : 'text-gray-600'}`}>
                            {dayAppointments.length} estudio{dayAppointments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        {dayAppointments.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">Sin estudios programados</p>
                        ) : (
                          <div className="space-y-2">
                            {dayAppointments.map(apt => {
                              const studyType = IMAGING_STUDY_TYPES[apt.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES];
                              const studyStatus = STUDY_STATUS[apt.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS];
                              const StatusIcon = studyStatus?.icon || Clock;

                              return (
                                <div
                                  key={apt.id}
                                  className={`flex items-center gap-3 p-2 bg-white rounded border border-gray-200 cursor-pointer ${useCyanTheme ? 'hover:border-cyan-300' : 'hover:border-purple-300'}`}
                                  onClick={() => {
                                    setSelectedAppointment(apt);
                                    setShowDetailsModal(true);
                                  }}
                                >
                                  <span className="text-lg">{studyType?.icon || '📷'}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">{new Date(apt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${studyStatus?.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {studyStatus?.label}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-900 truncate">{getPatientName(apt)}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vista de Mes */}
            {viewMode === 'month' && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="p-2 bg-gray-50 rounded" />;
                    }

                    const dayAppointments = getAppointmentsForDate(day);
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isToday = dayDate.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={day}
                        className={`p-2 border rounded-lg min-h-[100px] transition-colors cursor-pointer ${
                          isToday
                            ? (useCyanTheme ? 'border-cyan-500 bg-cyan-50' : 'border-purple-500 bg-purple-50')
                            : 'border-gray-200'
                        } ${useCyanTheme ? 'hover:border-cyan-300' : 'hover:border-purple-300'}`}
                        onClick={() => {
                          setSelectedDate(dayDate);
                          setShowNewRequestModal(true);
                        }}
                      >
                        <div className={`text-sm font-semibold mb-1 ${isToday ? (useCyanTheme ? 'text-cyan-700' : 'text-purple-700') : 'text-gray-900'}`}>
                          {day}
                        </div>
                        {dayAppointments.length > 0 && (
                          <div className="space-y-1">
                            {dayAppointments.slice(0, 2).map(apt => {
                              const studyStatus = STUDY_STATUS[apt.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS];
                              return (
                                <div
                                  key={apt.id}
                                  className={`text-xs p-1 rounded ${studyStatus?.color || 'bg-gray-100'}`}
                                >
                                  {new Date(apt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              );
                            })}
                            {dayAppointments.length > 2 && (
                              <div className="text-xs text-gray-600 font-medium">
                                +{dayAppointments.length - 2} más
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAppointment && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detalles del Estudio de Imágenes</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Información del Paciente
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="text-gray-600 w-24">Nombre:</span>
                        <span className="font-medium">{getPatientName(selectedAppointment)}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-24">Fecha:</span>
                        <span className="font-medium">{new Date(selectedAppointment.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-24">Hora:</span>
                        <span className="font-medium">{new Date(selectedAppointment.date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Detalles del Estudio
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="text-gray-600 w-24">Tipo:</span>
                        <span className="font-medium">
                          {IMAGING_STUDY_TYPES[selectedAppointment.imagingStudy?.studyType as keyof typeof IMAGING_STUDY_TYPES]?.label || 'No especificado'}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-24">Estado:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          STUDY_STATUS[selectedAppointment.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS]?.color
                        }`}>
                          {STUDY_STATUS[selectedAppointment.imagingStudy?.studyStatus as keyof typeof STUDY_STATUS]?.label}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-24">Solicitado por:</span>
                        <span className="font-medium">{getDoctorName(selectedAppointment)}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-24">Duración:</span>
                        <span className="font-medium">{selectedAppointment.duration} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Notas del Estudio</h4>
                    <div className="text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                )}

                {selectedAppointment.imagingStudy?.findings && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Hallazgos</h4>
                    <div className="text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
                      {selectedAppointment.imagingStudy.findings}
                    </div>
                  </div>
                )}

                {selectedAppointment.imagingStudy?.technicianNotes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Notas del Técnico</h4>
                    <div className={`text-sm p-4 rounded-lg border ${useCyanTheme ? 'bg-cyan-50 border-cyan-200' : 'bg-purple-50 border-purple-200'}`}>
                      {selectedAppointment.imagingStudy.technicianNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* New Request Modal */}
        <NewRequestModal
          isOpen={showNewRequestModal}
          onClose={() => {
            setShowNewRequestModal(false);
            setSelectedDate(undefined);
          }}
          onSuccess={() => {
            loadData();
            setShowNewRequestModal(false);
            setSelectedDate(undefined);
          }}
          initialDate={selectedDate}
        />
      </motion.div>
    </div>
  );
};

export default ImagingCalendar;
