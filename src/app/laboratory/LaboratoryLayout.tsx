import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  TestTube,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Calendar,
  PlusCircle,
  Inbox
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { useLogo } from '@/hooks/useLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import { SessionTimeoutProvider } from '@/components/common/SessionTimeoutProvider';

const LaboratoryLayout = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { logo, logoAlt, appName } = useLogo();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  // Colores dinámicos según el rol
  const useCyanTheme = user?.role === 'imaging_technician' || user?.role === 'external_client';
  const colors = {
    primary: useCyanTheme ? 'cyan-500' : 'purple-600',
    primaryDark: useCyanTheme ? 'cyan-600' : 'indigo-700',
    primaryLight: useCyanTheme ? 'cyan-50' : 'purple-50',
    primaryText: useCyanTheme ? 'cyan-700' : 'purple-700',
    primaryBg: useCyanTheme ? 'cyan-600' : 'purple-600',
    gradientFrom: useCyanTheme ? 'from-cyan-500' : 'from-purple-600',
    gradientTo: useCyanTheme ? 'to-teal-600' : 'to-indigo-700',
    iconBg: useCyanTheme ? 'cyan-100' : 'purple-100',
    iconText: useCyanTheme ? 'cyan-600' : 'purple-600'
  };

  const menuItems = [
    { path: '/laboratory/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/laboratory/new-request', label: '+ Nueva Solicitud', icon: PlusCircle, roles: ['super_admin', 'admin', 'imaging_technician', 'external_client'] },
    { path: '/laboratory/calendar', label: 'Calendario de Solicitudes', icon: Calendar, roles: ['admin', 'imaging_technician'] },
    // external_client usa Solicitudes Externas (sus solicitudes PanoCef)
    { path: '/laboratory/submissions', label: 'Solicitudes Externas', icon: Inbox, roles: ['super_admin', 'admin', 'imaging_technician', 'external_client'] },
    // Solicitudes Internas solo para staff interno (NO external_client)
    { path: '/laboratory/requests', label: 'Solicitudes Internas', icon: ClipboardList, roles: ['super_admin', 'admin', 'imaging_technician'] },
    { path: '/laboratory/results', label: 'Resultados', icon: TestTube },
    { path: '/laboratory/services', label: 'Servicios', icon: Settings, roles: ['super_admin', 'admin', 'imaging_technician'] }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role || '')
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SessionTimeoutProvider>
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Persistent on desktop, collapsible on mobile */}
      <aside
        className={`
          bg-white shadow-lg flex flex-col h-full overflow-hidden flex-shrink-0 w-[280px] border-r border-gray-200
          fixed lg:static inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header - Fixed */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt={logoAlt}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="px-3 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group relative
                    ${isActive
                      ? (useCyanTheme ? 'bg-cyan-50 text-cyan-700 font-semibold' : 'bg-purple-50 text-purple-700 font-semibold')
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${useCyanTheme ? 'bg-cyan-600' : 'bg-purple-600'}`} />
                  )}

                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? (useCyanTheme ? 'text-cyan-600' : 'text-purple-600') : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className="text-sm truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.profile.firstName} {user?.profile.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Hamburger button - Only visible on mobile */}
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.profile.firstName} {user?.profile.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 capitalize ${useCyanTheme ? 'bg-cyan-100 text-cyan-700' : 'bg-purple-100 text-purple-700'}`}>
                        {user?.role}
                      </span>
                    </div>
                    
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configuración
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={toggleSidebar}
          style={{ marginLeft: '0' }}
        />
      )}
    </div>
    </SessionTimeoutProvider>
  );
};

export default LaboratoryLayout;