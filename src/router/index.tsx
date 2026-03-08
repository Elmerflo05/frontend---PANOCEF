import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GuestRoute } from '@/components/auth/GuestRoute';

// Lazy load components for better performance
const LoginPage = lazy(() => import('@/app/auth/LoginPage'));

// Laboratory Portal
const LaboratoryLayout = lazy(() => import('@/app/laboratory/LaboratoryLayout'));
const LaboratoryDashboard = lazy(() => import('@/app/laboratory/pages/Dashboard'));
const LaboratoryCalendar = lazy(() => import('@/app/laboratory/pages/Calendar'));
const LaboratoryRequests = lazy(() => import('@/app/laboratory/pages/Requests'));
const LaboratoryResults = lazy(() => import('@/app/laboratory/pages/Results'));
const LaboratorySubmissions = lazy(() => import('@/app/laboratory/pages/Submissions'));
const LaboratoryNewRequest = lazy(() => import('@/app/laboratory/pages/NewRequest'));
const PriceCatalog = lazy(() => import('@/app/laboratory/pages/PriceCatalog'));

// Error Pages
const NotFoundPage = lazy(() => import('@/app/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/app/errors/UnauthorizedPage'));
const ServerErrorPage = lazy(() => import('@/app/errors/ServerErrorPage'));

// Wrapper component for lazy-loaded routes
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  // Root redirect to login
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },

  // Authentication Routes
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LazyWrapper>
          <LoginPage />
        </LazyWrapper>
      </GuestRoute>
    )
  },

  // Laboratory Portal Routes
  {
    path: '/laboratory',
    element: (
      <ProtectedRoute requiredRoles={['imaging_technician', 'external_client']}>
        <LazyWrapper>
          <LaboratoryLayout />
        </LazyWrapper>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <LazyWrapper>
            <LaboratoryDashboard />
          </LazyWrapper>
        )
      },
      {
        path: 'calendar',
        element: (
          <ProtectedRoute requiredRoles={['imaging_technician']}>
            <LazyWrapper>
              <LaboratoryCalendar />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'requests',
        element: (
          <ProtectedRoute requiredRoles={['imaging_technician']}>
            <LazyWrapper>
              <LaboratoryRequests />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'new-request',
        element: (
          <ProtectedRoute requiredRoles={['imaging_technician', 'external_client']}>
            <LazyWrapper>
              <LaboratoryNewRequest />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'results',
        element: (
          <LazyWrapper>
            <LaboratoryResults />
          </LazyWrapper>
        )
      },
      {
        path: 'services',
        element: (
          <ProtectedRoute requiredRoles={['imaging_technician']}>
            <LazyWrapper>
              <PriceCatalog />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'submissions',
        element: (
          <ProtectedRoute requiredRoles={['imaging_technician', 'external_client']}>
            <LazyWrapper>
              <LaboratorySubmissions />
            </LazyWrapper>
          </ProtectedRoute>
        )
      }
    ]
  },

  // Error Routes
  {
    path: '/unauthorized',
    element: (
      <LazyWrapper>
        <UnauthorizedPage />
      </LazyWrapper>
    )
  },
  {
    path: '/server-error',
    element: (
      <LazyWrapper>
        <ServerErrorPage />
      </LazyWrapper>
    )
  },
  {
    path: '*',
    element: (
      <LazyWrapper>
        <NotFoundPage />
      </LazyWrapper>
    )
  }
]);
