import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface GuestRouteProps {
  children: React.ReactNode;
}

export const GuestRoute = ({ children }: GuestRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  // 🔧 CRÍTICO: Esperar a que termine la hidratación del store desde localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to appropriate dashboard if already authenticated
  if (isAuthenticated && user) {
    const getDefaultRoute = (role: string): string => {
      switch (role) {
        case 'super_admin':
          return '/admin/sedes';
        case 'admin':
          return '/admin/dashboard';
        case 'doctor':
          return '/clinic/dashboard';
        case 'receptionist':
          return '/clinic/appointments';
        case 'lab_technician':
          return '/laboratory/dashboard';
        case 'patient':
          return '/patient/dashboard';
        case 'external_client':
          return '/laboratory/requests';
        default:
          return '/dashboard';
      }
    };

    const route = getDefaultRoute(user.role);
    return <Navigate to={route} replace />;
  }

  return <>{children}</>;
};