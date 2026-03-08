import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { router } from '@/router';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { FullScreenLoading } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { logger } from '@/lib/logger';
import { optimizedMotionConfig } from '@/utils/animationConfig';

function App() {
  const { theme, globalLoading, setGlobalLoading } = useAppStore();
  const { refreshUser, setHasHydrated } = useAuthStore();

  // Fallback: marcar como hidratado despues de un pequeno delay
  // Por si el callback de Zustand no se ejecuta
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentState = useAuthStore.getState();
      if (!currentState._hasHydrated) {
        setHasHydrated(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [setHasHydrated]);

  // Initialize application
  useEffect(() => {
    async function initializeApp() {
      try {
        setGlobalLoading(true);

        logger.info('Iniciando aplicación...');

        // Initialize auth
        await refreshUser();

      } catch (error) {
        logger.error('Failed to initialize application', error);
      } finally {
        setGlobalLoading(false);
      }
    }

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Show loading screen during initialization
  if (globalLoading) {
    return <FullScreenLoading text="Iniciando aplicación..." />;
  }

  return (
    <ErrorBoundary>
      <MotionConfig {...optimizedMotionConfig}>
        <div className="min-h-screen bg-background text-foreground">
          <AnimatePresence mode="wait">
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="min-h-screen"
            >
              <RouterProvider router={router} />
            </motion.div>
          </AnimatePresence>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                color: theme === 'dark' ? '#f9fafb' : '#111827',
                border: '1px solid',
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
              }
            }}
          />
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
