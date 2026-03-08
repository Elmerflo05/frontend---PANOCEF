import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TestTube,
  ClipboardList,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  Plus,
  ArrowRight,
  Sparkles,
  Activity,
  TrendingUp,
  Zap,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { radiographyApi } from '@/services/api/radiographyApi';

interface DashboardStats {
  totalRequests: number;
  pendingResults: number;
  completedTotal: number;
  deliveredTotal: number;
  activeClients: number;
  averageProcessingTime: number;
  urgentRequests: number;
}

interface RecentRequest {
  id: string;
  patientName: string;
  testType: string;
  status: 'pending' | 'completed' | 'delivered' | 'urgent';
  requestDate: Date;
  expectedCompletion: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const LaboratoryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isExternalClient = user?.role === 'external_client';

  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingResults: 0,
    completedTotal: 0,
    deliveredTotal: 0,
    activeClients: 0,
    averageProcessingTime: 0,
    urgentRequests: 0
  });

  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      let allRequests: any[] = [];

      // El técnico de imágenes y todos los usuarios del módulo laboratory
      // trabajan con radiography_requests (tomografías, radiografías)
      // El external_client solo ve sus propias solicitudes (filtrado automático en backend)
      const response = await radiographyApi.getRadiographyRequests({
        limit: 1000
      });
      allRequests = (response.data || []).map((r: any) => ({
        ...r,
        status: r.request_status,
        request_date: r.request_date,
        patient_id: r.patient_id,
        priority: r.urgency || 'normal'
      }));

      const pending = allRequests.filter(r => r.status === 'pending').length;
      const completedTotal = allRequests.filter(r => r.status === 'completed').length;
      const deliveredTotal = allRequests.filter(r => r.status === 'delivered').length;

      const urgent = allRequests.filter(r => r.priority === 'urgent' || r.priority === 'high').length;
      const uniquePatients = new Set(allRequests.map(r => r.patient_id).filter(Boolean));

      const calculatedStats: DashboardStats = {
        totalRequests: allRequests.length,
        pendingResults: pending,
        completedTotal: completedTotal,
        deliveredTotal: deliveredTotal,
        activeClients: uniquePatients.size,
        averageProcessingTime: 2.5,
        urgentRequests: urgent
      };

      const recentRequestsData: RecentRequest[] = allRequests
        .slice(0, 5)
        .map(req => {
          const requestDate = new Date(req.request_date);
          const expectedDate = req.expected_completion_date
            ? new Date(req.expected_completion_date)
            : new Date(requestDate.getTime() + 3 * 24 * 60 * 60 * 1000);

          let status: 'pending' | 'completed' | 'delivered' | 'urgent' = 'pending';
          if (req.status === 'completed') status = 'completed';
          else if (req.status === 'delivered') status = 'delivered';
          else if (req.priority === 'urgent' || req.priority === 'high') status = 'urgent';

          let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
          if (req.priority === 'urgent') priority = 'urgent';
          else if (req.priority === 'high') priority = 'high';
          else if (req.priority === 'low') priority = 'low';

          let patientName = req.patient_name || 'Paciente';
          if (req.request_data?.patient) {
            const p = req.request_data.patient;
            patientName = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || patientName;
          }

          const testType = req.radiography_type || req.test_type || 'Estudio de Imágenes';

          return {
            id: req.radiography_request_id?.toString() || req.request_id?.toString() || '',
            patientName,
            testType,
            status,
            requestDate,
            expectedCompletion: expectedDate,
            priority
          };
        });

      setStats(calculatedStats);
      setRecentRequests(recentRequestsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Completado', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', icon: CheckCircle };
      case 'delivered':
        return { label: 'Entregado', bgColor: 'bg-slate-50', textColor: 'text-slate-700', borderColor: 'border-slate-200', icon: CheckCircle };
      case 'pending':
        return { label: 'En proceso', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200', icon: Clock };
      case 'urgent':
        return { label: 'Urgente', bgColor: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200', icon: AlertTriangle };
      default:
        return { label: status, bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200', icon: Clock };
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-panocef-secondary rounded-full animate-spin border-t-panocef-primary"></div>
          <Sparkles className="w-6 h-6 text-panocef-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-slate-600 font-medium">Cargando tu dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8 pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden bg-gradient-to-br from-panocef-primary via-panocef-accent to-panocef-primary rounded-2xl p-8 text-white shadow-xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-panocef-light text-sm font-medium tracking-wide uppercase">Centro de Control</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold">
                  Bienvenido, {user?.firstName || 'Usuario'}
                </h1>

                <p className="text-panocef-light text-lg max-w-md">
                  {isExternalClient
                    ? 'Gestiona tus solicitudes de imágenes y revisa los resultados de tus pacientes.'
                    : 'Administra las solicitudes del laboratorio y optimiza los tiempos de entrega.'
                  }
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate('/laboratory/new-request')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-panocef-primary rounded-xl font-semibold hover:bg-panocef-light transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    Nueva Solicitud
                  </button>
                  <button
                    onClick={() => navigate('/laboratory/results')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/30"
                  >
                    Ver Resultados
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20">
                    <TestTube className="w-16 h-16 text-white/90" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-amber-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Total Solicitudes */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-panocef-secondary transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-panocef-light to-blue-50 rounded-xl group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 text-panocef-primary" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalRequests}</p>
          <p className="text-sm text-slate-500 font-medium">Total Solicitudes</p>
        </div>

        {/* Pendientes */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            {stats.pendingResults > 0 && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                Activos
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.pendingResults}</p>
          <p className="text-sm text-slate-500 font-medium">En Proceso</p>
        </div>

        {/* Completados */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.completedTotal}</p>
          <p className="text-sm text-slate-500 font-medium">Completados</p>
        </div>

        {/* Entregados */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.deliveredTotal}</p>
          <p className="text-sm text-slate-500 font-medium">Entregados</p>
        </div>

        {/* Pacientes */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-violet-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.activeClients}</p>
          <p className="text-sm text-slate-500 font-medium">Pacientes</p>
        </div>
      </motion.div>

      {/* Urgent Alert */}
      {stats.urgentRequests > 0 && (
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-rose-900">Atenci&oacute;n Requerida</h3>
                <p className="text-sm text-rose-700">
                  {stats.urgentRequests} {stats.urgentRequests === 1 ? 'solicitud requiere' : 'solicitudes requieren'} atenci&oacute;n prioritaria
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/laboratory/requests')}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors flex items-center gap-2"
            >
              Ver ahora
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Solicitudes Recientes</h2>
                  <p className="text-sm text-slate-500 mt-1">Tus &uacute;ltimas solicitudes de im&aacute;genes</p>
                </div>
                <button
                  onClick={() => navigate('/laboratory/requests')}
                  className="text-panocef-primary hover:text-panocef-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Ver todas
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {recentRequests.length > 0 ? (
                recentRequests.map((request, index) => {
                  const statusConfig = getStatusConfig(request.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-5 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/laboratory/requests`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-panocef-light to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <TestTube className="w-6 h-6 text-panocef-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{request.patientName}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 truncate">{request.testType}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {request.requestDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        <ArrowRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-2">Sin solicitudes a&uacute;n</h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                    Crea tu primera solicitud de im&aacute;genes para comenzar a gestionar tus estudios.
                  </p>
                  <button
                    onClick={() => navigate('/laboratory/new-request')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-panocef-primary text-white rounded-xl font-medium hover:bg-panocef-dark transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Nueva Solicitud
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Acciones R&aacute;pidas</h3>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/laboratory/new-request')}
                className="w-full flex items-center gap-4 p-4 text-left bg-gradient-to-r from-panocef-light to-blue-50 hover:from-blue-50 hover:to-panocef-light rounded-xl transition-all group border border-panocef-secondary"
              >
                <div className="w-10 h-10 bg-panocef-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Nueva Solicitud</span>
                  <span className="text-xs text-slate-500">Crear estudio de im&aacute;genes</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/laboratory/requests')}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Mis Solicitudes</span>
                  <span className="text-xs text-slate-500">Ver todas las solicitudes</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/laboratory/results')}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Resultados</span>
                  <span className="text-xs text-slate-500">Descargar estudios</span>
                </div>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default LaboratoryDashboard;
