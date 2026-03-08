import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, TestTube, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import ExternalClientRegister from '@/components/auth/ExternalClientRegister';
import ExpiredPasswordModal from '@/components/auth/ExpiredPasswordModal';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showExternalClientRegister, setShowExternalClientRegister] = useState(false);
  const [showExpiredPasswordModal, setShowExpiredPasswordModal] = useState(false);
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const passwordExpired = useAuthStore((state) => state.passwordExpired);

  // Detectar cuando la contrasena ha expirado y mostrar el modal
  useEffect(() => {
    if (passwordExpired && email && password) {
      setShowExpiredPasswordModal(true);
    }
  }, [passwordExpired, email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const success = await login({ email, password });

    if (!success) {
      const { error: latestError, passwordExpired: latestPwExpired } = useAuthStore.getState();
      if (latestError && !latestPwExpired) {
        toast.error(latestError);
      }
    }
  };

  const handleExpiredPasswordSuccess = () => {
    setShowExpiredPasswordModal(false);
    toast.success('Contraseña actualizada exitosamente. Por favor inicia sesión nuevamente.');
    // Limpiar el estado
    setPassword('');
    authStore.clearError();
  };

  const handleExpiredPasswordCancel = () => {
    setShowExpiredPasswordModal(false);
    authStore.clearError();
  };

  const handleRegisterSuccess = async (userEmail: string, userPassword: string, customRedirect?: string) => {
    // Auto-login after successful registration
    setEmail(userEmail);
    setPassword(userPassword);
    setShowExternalClientRegister(false);

    const success = await login({ email: userEmail, password: userPassword });
    if (success && customRedirect) {
      // Si hay un redirect personalizado, navegar a esa ruta
      navigate(customRedirect);
    } else if (!success) {
      toast.error('Error al iniciar sesión automáticamente. Inténtalo manualmente.');
    }
  };

  // If showing external client register form
  if (showExternalClientRegister) {
    return (
      <ExternalClientRegister
        onBackToLogin={() => setShowExternalClientRegister(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-clinic-primary/5 via-white to-laboratory-primary/5">
      <div className="grid items-center w-full max-w-6xl gap-8 mx-auto lg:grid-cols-2">

        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden space-y-8 lg:block"
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-clinic-primary rounded-xl">
                <TestTube className="text-white w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                PanoCef
              </h1>
            </div>

            <p className="text-xl leading-relaxed text-gray-600">
              Centro de imágenes odontológicas. Plataforma moderna para la gestión
              de estudios radiográficos y diagnóstico por imágenes.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-laboratory-primary/10">
                <TestTube className="w-5 h-5 text-laboratory-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">PanoCef</h3>
                <p className="text-sm text-gray-600">Centro de imágenes y diagnóstico radiográfico</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-clinic-primary to-laboratory-primary rounded-xl">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
              <p className="text-gray-600">Accede a tu cuenta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-primary focus:border-transparent"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-clinic-primary focus:border-transparent"
                    placeholder="Ingresa tu DNI"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute text-gray-500 transition-colors transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Tu contraseña es tu número de DNI
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-clinic-primary to-laboratory-primary hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </motion.button>
            </form>

            {/* External Client Registration Section */}
            <div className="pt-6 mt-8 border-t border-gray-200">
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-600">¿Eres odontólogo y quieres solicitar estudios?</p>
              </div>

              <button
                type="button"
                onClick={() => setShowExternalClientRegister(true)}
                className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Briefcase className="w-5 h-5" />
                Registrarse como Cliente Externo
              </button>

              <p className="mt-2 text-xs text-center text-gray-500">
                Accede al portal de laboratorio para gestionar tus solicitudes
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de Contraseña Expirada */}
      <ExpiredPasswordModal
        isOpen={showExpiredPasswordModal}
        email={email}
        currentPassword={password}
        onSuccess={handleExpiredPasswordSuccess}
        onCancel={handleExpiredPasswordCancel}
      />
    </div>
  );
};

export default LoginPage;
