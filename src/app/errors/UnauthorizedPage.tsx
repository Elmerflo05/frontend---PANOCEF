import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const UnauthorizedPage = () => {
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceso no autorizado</h2>
          <p className="text-gray-600 mb-8">
            No tienes permisos para acceder a esta página. 
            {isAuthenticated 
              ? ' Contacta al administrador si crees que esto es un error.'
              : ' Por favor, inicia sesión para continuar.'
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver atrás
            </motion.button>
            
            {isAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Cambiar usuario
              </motion.button>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-clinic-primary text-white rounded-lg hover:bg-clinic-primary/90 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Iniciar sesión
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;