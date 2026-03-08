import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service in production
    if (import.meta.env.PROD) {
      // Here you would typically send to a logging service
      console.error('Production error:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Ups! Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-8">
              Se ha producido un error inesperado. Por favor, intenta actualizar la página 
              o contacta al soporte técnico si el problema persiste.
            </p>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <details className="text-sm">
                  <summary className="font-semibold cursor-pointer mb-2">
                    Detalles del error (solo en desarrollo)
                  </summary>
                  <div className="text-red-600 font-mono text-xs whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <br />
                        <br />
                        Component Stack:
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-clinic-primary text-white rounded-lg hover:bg-clinic-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir al inicio
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    
    // In production, send to monitoring service
    if (import.meta.env.PROD) {
      // Log to monitoring service
      console.error('Production error:', {
        error: error.toString(),
        stack: error.stack
      });
    }
  };

  return handleError;
};