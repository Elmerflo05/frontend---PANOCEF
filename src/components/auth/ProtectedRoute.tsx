import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRoles,
  requiredPermissions,
  fallbackPath = '/login'
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission, user } = useAuth();
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const location = useLocation();

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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission requirements
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(permission)
    );

    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};